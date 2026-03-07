import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllFacebookTokens } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import { runWithConcurrency } from "@/lib/concurrency";
import { assertSameOrigin } from "@/lib/security";

const FB_API = "https://graph.facebook.com/v22.0";
const SYNC_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

/**
 * ดึงเพจจาก Facebook แล้วบันทึก/อัปเดตลง FacebookPage ในคำขอเดียว
 * Client เรียก POST นี้แล้วใช้ response เป็นรายการล่าสุด
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
    return NextResponse.json({ error: "No Facebook access token found" }, { status: 400 });
  }

  const existingCount = await prisma.facebookPage.count({ where: { userId } });
  if (existingCount > 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastFbPagesSyncAt: true },
    });
    if (user?.lastFbPagesSyncAt) {
      const elapsed = Date.now() - user.lastFbPagesSyncAt.getTime();
      if (elapsed < SYNC_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
        const pages = await prisma.facebookPage.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ pages, rateLimited: true, secondsLeft });
      }
    }
  }

  try {
    const allRawPages: Array<{
      id: string;
      name: string;
      category?: string;
      access_token?: string;
      username?: string;
      fbAccountId: string;
    }> = [];

    await Promise.all(
      fbTokens.map(async ({ providerAccountId, token }) => {
        try {
          const url = `${FB_API}/me/accounts?fields=id,name,category,access_token,username&limit=100&access_token=${token}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.error || !Array.isArray(data.data)) return;
          for (const p of data.data) {
            allRawPages.push({ ...p, fbAccountId: providerAccountId });
          }
        } catch {
          /* ignore */
        }
      })
    );

    const seen = new Set<string>();
    const uniqueRaw = allRawPages.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    const pagesFromFb = await runWithConcurrency(uniqueRaw, 10, async (p) => {
      let pageStatus: string | null = null;
      let pictureUrl: string | null = null;
      if (p.access_token) {
        try {
          const detailRes = await fetch(
            `${FB_API}/${p.id}?fields=is_published,picture.type(square){url}&access_token=${p.access_token}`
          );
          const detail = await detailRes.json();
          if (typeof detail.is_published === "boolean") {
            pageStatus = detail.is_published ? "PUBLISHED" : "UNPUBLISHED";
          }
          pictureUrl = detail.picture?.data?.url ?? null;
        } catch {
          // ignore
        }
      }
      return {
        id: p.id,
        name: p.name,
        username: p.username ?? null,
        pageStatus,
        pictureUrl,
      };
    });

    for (const p of pagesFromFb) {
      const existing = await prisma.facebookPage.findFirst({
        where: { userId, pageId: p.id },
      });
      if (existing) {
        await prisma.facebookPage.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            username: p.username ?? null,
            pageStatus: p.pageStatus ?? null,
            pictureUrl: p.pictureUrl ?? null,
          },
        });
      } else {
        await prisma.facebookPage.create({
          data: {
            userId,
            pageId: p.id,
            name: p.name,
            username: p.username ?? null,
            pageStatus: p.pageStatus ?? null,
            pictureUrl: p.pictureUrl ?? null,
            isActive: false,
          },
        });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastFbPagesSyncAt: new Date() },
    });

    const pages = await prisma.facebookPage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pages });
  } catch (err) {
    console.error("FB sync pages error:", err);
    return NextResponse.json({ error: "Failed to sync pages" }, { status: 500 });
  }
}
