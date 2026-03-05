import { prisma } from "@/lib/db";

type ActivityCategory = "auth" | "export" | "billing" | "admin" | "user" | "system";

interface LogActivityOptions {
  req?: Request;
  userId?: string | null;
  action: string;
  category: ActivityCategory | string;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  req,
  userId,
  action,
  category,
  metadata,
}: LogActivityOptions) {
  try {
    let ip: string | undefined;
    let userAgent: string | undefined;
    let path: string | undefined;
    let method: string | undefined;

    if (req) {
      method = (req as any).method;
      const url = new URL(req.url);
      path = url.pathname;
      ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        undefined;
      userAgent = req.headers.get("user-agent") ?? undefined;
    }

    await prisma.userActivityLog.create({
      data: {
        userId: userId ?? null,
        action,
        category,
        method,
        path,
        ip,
        userAgent,
        // ให้ Prisma จัดการ serialize JSON เอง และหลีกเลี่ยงการใส่ null ตรง ๆ
        ...(metadata ? { metadata: metadata as any } : {}),
      },
    });
  } catch (e) {
    // ไม่ให้ log ล้มแล้วทำให้ main request พัง
    console.error("Failed to write activity log", e);
  }
}

