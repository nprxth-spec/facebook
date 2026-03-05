import Link from "next/link";
import { prisma } from "@/lib/db";

type DateFilter =
  | "today"
  | "yesterday"
  | "this_month"
  | "last_month"
  | "last_60_days"
  | "last_90_days"
  | "custom"
  | "all";

function getDateRange(filter: DateFilter, from?: string, to?: string) {
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (filter) {
    case "today": {
      const d = startOfDay(now);
      return { gte: d, lte: endOfDay(now) };
    }
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return { gte: startOfDay(d), lte: endOfDay(d) };
    }
    case "this_month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = endOfDay(
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      );
      return { gte: first, lte: last };
    }
    case "last_month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = endOfDay(
        new Date(now.getFullYear(), now.getMonth(), 0),
      );
      return { gte: first, lte: last };
    }
    case "last_60_days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 60);
      return { gte: startOfDay(d), lte: endOfDay(now) };
    }
    case "last_90_days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return { gte: startOfDay(d), lte: endOfDay(now) };
    }
    case "custom": {
      if (!from && !to) return null;
      const gte = from ? startOfDay(new Date(from)) : undefined;
      const lte = to ? endOfDay(new Date(to)) : undefined;
      return { gte, lte };
    }
    default:
      return null;
  }
}

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const rawPageSize = Number(sp.pageSize ?? "25") || 25;
  const allowedPageSizes = [25, 50, 100, 200];
  const pageSize = allowedPageSizes.includes(rawPageSize)
    ? rawPageSize
    : 25;

  const dateFilter = (sp.date as DateFilter | undefined) ?? "all";
  const categoryFilter = (sp.category as string | undefined) ?? "all";
  const emailFilter = (sp.email as string | undefined) ?? "";
  const actionFilter = (sp.action as string | undefined) ?? "";
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  const range = getDateRange(dateFilter, from, to);

  const where: any = {};
  if (range && (range.gte || range.lte)) {
    where.createdAt = {
      ...(range.gte ? { gte: range.gte } : {}),
      ...(range.lte ? { lte: range.lte } : {}),
    };
  }
  if (categoryFilter !== "all") {
    where.category = categoryFilter;
  }
  if (actionFilter.trim()) {
    where.action = { contains: actionFilter.trim(), mode: "insensitive" };
  }
  if (emailFilter.trim()) {
    where.user = {
      email: { contains: emailFilter.trim(), mode: "insensitive" },
    };
  }

  const [logs, total] = await Promise.all([
    prisma.userActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        user: { select: { id: true, email: true } },
        action: true,
        category: true,
        method: true,
        path: true,
        ip: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.userActivityLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Activity Logs
          </h1>
          <p className="text-sm text-slate-500">
            ดูประวัติการล็อกอิน การจัดการเซสชัน และกิจกรรมสำคัญของผู้ใช้
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <Link
            href="/admin"
            className="hover:text-slate-700 cursor-pointer"
          >
            ← กลับไปแดชบอร์ด
          </Link>
          <span className="text-slate-400">|</span>
          <Link
            href="/admin/logs"
            className="hover:text-slate-700 cursor-pointer"
          >
            Export Logs
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            แสดง {logs.length.toString()} จากทั้งหมด{" "}
            {total.toLocaleString("th-TH")} รายการ
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Date filters */}
            <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-50 px-1.5 py-1">
              {[
                { key: "all", label: "ทั้งหมด" },
                { key: "today", label: "วันนี้" },
                { key: "yesterday", label: "เมื่อวาน" },
                { key: "this_month", label: "เดือนนี้" },
                { key: "last_month", label: "เดือนที่ผ่านมา" },
                { key: "last_60_days", label: "60 วัน" },
                { key: "last_90_days", label: "90 วัน" },
              ].map((f) => (
                <Link
                  key={f.key}
                  href={`?date=${f.key}&page=1&pageSize=${pageSize}&category=${categoryFilter}&email=${encodeURIComponent(
                    emailFilter,
                  )}&action=${encodeURIComponent(actionFilter)}`}
                  className={`cursor-pointer rounded-full px-2.5 py-0.5 ${
                    dateFilter === f.key
                      ? "bg-slate-900 text-slate-50"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
            {/* Custom range */}
            <form
              method="GET"
              className="flex items-center gap-1 text-xs"
            >
              <input type="hidden" name="date" value="custom" />
              <input type="hidden" name="category" value={categoryFilter} />
              <input type="hidden" name="email" value={emailFilter} />
              <input type="hidden" name="action" value={actionFilter} />
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              />
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="pageSize" value={pageSize} />
              <button
                type="submit"
                className="ml-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ใช้ช่วงวันที่
              </button>
            </form>
            {/* Category + search filters */}
            <form
              method="GET"
              className="flex flex-wrap items-center gap-2 text-xs"
            >
              <input type="hidden" name="date" value={dateFilter} />
              {from && <input type="hidden" name="from" value={from} />}
              {to && <input type="hidden" name="to" value={to} />}
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="pageSize" value={pageSize} />
              <span className="text-slate-500">หมวด</span>
              <select
                name="category"
                defaultValue={categoryFilter}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              >
                <option value="all">ทั้งหมด</option>
                <option value="auth">Auth</option>
                <option value="export">Export</option>
                <option value="billing">Billing</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="system">System</option>
              </select>
              <span className="text-slate-500">Action</span>
              <input
                type="text"
                name="action"
                defaultValue={actionFilter}
                placeholder="เช่น login, admin_login"
                className="h-7 w-40 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              />
              <span className="text-slate-500">อีเมล</span>
              <input
                type="text"
                name="email"
                defaultValue={emailFilter}
                placeholder="example@mail.com"
                className="h-7 w-44 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              />
              <button
                type="submit"
                className="ml-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                กรอง
              </button>
            </form>
            {/* Page size */}
            <form method="GET" className="flex items-center gap-1 text-xs">
              <input type="hidden" name="date" value={dateFilter} />
              {from && <input type="hidden" name="from" value={from} />}
              {to && <input type="hidden" name="to" value={to} />}
              <input type="hidden" name="category" value={categoryFilter} />
              <input type="hidden" name="email" value={emailFilter} />
              <input type="hidden" name="action" value={actionFilter} />
              <span className="text-slate-500">แสดงต่อหน้า</span>
              <select
                name="pageSize"
                defaultValue={pageSize}
                className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs"
              >
                {allowedPageSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input type="hidden" name="page" value="1" />
              <button
                type="submit"
                className="ml-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ตกลง
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-[11px] border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-slate-600">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium border-b border-r border-slate-200">
                  เวลา
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  ผู้ใช้
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  หมวด / Action
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  Path / Method
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  IP / UA
                </th>
                <th className="py-2.5 pr-4 pl-3 text-left font-medium border-b border-slate-200">
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-sky-50/70">
                  <td className="py-2.5 pl-4 pr-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.createdAt.toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.user?.email ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span className="uppercase tracking-wide font-semibold text-[11px]">
                        {log.category}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px]">
                        {log.method ?? "-"}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {log.path ?? "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px]">
                        {log.ip ?? "-"}
                      </span>
                      <span className="text-[11px] text-slate-500 max-w-xs truncate">
                        {log.userAgent ?? "-"}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 pl-3 max-w-xs border-t border-slate-200">
                    <pre className="max-h-16 overflow-hidden whitespace-pre-wrap break-all text-[10px] text-slate-500">
                      {log.metadata
                        ? JSON.stringify(log.metadata, null, 0)
                        : "-"}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-400 text-sm border-t border-slate-200"
                  >
                    ยังไม่มีกิจกรรม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
          <span>
            หน้า {page} จาก {totalPages}
          </span>
          <div className="inline-flex gap-1">
            <Link
              href={`?page=1&pageSize=${pageSize}&date=${dateFilter}${
                from ? `&from=${from}` : ""
              }${to ? `&to=${to}` : ""}&category=${categoryFilter}&email=${encodeURIComponent(
                emailFilter,
              )}&action=${encodeURIComponent(actionFilter)}`}
              className={`px-2 py-1 rounded-md border border-slate-200 cursor-pointer ${
                page === 1 ? "opacity-50 pointer-events-none" : "bg-white"
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              href={`?page=${Math.max(
                1,
                page - 1,
              )}&pageSize=${pageSize}&date=${dateFilter}${
                from ? `&from=${from}` : ""
              }${to ? `&to=${to}` : ""}&category=${categoryFilter}&email=${encodeURIComponent(
                emailFilter,
              )}&action=${encodeURIComponent(actionFilter)}`}
              className={`px-2 py-1 rounded-md border border-slate-200 cursor-pointer ${
                page === 1 ? "opacity-50 pointer-events-none" : "bg-white"
              }`}
            >
              ก่อนหน้า
            </Link>
            <Link
              href={`?page=${Math.min(
                totalPages,
                page + 1,
              )}&pageSize=${pageSize}&date=${dateFilter}${
                from ? `&from=${from}` : ""
              }${to ? `&to=${to}` : ""}&category=${categoryFilter}&email=${encodeURIComponent(
                emailFilter,
              )}&action=${encodeURIComponent(actionFilter)}`}
              className={`px-2 py-1 rounded-md border border-slate-200 cursor-pointer ${
                page === totalPages
                  ? "opacity-50 pointer-events-none"
                  : "bg-white"
              }`}
            >
              ถัดไป
            </Link>
            <Link
              href={`?page=${totalPages}&pageSize=${pageSize}&date=${dateFilter}${
                from ? `&from=${from}` : ""
              }${to ? `&to=${to}` : ""}&category=${categoryFilter}&email=${encodeURIComponent(
                emailFilter,
              )}&action=${encodeURIComponent(actionFilter)}`}
              className={`px-2 py-1 rounded-md border border-slate-200 cursor-pointer ${
                page === totalPages
                  ? "opacity-50 pointer-events-none"
                  : "bg-white"
              }`}
            >
              หน้าสุดท้าย
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

