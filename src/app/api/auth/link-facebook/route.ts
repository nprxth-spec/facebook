import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/auth/link-facebook
 * เริ่ม Facebook OAuth flow สำหรับ link บัญชีใหม่เข้ากับ user ที่ login อยู่
 * (ไม่ใช่ signIn() ของ NextAuth ซึ่งจะพยายาม sign in as new user)
 */
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const appId = process.env.AUTH_FACEBOOK_ID!;
    // Auto-detect base URL จาก request เพื่อรองรับทั้ง localhost และ production
    const origin = new URL(req.url).origin;
    const callbackUrl = `${origin}/api/auth/link-facebook/callback`;

    // สร้าง state token เพื่อป้องกัน CSRF
    const state = crypto.randomBytes(32).toString("hex");

    const fbAuthUrl =
        `https://www.facebook.com/v19.0/dialog/oauth?` +
        new URLSearchParams({
            client_id: appId,
            redirect_uri: callbackUrl,
            state,
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
        }).toString();

    const response = NextResponse.redirect(fbAuthUrl);

    // Store state ใน cookie (short-lived, 10 min)
    response.cookies.set("fb_link_state", state, {
        httpOnly: true,
        secure: origin.startsWith("https"),
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });

    return response;
}
