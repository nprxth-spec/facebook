import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeFacebookToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";

/**
 * GET /api/auth/link-facebook/callback
 * รับ callback จาก Facebook OAuth, exchange code เป็น token,
 * แล้วบันทึก Account ใหม่ผูกกับ userId ของ user ที่ login อยู่
 */
export async function GET(req: Request) {
    const reqUrl = new URL(req.url);
    const origin = reqUrl.origin;
    const { searchParams } = reqUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    const settingsUrl = `${origin}/settings?tab=connections`;
    const errorUrl = `${origin}/settings?tab=connections&error=facebook_link_failed`;
    const redirectUri = `${origin}/api/auth/link-facebook/callback`;

    // User ยกเลิก OAuth
    if (errorParam) {
        return NextResponse.redirect(`${settingsUrl}&error=cancelled`);
    }

    if (!code) {
        return NextResponse.redirect(errorUrl);
    }

    // ── CSRF check ────────────────────────────────────────────────────────────
    const cookieHeader = req.headers.get("cookie") ?? "";
    const storedState = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("fb_link_state="))
        ?.split("=")[1];

    if (!storedState || storedState !== state) {
        console.warn("[link-facebook] State mismatch — possible CSRF attempt");
        return NextResponse.redirect(errorUrl);
    }
    // ────────────────────────────────────────────────────────────────────────

    // ดึง session ของ user ที่ login อยู่
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(`${origin}/login`);
    }
    const userId = session.user.id;

    const appId = process.env.AUTH_FACEBOOK_ID!;
    const appSecret = process.env.AUTH_FACEBOOK_SECRET!;

    try {
        // Exchange authorization code → short-lived token
        const tokenRes = await fetch(
            `${FB_API}/oauth/access_token?` +
            new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code,
            })
        );
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("[link-facebook] Token exchange error:", tokenData.error);
            return NextResponse.redirect(errorUrl);
        }

        const shortToken: string = tokenData.access_token;

        // Exchange short-lived → long-lived token (60 วัน)
        const longLivedData = await exchangeFacebookToken(shortToken);
        const longToken = longLivedData.access_token;
        const expiresAt = Math.floor(Date.now() / 1000) + longLivedData.expires_in;

        // ดึง Facebook user ID (providerAccountId)
        const meRes = await fetch(`${FB_API}/me?fields=id&access_token=${longToken}`);
        const meData = await meRes.json();

        if (!meData.id) {
            console.error("[link-facebook] Could not get Facebook user ID:", meData);
            return NextResponse.redirect(errorUrl);
        }

        const providerAccountId: string = meData.id;

        // ตรวจว่าบัญชี Facebook นี้ถูก link ไว้กับ user นี้แล้วหรือไม่
        const existing = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: "facebook",
                    providerAccountId,
                },
            },
        });

        const clearState = (res: NextResponse) => {
            res.cookies.set("fb_link_state", "", { httpOnly: true, maxAge: 0, path: "/" });
            return res;
        };

        if (existing) {
            if (existing.userId === userId) {
                // บัญชีนี้ link กับ user นี้แล้ว — อัปเดต token ใหม่
                await prisma.account.update({
                    where: { id: existing.id },
                    data: { access_token: longToken, expires_at: expiresAt },
                });
                return clearState(NextResponse.redirect(`${settingsUrl}&success=reconnected`));
            } else {
                // บัญชีนี้ผูกกับ user อื่น — ไม่อนุญาต
                console.warn("[link-facebook] Facebook account already linked to another user");
                return clearState(NextResponse.redirect(`${settingsUrl}&error=already_linked_to_another_user`));
            }
        }

        // สร้าง Account row ใหม่ ผูกกับ userId ของ user ที่ login อยู่
        await prisma.account.create({
            data: {
                userId,
                type: "oauth",
                provider: "facebook",
                providerAccountId,
                access_token: longToken,
                expires_at: expiresAt,
                token_type: "bearer",
                scope: [
                    "email",
                    "public_profile",
                    "ads_read",
                    "ads_management",
                    "business_management",
                    "read_insights",
                    "pages_messaging",
                    "pages_manage_metadata",
                    "pages_read_engagement",
                ].join(","),
            },
        });

        console.log(`[link-facebook] Linked FB account ${providerAccountId} to user ${userId}`);
        return clearState(NextResponse.redirect(`${settingsUrl}&success=linked`));
    } catch (err) {
        console.error("[link-facebook] Unexpected error:", err);
        return NextResponse.redirect(errorUrl);
    }
}
