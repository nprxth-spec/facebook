import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getFacebookToken(session.user.id);
  if (!token) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }

  try {
    // ดึงรายการ ad accounts ทั้งหมดของ user
    const res = await fetch(
      `${FB_API}/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name&limit=500&access_token=${token}`
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // account_status: 1=ACTIVE, 2=DISABLED, 3=UNSETTLED, 7=PENDING_CLOSURE, 9=IN_GRACE_PERIOD
    const accounts = (data.data ?? []).map((acc: {
      id: string;
      name: string;
      account_id: string;
      account_status: number;
      currency: string;
      timezone_name: string;
    }) => ({
      id: acc.id,           // act_XXXXXXX
      accountId: acc.account_id,
      name: acc.name,
      status: acc.account_status,
      isActive: acc.account_status === 1,
      currency: acc.currency,
      timezone: acc.timezone_name,
    }));

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("FB ad accounts error:", err);
    return NextResponse.json({ error: "Failed to fetch ad accounts" }, { status: 500 });
  }
}
