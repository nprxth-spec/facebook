import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllFacebookTokens } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { runWithConcurrency } from "@/lib/concurrency";

const FB_API = "https://graph.facebook.com/v22.0";
const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all pages the user has access to via Facebook Graph API.
 * Supports multiple Facebook accounts connected to one user.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const { searchParams } = new URL(req.url);
        const isSync = searchParams.get("sync") === "true";

        // ── Server-side rate limiting (Only for sync=true) ──────────────────────────
        if (isSync) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { lastFbPagesSyncAt: true },
            });

            if (user?.lastFbPagesSyncAt) {
                const elapsed = Date.now() - user.lastFbPagesSyncAt.getTime();
                if (elapsed < SYNC_COOLDOWN_MS) {
                    const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
                    return NextResponse.json({ error: `rate_limited`, secondsLeft }, { status: 429 });
                }
            }
        }
        // ──────────────────────────────────────────────────────────────────────

        const fbTokens = await getAllFacebookTokens(userId);
        if (!fbTokens.length) {
            return NextResponse.json({ error: "No Facebook access token found" }, { status: 400 });
        }

        // ดึงเพจจากทุก Facebook token ที่ user เชื่อมต่อ
        const allRawPages: Array<{
            id: string;
            name: string;
            category?: string;
            access_token?: string;
            username?: string;
            fbAccountId: string;
        }> = [];

        await Promise.all(
            fbTokens.map(async ({ providerAccountId, token }) => {
                try {
                    const url = `${FB_API}/me/accounts?fields=id,name,category,access_token,username&limit=100&access_token=${token}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.error || !Array.isArray(data.data)) return;
                    for (const p of data.data) {
                        allRawPages.push({ ...p, fbAccountId: providerAccountId });
                    }
                } catch { /* ignore */ }
            })
        );

        // กรองซ้ำตาม page id
        const seen = new Set<string>();
        const uniqueRaw = allRawPages.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
        });

        // Fetch is_published + picture URL — max 5 concurrent calls
        const pages = await runWithConcurrency(uniqueRaw, 5, async (p) => {
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
                fbAccountId: p.fbAccountId,
            };
        });

        // Update server-side rate limit timestamp - Only if explicit sync
        if (isSync) {
            await prisma.user.update({
                where: { id: userId },
                data: { lastFbPagesSyncAt: new Date() },
            });
        }

        return NextResponse.json({ pages });
    } catch (error: unknown) {
        console.error("Facebook pages GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
