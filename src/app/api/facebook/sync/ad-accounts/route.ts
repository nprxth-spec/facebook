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

    // โหลดบัญชีที่มีอยู่ครั้งเดียว (แทนการ findFirst ทีละบัญชี)
    const existingList = await prisma.managerAccount.findMany({
      where: { userId },
      select: { id: true, accountId: true },
    });
    const byAccountId = new Map(existingList.map((e) => [e.accountId, e]));

    const toCreate: { userId: string; accountId: string; name: string; platform: string; isActive: boolean }[] = [];
    const toUpdate: { id: string; name: string }[] = [];

    for (const acc of fromFb) {
      const existing = byAccountId.get(acc.id);
      if (existing) {
        toUpdate.push({ id: existing.id, name: acc.name });
      } else {
        toCreate.push({
          userId,
          accountId: acc.id,
          name: acc.name,
          platform: "facebook",
          isActive: false,
        });
      }
    }

    if (toCreate.length > 0) {
      await prisma.managerAccount.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(({ id, name }) =>
          prisma.managerAccount.update({
            where: { id },
            data: { name, platform: "facebook" },
          })
        )
      );
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
