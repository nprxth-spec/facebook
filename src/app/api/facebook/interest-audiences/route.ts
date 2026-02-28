import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFacebookToken } from "@/lib/tokens";
import OpenAI from "openai";

// Initialize OpenAI client (conditional for build time)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

const FB_API = "https://graph.facebook.com/v22.0";

// Helper function to search interest by name using Meta API
async function searchInterestId(interestName: string, accessToken: string): Promise<{ id: string; name: string } | null> {
    try {
        const url = `${FB_API}/search?type=adinterest&q=${encodeURIComponent(interestName)}&limit=1&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.data?.[0]) {
            const item = data.data[0];
            return { id: String(item.id), name: item.name || interestName };
        }
        return null;
    } catch {
        return null;
    }
}

// Validate multiple interests against Meta API
async function validateInterests(interestNames: string[], accessToken: string): Promise<Array<{ id: string; name: string }>> {
    const result: Array<{ id: string; name: string }> = [];
    for (const name of interestNames) {
        const found = await searchInterestId(name, accessToken);
        if (found) result.push(found);
    }
    return result;
}

/** GET: List user's saved interest presets from DataBase */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const presets = await prisma.interestAudiencePreset.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ presets: Array.isArray(presets) ? presets : [] });
    } catch (e: any) {
        console.error("Interest audiences GET error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}

/** POST: Generate AI Interests | Validate | Save | Delete */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { action = "generate", description, name, interests, presetId, adAccountId, manualInterests } = body;

        // --- Action: Generate (AI or Manual) ---
        if (action === "generate") {
            let interestNames: string[] = [];
            let suggestedName: string | undefined;

            // Manual input provided
            if (manualInterests && typeof manualInterests === "string" && manualInterests.trim().length > 0) {
                interestNames = manualInterests.split(/[,،、;]+/).map((s) => s.trim()).filter(Boolean);
            }
            // AI Generation via OpenAI
            else if (description && typeof description === "string" && description.trim().length >= 5) {
                try {
                    const prompt = `You are a Facebook Ads targeting expert. The user describes their target audience in natural language (Thai or English):

"${description}"

**Your task:**
1. Infer the target audience's interests, hobbies, and behaviors.
2. Output 5-12 Facebook interest names in ENGLISH that match Meta's adinterest taxonomy.
3. Use broad, well-known interest names that exist in Facebook targeting (e.g., "Fashion", "Beauty", "Online Shopping", "Skincare", "Makeup", "Shopping", "Health").
4. Avoid overly specific or niche phrases that may not exist in Meta's interest database.
5. If the description is in Thai, suggest a short preset name in Thai. Otherwise suggest in English.
6. Return the response ONLY in raw valid JSON format without markdown codeblocks or prefixes like this:
{
  "interests": ["Interest 1", "Interest 2"],
  "suggestedName": "Short Preset Name"
}`;

                    if (!openai) {
                        return NextResponse.json({ error: "OpenAI is not configured." }, { status: 500 });
                    }

                    const aiResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: prompt }],
                        response_format: { type: "json_object" }, // Guarantee JSON
                        temperature: 0.7,
                    });

                    const content = aiResponse.choices[0].message.content;
                    if (content) {
                        const parsed = JSON.parse(content);
                        interestNames = parsed.interests || [];
                        suggestedName = parsed.suggestedName;
                    }
                } catch (aiErr: any) {
                    console.error("OpenAI Error:", aiErr);
                    const is429 = aiErr?.message?.includes("429") || aiErr?.status === 429;
                    return NextResponse.json(
                        {
                            error: is429 ? "AI quota exceeded. Please try again later or input manually." : "AI processing failed.",
                            code: is429 ? "AI_QUOTA_EXCEEDED" : "AI_ERROR",
                        },
                        { status: is429 ? 429 : 500 }
                    );
                }
            }

            if (interestNames.length === 0) {
                return NextResponse.json(
                    { error: "Description required (min 5 chars) or manualInterests (comma-separated)" },
                    { status: 400 }
                );
            }

            // Validate against Facebook Graph API if adAccountId is passed
            let validated: Array<{ id: string; name: string }> = interestNames.map((n) => ({ id: "", name: n }));

            if (adAccountId) {
                const accessToken = await getFacebookToken(session.user.id);
                if (accessToken) {
                    validated = await validateInterests(interestNames, accessToken);
                }
            }

            return NextResponse.json({ interests: interestNames, suggestedName, validated });
        }

        // --- Action: Validate ---
        if (action === "validate") {
            const names = Array.isArray(body.interestNames) ? body.interestNames : (interests || []).map((i: any) => (typeof i === "string" ? i : i?.name));
            if (!adAccountId || names.length === 0) {
                return NextResponse.json({ error: "adAccountId and interestNames required" }, { status: 400 });
            }

            const accessToken = await getFacebookToken(session.user.id);
            if (!accessToken) return NextResponse.json({ error: "No valid Facebook connection" }, { status: 400 });

            const validated = await validateInterests(names, accessToken);
            return NextResponse.json({ validated });
        }

        // --- Action: Save Preset ---
        if (action === "save") {
            if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
            const list = Array.isArray(interests) ? interests : [];
            const validInterests = list
                .filter((i: any) => i && (i.id || i.name))
                .map((i: any) => ({ id: String(i.id || ""), name: String(i.name || "") }));

            const preset = await prisma.interestAudiencePreset.create({
                data: {
                    userId: session.user.id,
                    name: name.trim(),
                    description: typeof description === "string" ? description : null,
                    interests: validInterests,
                },
            });
            return NextResponse.json({ preset });
        }

        // --- Action: Delete Preset ---
        if (action === "delete") {
            if (!presetId) return NextResponse.json({ error: "presetId required" }, { status: 400 });
            await prisma.interestAudiencePreset.deleteMany({
                where: { id: presetId, userId: session.user.id },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (e: any) {
        console.error("Interest audiences POST error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
