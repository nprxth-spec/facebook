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

export default async function AdminLogsPage({
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
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;

  const range = getDateRange(dateFilter, from, to);

  const where =
    range && (range.gte || range.lte)
      ? {
          createdAt: {
            ...(range.gte ? { gte: range.gte } : {}),
            ...(range.lte ? { lte: range.lte } : {}),
          },
        }
      : {};

  const [logs, total] = await Promise.all([
    prisma.exportLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        user: { select: { id: true, email: true } },
        exportType: true,
        configName: true,
        status: true,
        error: true,
        createdAt: true,
      },
    }),
    prisma.exportLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Export Logs</h1>
          <p className="text-sm text-slate-500">
            ดูประวัติการส่งออกข้อมูลของผู้ใช้ และสถานะล่าสุด
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          ← กลับไปแดชบอร์ด
        </Link>
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
                  href={`?date=${f.key}&page=1&pageSize=${pageSize}`}
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
            {/* Page size */}
            <form method="GET" className="flex items-center gap-1 text-xs">
              <input type="hidden" name="date" value={dateFilter} />
              {from && <input type="hidden" name="from" value={from} />}
              {to && <input type="hidden" name="to" value={to} />}
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
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-slate-600">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium border-b border-r border-slate-200">
                  เวลา
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  ผู้ใช้
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  ประเภท
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  คอนฟิก
                </th>
                <th className="py-2.5 px-3 text-left font-medium border-b border-r border-slate-200">
                  สถานะ
                </th>
                <th className="py-2.5 pr-4 pl-3 text-left font-medium border-b border-slate-200">
                  ข้อความผิดพลาด
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
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
                    {log.exportType}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    {log.configName ?? "-"}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap border-t border-r border-slate-200">
                    <span
                      className={
                        log.status === "success"
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100"
                          : "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-100"
                      }
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 pl-3 max-w-xs truncate text-slate-500 border-t border-slate-200">
                    {log.error ?? "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-400 text-sm border-t border-slate-200"
                  >
                    ยังไม่มี logs
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
              }${to ? `&to=${to}` : ""}`}
              className={`px-2 py-1 rounded-md border border-slate-200 cursor-pointer ${
                page === 1 ? "opacity-50 pointer-events-none" : "bg-white"
              }`}
            >
              หน้าแรก
            </Link>
            <Link
              href={`?page=${Math.max(1, page - 1)}&pageSize=${pageSize}&date=${dateFilter}${
                from ? `&from=${from}` : ""
              }${to ? `&to=${to}` : ""}`}
              className={`px-2 py-1 rounded-md border border-slate-200 cursor-pointer ${
                page === 1 ? "opacity-50 pointer-events-none" : "bg-white"
              }`}
            >
              ก่อนหน้า
            </Link>
            <Link
              href={`?page=${Math.min(totalPages, page + 1)}&pageSize=${pageSize}&date=${dateFilter}${
                from ? `&from=${from}` : ""
              }${to ? `&to=${to}` : ""}`}
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
              }${to ? `&to=${to}` : ""}`}
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

