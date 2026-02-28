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
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ interests: [] });

    const url = new URL(`${FB_API}/search`);
    url.searchParams.set("type", "adinterest");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "20");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) return NextResponse.json({ interests: [] });

    const interests = (data.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        audience_size: i.audience_size_lower_bound,
    }));

    return NextResponse.json({ interests });
}
