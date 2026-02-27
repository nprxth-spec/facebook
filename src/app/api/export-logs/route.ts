import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "15")));
  const search = searchParams.get("search") ?? "";
  const exportType = searchParams.get("exportType") ?? "";
  const status = searchParams.get("status") ?? "";
  const days = searchParams.get("days");
  const skip = (page - 1) * limit;

  let dateFilter = {};
  if (days && days !== "all") {
    if (days === "lastMonth") {
      const now = new Date();
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      };
    } else {
      const daysInt = parseInt(days, 10);
      if (!isNaN(daysInt)) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysInt);
        dateFilter = { createdAt: { gte: pastDate } };
      }
    }
  }

  const where = {
    userId: session.user.id,
    ...(search && {
      OR: [
        { configName: { contains: search, mode: "insensitive" as const } },
        { sheetFileName: { contains: search, mode: "insensitive" as const } },
        { sheetTabName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(exportType && { exportType }),
    ...(status && { status }),
    ...dateFilter,
  };

  const [logs, total] = await Promise.all([
    prisma.exportLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.exportLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const log = await prisma.exportLog.create({
    data: { userId: session.user.id, ...body },
  });

  return NextResponse.json(log);
}
