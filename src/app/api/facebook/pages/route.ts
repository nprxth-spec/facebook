import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { runWithConcurrency } from "@/lib/concurrency";

const FB_API = "https://graph.facebook.com/v22.0";

/**
 * Fetch all pages the user has access to via Facebook Graph API.
 * Requires `pages_show_list` or `pages_read_engagement` permission.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accessToken = await getFacebookToken(session.user.id);
        if (!accessToken) {
            return NextResponse.json({ error: "No Facebook access token found" }, { status: 400 });
        }

        // Fetch pages (accounts) the user manages — include username and access_token
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

        // Fetch is_published + picture URL using page access tokens
        // Limit to 5 concurrent calls to avoid flooding Facebook API
        const pages = await runWithConcurrency(rawPages, 5, async (p) => {
            let pageStatus: string | null = null;
            let pictureUrl: string | null = null;

            if (p.access_token) {
                try {
                    const detailRes = await fetch(
                        `${FB_API}/${p.id}?fields=is_published,picture.type(square){url}&access_token=${p.access_token}`
                    );
                    const detailData = await detailRes.json();

                    if (typeof detailData.is_published === "boolean") {
                        pageStatus = detailData.is_published ? "PUBLISHED" : "UNPUBLISHED";
                    }
                    pictureUrl = detailData.picture?.data?.url ?? null;
                } catch {
                    // ignore — page gets null status/picture
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

        return NextResponse.json({ pages });
    } catch (error: unknown) {
        console.error("Facebook pages GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
