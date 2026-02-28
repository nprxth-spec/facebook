import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";

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

        // Fetch pages (accounts) the user manages - include username and verification_status
        const url = `${FB_API}/me/accounts?fields=id,name,category,access_token,username,verification_status&limit=100&access_token=${accessToken}`;
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
            verification_status?: string;
        }> = data.data || [];

        // Fetch page_status individually using page access tokens
        const pages = await Promise.all(rawPages.map(async (p) => {
            let pageStatus: string | null = null;
            if (p.access_token) {
                try {
                    const detailRes = await fetch(`${FB_API}/${p.id}?fields=page_status&access_token=${p.access_token}`);
                    const detailData = await detailRes.json();
                    pageStatus = detailData.page_status ?? null;
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
                hasToken: !!p.access_token,
            };
        }));

        return NextResponse.json({ pages });
    } catch (error: any) {
        console.error("Facebook pages GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
