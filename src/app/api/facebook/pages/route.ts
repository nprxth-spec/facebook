import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { runWithConcurrency } from "@/lib/concurrency";

const FB_API = "https://graph.facebook.com/v22.0";
const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all pages the user has access to via Facebook Graph API.
 * Includes server-side rate limiting (10-min cooldown per user via DB timestamp).
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // ── Server-side rate limiting ──────────────────────────────────────────
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastFbPagesSyncAt: true },
        });

        if (user?.lastFbPagesSyncAt) {
            const elapsed = Date.now() - user.lastFbPagesSyncAt.getTime();
            if (elapsed < SYNC_COOLDOWN_MS) {
                const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
                return NextResponse.json(
                    { error: `rate_limited`, secondsLeft },
                    { status: 429 }
                );
            }
        }
        // ──────────────────────────────────────────────────────────────────────

        const accessToken = await getFacebookToken(userId);
        if (!accessToken) {
            return NextResponse.json({ error: "No Facebook access token found" }, { status: 400 });
        }

        // Fetch pages the user manages
        const url = `${FB_API}/me/accounts?fields=id,name,category,access_token,username&limit=100&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.warn("[facebook-pages] API error:", data.error);
            return NextResponse.json(
                { error: data.error.message || "Failed to fetch Facebook pages" },
                { status: 400 }
            );
        }

        const rawPages: Array<{
            id: string;
            name: string;
            category?: string;
            access_token?: string;
            username?: string;
        }> = data.data || [];

        // Fetch is_published + picture URL — max 5 concurrent calls
        const pages = await runWithConcurrency(rawPages, 5, async (p) => {
            let pageStatus: string | null = null;
            let pictureUrl: string | null = null;

            if (p.access_token) {
                try {
                    const detailRes = await fetch(
                        `${FB_API}/${p.id}?fields=is_published,picture.type(square){url}&access_token=${p.access_token}`
                    );
                    const detail = await detailRes.json();
                    if (typeof detail.is_published === "boolean") {
                        pageStatus = detail.is_published ? "PUBLISHED" : "UNPUBLISHED";
                    }
                    pictureUrl = detail.picture?.data?.url ?? null;
                } catch {
                    // ignore
                }
            }

            return {
                id: p.id,
                name: p.name,
                username: p.username ?? null,
                category: p.category,
                pageStatus,
                pictureUrl,
                hasToken: !!p.access_token,
            };
        });

        // Update server-side rate limit timestamp
        await prisma.user.update({
            where: { id: userId },
            data: { lastFbPagesSyncAt: new Date() },
        });

        return NextResponse.json({ pages });
    } catch (error: unknown) {
        console.error("Facebook pages GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
