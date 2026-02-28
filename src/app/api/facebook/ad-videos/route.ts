import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getFacebookToken(session.user.id);
    if (!token) return NextResponse.json({ error: "No Facebook token" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get("adAccountId")?.trim();
    if (!adAccountId) return NextResponse.json({ videos: [] });

    const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    const url = new URL(`${FB_API}/${actId}/advideos`);
    url.searchParams.set("fields", "id,title,source,thumbnails,created_time,length");
    url.searchParams.set("limit", "50");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) return NextResponse.json({ videos: [], error: data.error.message });

    const videos = (data.data || []).map((v: any) => ({
        id: v.id,
        title: v.title || null,
        source: v.source || null,
        thumbnail: v.thumbnails?.data?.[0]?.uri || null,
        created_time: v.created_time || null,
        length: v.length || null,
    }));

    return NextResponse.json({ videos });
}
