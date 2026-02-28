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

        // Fetch pages (accounts) the user manages
        const url = `${FB_API}/me/accounts?fields=id,name,category,access_token,tasks&limit=100&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.warn("[facebook-pages] API error:", data.error);
            return NextResponse.json(
                { error: data.error.message || "Failed to fetch Facebook pages" },
                { status: 400 }
            );
        }

        // Process paginated data if necessary (simplified for most use cases with <100 pages)
        const rawPages = data.data || [];

        // We filter for pages where the user has CREATE_CONTENT or MANAGE permissions, 
        // or just return them all if that logic is too strict for engagement creation.
        // For Custom Audiences, just having them in the list usually indicates enough permission.
        const pages = rawPages.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            hasToken: !!p.access_token,
        }));

        return NextResponse.json({ pages });
    } catch (error: any) {
        console.error("Facebook pages GET route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
