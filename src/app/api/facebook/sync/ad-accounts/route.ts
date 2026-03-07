import { auth } from "@/lib/auth";
import { getAllFacebookTokens } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

const FB_API = "https://graph.facebook.com/v19.0";
const SYNC_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

/**
 * ดึงบัญชีโฆษณาจาก Facebook แล้วบันทึก/อัปเดตลง ManagerAccount ในคำขอเดียว
 * Client เรียก POST นี้แล้วใช้ response เป็นรายการล่าสุด (ไม่ต้องเรียก GET manager-accounts ตามหลัง)
 */
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

  const userId = session.user.id;

  const fbTokens = await getAllFacebookTokens(userId);
  if (!fbTokens.length) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }

  const existingCount = await prisma.managerAccount.count({ where: { userId } });
  if (existingCount > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastFbAccountsSyncAt: true },
    });
    if (user?.lastFbAccountsSyncAt) {
      const elapsed = Date.now() - user.lastFbAccountsSyncAt.getTime();
      if (elapsed < SYNC_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
        const list = await prisma.managerAccount.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({
          accounts: list,
          rateLimited: true,
          secondsLeft,
        });
      }
    }
  }

  try {
    const allResults = await Promise.all(
      fbTokens.map(async ({ providerAccountId: _pid, token }) => {
        try {
          const res = await fetch(
            `${FB_API}/me/adaccounts?fields=id,name,account_id,account_status&limit=500&access_token=${token}`
          );
          const data = await res.json();
          if (data.error) return [];
          return (data.data ?? []).map(
            (acc: { id: string; name: string; account_id: string; account_status: number }) => ({
              id: acc.id,
              accountId: acc.account_id,
              name: acc.name,
              status: acc.account_status,
            })
          );
        } catch {
          return [];
        }
      })
    );

    const seen = new Set<string>();
    const fromFb = allResults.flat().filter((acc: { accountId: string }) => {
      if (seen.has(acc.accountId)) return false;
      seen.add(acc.accountId);
      return true;
    });

    for (const acc of fromFb) {
      const existing = await prisma.managerAccount.findFirst({
        where: { userId, accountId: acc.id },
      });
      if (existing) {
        await prisma.managerAccount.update({
          where: { id: existing.id },
          data: { name: acc.name, platform: "facebook" },
        });
      } else {
        await prisma.managerAccount.create({
          data: {
            userId,
            accountId: acc.id,
            name: acc.name,
            platform: "facebook",
            isActive: false,
          },
        });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastFbAccountsSyncAt: new Date() },
    });

    const accounts = await prisma.managerAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("FB sync ad-accounts error:", err);
    return NextResponse.json({ error: "Failed to sync ad accounts" }, { status: 500 });
  }
}
