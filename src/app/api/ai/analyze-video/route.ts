import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!openai) {
        return NextResponse.json({ error: "OpenAI is not configured" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const imageUrl = formData.get("imageUrl") as string | null;
        const objective = (formData.get("objective") as string) || "OUTCOME_ENGAGEMENT";
        const language = (formData.get("language") as string) || "th";

        // Build image content for GPT-4o Vision
        let imageContent: OpenAI.Chat.ChatCompletionContentPartImage | null = null;

        if (imageUrl && imageUrl.startsWith("http")) {
            // Use URL directly (works for FB library thumbnails)
            imageContent = {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" },
            };
        } else if (file) {
            // Validate: only image types accepted by GPT-4o Vision
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
            const fileType = file.type.toLowerCase();

            if (file.type.startsWith("video/")) {
                return NextResponse.json(
                    { error: "กรุณาใช้รูปภาพ (PNG, JPG, WEBP) ไม่ใช่ไฟล์วิดีโอ — AI วิเคราะห์ได้แค่รูปภาพ" },
                    { status: 400 }
                );
            }

            if (!allowedTypes.includes(fileType) && !fileType.startsWith("image/")) {
                return NextResponse.json(
                    { error: `ไฟล์ประเภท '${file.type}' ไม่รองรับ กรุณาใช้รูปแบบ PNG, JPG, GIF หรือ WEBP` },
                    { status: 400 }
                );
            }

            // Convert image to base64
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const mimeType = allowedTypes.includes(fileType) ? fileType : "image/jpeg";

            imageContent = {
                type: "image_url",
                image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: "high",
                },
            };
        }

        if (!imageContent) {
            return NextResponse.json({ error: "No image or file provided" }, { status: 400 });
        }

        const objectiveMap: Record<string, string> = {
            OUTCOME_ENGAGEMENT: "Engagement (กระตุ้นการมีส่วนร่วม)",
            OUTCOME_TRAFFIC: "Traffic (เพิ่มการเข้าชมเว็บ)",
            OUTCOME_LEADS: "Lead Generation (รวบรวม Leads)",
            OUTCOME_AWARENESS: "Awareness (สร้างการรับรู้แบรนด์)",
            OUTCOME_SALES: "Sales (กระตุ้นยอดขาย)",
        };
        const objectiveLabel = objectiveMap[objective] || objective;
        const isThai = language === "th";

        const systemPrompt = `You are an expert Thai Facebook Ads copywriter and audience strategist.
You analyze images/thumbnails from Facebook ad creatives and provide:
1. High-converting Thai ad captions optimized for the given campaign objective
2. Compelling short headlines
3. Precise audience targeting recommendations

Always respond in valid JSON only. No markdown, no explanations outside JSON.`;

        const userPrompt = `Analyze this ad creative image/thumbnail for a Facebook campaign.

Campaign Objective: ${objectiveLabel}
Language preference: ${isThai ? "Thai (ภาษาไทย)" : "English"}

Based on what you see in this image, provide:
1. A compelling ${isThai ? "Thai" : "English"} ad caption (primary text) — 2-3 sentences, conversational, with emojis appropriate for Thai Facebook ads
2. A short punchy headline — max 40 chars
3. Target audience: suggest 4-8 Facebook interest names in ENGLISH (for Meta targeting API), suitable age range

Return ONLY this JSON structure:
{
  "caption": "...",
  "headline": "...",
  "reasoning": "Brief explanation of why this audience & copy fits the creative (1-2 sentences in Thai)",
  "audience": {
    "ageMin": 20,
    "ageMax": 45,
    "interests": ["Interest1", "Interest2", "Interest3", "Interest4"]
  }
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        imageContent,
                        { type: "text", text: userPrompt },
                    ],
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.75,
            max_tokens: 800,
        });

        const raw = response.choices[0]?.message?.content;
        if (!raw) throw new Error("No response from AI");

        const result = JSON.parse(raw);

        return NextResponse.json({
            caption: result.caption || "",
            headline: result.headline || "",
            reasoning: result.reasoning || "",
            audience: {
                ageMin: result.audience?.ageMin || 20,
                ageMax: result.audience?.ageMax || 45,
                interests: Array.isArray(result.audience?.interests) ? result.audience.interests : [],
            },
        });
    } catch (e: any) {
        console.error("[AI Analyze Video] Error:", e.message);
        const is429 = e?.status === 429 || e?.message?.includes("429");
        return NextResponse.json(
            {
                error: is429
                    ? "AI quota exceeded — please try again later"
                    : `AI analysis failed: ${e.message}`,
            },
            { status: is429 ? 429 : 500 }
        );
    }
}
