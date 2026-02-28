import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";
const SYNC_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // ── Server-side rate limiting ────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastFbAccountsSyncAt: true },
  });
  if (user?.lastFbAccountsSyncAt) {
    const elapsed = Date.now() - user.lastFbAccountsSyncAt.getTime();
    if (elapsed < SYNC_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json({ error: "rate_limited", secondsLeft }, { status: 429 });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const token = await getFacebookToken(userId);
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

    // Stamp last sync time (for server-side rate limiting)
    await prisma.user.update({ where: { id: userId }, data: { lastFbAccountsSyncAt: new Date() } });

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("FB ad accounts error:", err);
    return NextResponse.json({ error: "Failed to fetch ad accounts" }, { status: 500 });
  }
}
