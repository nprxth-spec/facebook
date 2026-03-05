import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { assertSameOrigin } from "@/lib/security";
import { stripe } from "@/lib/stripe";
import { BILLING_PLANS, getPlanConfig, type PlanId } from "@/lib/billing-plans";
import { prisma } from "@/lib/db";

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ป้องกัน CSRF สำหรับการยิง AI วิเคราะห์ (ลดโอกาสโดนยิง request จากภายนอกโดยไม่รู้ตัว)
    assertSameOrigin(req);

    if (!openai) {
        return NextResponse.json({ error: "OpenAI is not configured" }, { status: 500 });
    }

    // ── Plan & AI credits guardrails ────────────────────────────────────────
    let planId: PlanId = "free";
    try {
        const search = await stripe.customers.search({
            query: `email:\"${session.user.email}\"`,
            limit: 1,
        });
        const customer = search.data[0];
        if (customer) {
            const subs = await stripe.subscriptions.list({
                customer: customer.id,
                status: "all",
                limit: 5,
            });
            const activeSub = subs.data.find((s) =>
                ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
                    String(s.status || "").toLowerCase(),
                ),
            );
            const metaPlan = (activeSub?.metadata as any)?.planId as PlanId | null;
            if (metaPlan === "pro" || metaPlan === "business") {
                planId = metaPlan;
            }
        }
    } catch {
        planId = "free";
    }
    const planConfig = getPlanConfig(planId);

    // Trial history (anti-abuse by email)
    let trial = await prisma.trialHistory.findUnique({
        where: { email: session.user.email! },
    });
    if (!trial) {
        const now = new Date();
        trial = await prisma.trialHistory.create({
            data: {
                email: session.user.email!,
                firstSignupAt: now,
                freeTrialStartedAt: now,
            },
        });
    }

    const trialStart = trial.freeTrialStartedAt;
    const trialExpiredAt =
        trial.freeTrialExpiredAt ??
        new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const inTrialWindow = now <= trialExpiredAt;

    const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}`;
    let aiUsage = await prisma.aiUsage.findUnique({
        where: { userId_month: { userId: session.user.id, month: currentMonth } },
    });
    if (!aiUsage) {
        aiUsage = await prisma.aiUsage.create({
            data: { userId: session.user.id, month: currentMonth, used: 0 },
        });
    }

    let remainingCredits = 0;
    if (planId === "free" && inTrialWindow) {
        const totalTrialUsage = await prisma.aiUsage.aggregate({
            where: { userId: session.user.id },
            _sum: { used: true },
        });
        const usedTrial = totalTrialUsage._sum.used ?? 0;
        remainingCredits = BILLING_PLANS.free.aiCreditsTrialTotal - usedTrial;
    } else if (planId === "pro" || planId === "business") {
        remainingCredits = planConfig.aiCreditsPerMonth - (aiUsage.used ?? 0);
    } else {
        remainingCredits = 0;
    }

    if (remainingCredits <= 0) {
        return NextResponse.json(
            {
                error:
                    planId === "free"
                        ? "คุณใช้เครดิต AI สำหรับช่วงทดลองครบแล้ว กรุณาอัปเกรดแพ็กเกจเพื่อใช้ต่อ"
                        : "คุณใช้เครดิต AI ของเดือนนี้ครบแล้ว กรุณารอเดือนถัดไปหรืออัปเกรดแพ็กเกจ",
                code: "AI_CREDITS_EXHAUSTED",
            },
            { status: 429 },
        );
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
4. A Messenger welcome greeting in ${isThai ? "Thai" : "English"} (e.g., สวัสดีค่ะ สนใจสินค้าตัวไหนสอบถามได้เลยนะคะ)
5. 3 short Messenger icebreaker questions in ${isThai ? "Thai" : "English"} (e.g., สนใจสั่งซื้อค่ะ, ขอทราบราคาค่ะ, มีโปรโมชั่นไหมคะ)

Return ONLY this JSON structure:
{
  "caption": "...",
  "headline": "...",
  "reasoning": "Brief explanation of why this audience & copy fits the creative (1-2 sentences in Thai)",
  "audience": {
    "ageMin": 20,
    "ageMax": 45,
    "interests": ["Interest1", "Interest2", "Interest3", "Interest4"]
  },
  "messenger": {
    "greeting": "...",
    "questions": ["...", "...", "..."]
  }
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
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

        await prisma.aiUsage.update({
            where: { userId_month: { userId: session.user.id, month: currentMonth } },
            data: { used: { increment: 1 } },
        });

        return NextResponse.json({
            caption: result.caption || "",
            headline: result.headline || "",
            reasoning: result.reasoning || "",
            audience: {
                ageMin: result.audience?.ageMin || 20,
                ageMax: result.audience?.ageMax || 45,
                interests: Array.isArray(result.audience?.interests) ? result.audience.interests : [],
            },
            messenger: {
                greeting: result.messenger?.greeting || "",
                questions: Array.isArray(result.messenger?.questions) ? result.messenger.questions : [],
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
