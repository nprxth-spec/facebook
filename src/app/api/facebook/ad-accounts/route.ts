import { auth } from "@/lib/auth";
import { getAllFacebookTokens } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v19.0";
const SYNC_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const isSync = searchParams.get("sync") === "true";

  // ── Server-side rate limiting (Only for sync=true, and only if userมี ManagerAccount อยู่แล้ว) ──
  // ถ้าผู้ใช้ยังไม่มี ManagerAccount เลย ให้ยอมให้ sync ได้ทันทีเสมอ เพื่อไม่ให้เกิดเคส "คูลดาวน์แต่ไม่มีบัญชี"
  if (isSync) {
    const existingAccountsCount = await prisma.managerAccount.count({
      where: { userId },
    });

    if (existingAccountsCount > 0) {
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
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const fbTokens = await getAllFacebookTokens(userId);
  if (!fbTokens.length) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }

  try {
    // ดึง ad accounts จากทุก Facebook token ที่ user เชื่อมต่อ
    const allResults = await Promise.all(
      fbTokens.map(async ({ providerAccountId, token }) => {
        try {
          const res = await fetch(
            `${FB_API}/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name,spend_cap,amount_spent,funding_source_details{display_string}&limit=500&access_token=${token}`
          );
          const data = await res.json();
          if (data.error) return [];
          return (data.data ?? []).map((acc: {
            id: string;
            name: string;
            account_id: string;
            account_status: number;
            currency: string;
            timezone_name: string;
            spend_cap?: string | null;
            amount_spent?: string | null;
            funding_source_details?: { display_string?: string } | null;
          }) => {
            const display = acc.funding_source_details?.display_string ?? "";
            const paymentMethods: { brand: string; last4: string | null }[] = [];

            if (display) {
              const regex = /(Visa|Mastercard|MasterCard|American Express|Amex|JCB|Discover|Maestro|UnionPay)[^\d]*(\d{4})/gi;
              let m: RegExpExecArray | null;
              while ((m = regex.exec(display)) !== null) {
                paymentMethods.push({ brand: m[1], last4: m[2] });
              }

              if (!paymentMethods.length) {
                paymentMethods.push({ brand: display, last4: null });
              }
            }

            return {
              id: acc.id,           // act_XXXXXXX
              accountId: acc.account_id,
              name: acc.name,
              status: acc.account_status,
              isActive: acc.account_status === 1,
              currency: acc.currency,
              timezone: acc.timezone_name,
              spendCap: acc.spend_cap ?? null,
              amountSpent: acc.amount_spent ?? null,
              paymentMethods,
              fbAccountId: providerAccountId,
            };
          });
        } catch {
          return [];
        }
      })
    );

    // รวมผลและกรองซ้ำตาม accountId
    const seen = new Set<string>();
    const accounts = allResults.flat().filter((acc) => {
      if (seen.has(acc.accountId)) return false;
      seen.add(acc.accountId);
      return true;
    });

    // Stamp last sync time (for server-side rate limiting) - Only if explicit sync
    if (isSync) {
      await prisma.user.update({ where: { id: userId }, data: { lastFbAccountsSyncAt: new Date() } });
    }

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("FB ad accounts error:", err);
    return NextResponse.json({ error: "Failed to fetch ad accounts" }, { status: 500 });
  }
}
