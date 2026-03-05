import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getFacebookToken } from "@/lib/tokens";
import { assertSameOrigin } from "@/lib/security";

const FB_API = "https://graph.facebook.com/v19.0";

interface UpdateStatusBody {
  adId: string;
  status: "ACTIVE" | "PAUSED";
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateStatusBody;
  try {
    body = (await req.json()) as UpdateStatusBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { adId, status } = body;

  if (!adId || !status) {
    return NextResponse.json(
      { error: "Missing adId or status" },
      { status: 400 }
    );
  }

  if (status !== "ACTIVE" && status !== "PAUSED") {
    return NextResponse.json(
      { error: "Unsupported status. Only ACTIVE and PAUSED are allowed." },
      { status: 400 }
    );
  }

  const token = await getFacebookToken(session.user.id);
  if (!token) {
    return NextResponse.json(
      { error: "Facebook account not connected" },
      { status: 400 }
    );
  }

  try {
    const form = new FormData();
    form.append("status", status);
    form.append("access_token", token);

    const res = await fetch(`${FB_API}/${adId}`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      const err = data.error || {};
      const msg =
        err.error_user_msg ||
        err.message ||
        "Failed to update ad status on Facebook";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true, status });
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Unexpected error while updating status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

