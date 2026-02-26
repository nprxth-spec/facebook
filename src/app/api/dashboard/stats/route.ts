import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    managerAccountCount,
    monthlyExports,
    totalRowsAgg,
    successCount,
    totalCount,
    recentLogs,
  ] = await Promise.all([
    prisma.managerAccount.count({ where: { userId, isActive: true } }),
    prisma.exportLog.count({
      where: { userId, createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.exportLog.aggregate({
      where: { userId, status: "success" },
      _sum: { rowCount: true },
    }),
    prisma.exportLog.count({ where: { userId, status: "success" } }),
    prisma.exportLog.count({ where: { userId } }),
    prisma.exportLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return NextResponse.json({
    managerAccountCount,
    monthlyExports,
    totalRows: totalRowsAgg._sum.rowCount ?? 0,
    successRate,
    recentLogs,
  });
}
