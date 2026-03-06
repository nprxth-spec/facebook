import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllFacebookTokens } from "@/lib/tokens";
import { assertSameOrigin } from "@/lib/security";

const FB_API = "https://graph.facebook.com/v19.0";

type Body =
  | { accountId: string; action: "change"; newLimit: number }
  | { accountId: string; action: "reset" | "delete" };

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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { accountId, action } = body;
  if (!accountId) {
    return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  }

  const numericId = accountId.startsWith("act_") ? accountId.slice(4) : accountId;

  if (action === "change") {
    if (typeof body.newLimit !== "number" || !Number.isFinite(body.newLimit) || body.newLimit <= 0) {
      return NextResponse.json({ error: "Invalid newLimit" }, { status: 400 });
    }
  }

  const fbTokens = await getAllFacebookTokens(session.user.id);
  if (!fbTokens.length) {
    return NextResponse.json({ error: "Facebook not connected" }, { status: 400 });
  }

  const paramsBase: Record<string, string> = {};
  if (action === "change") {
    // newLimit อยู่ในหน่วยปกติ เช่น 15 = 15 USD
    paramsBase["spend_cap"] = String(body.newLimit);
  } else if (action === "reset") {
    paramsBase["spend_cap_action"] = "reset";
  } else if (action === "delete") {
    paramsBase["spend_cap_action"] = "delete";
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  let lastError: string | null = null;

  for (const { token } of fbTokens) {
    const params = new URLSearchParams({
      ...paramsBase,
      access_token: token,
    });

    const res = await fetch(`${FB_API}/act_${encodeURIComponent(numericId)}`, {
      method: "POST",
      body: params,
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && !data.error) {
      return NextResponse.json({ success: true });
    }

    lastError =
      (data && (data.error?.message || data.error?.error_user_msg)) ||
      res.statusText ||
      "Unknown error";
  }

  return NextResponse.json({ error: lastError ?? "Failed to update spend cap" }, { status: 400 });
}

