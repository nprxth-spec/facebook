import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [userCount, recentUsers, exportLogCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.exportLog.count(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 space-y-8">
      {/* Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 mb-1">
            ผู้ใช้ทั้งหมด
          </p>
          <p className="text-3xl font-semibold text-slate-900">{userCount}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 mb-1">
            Export Logs
          </p>
          <p className="text-3xl font-semibold text-slate-900">
            {exportLogCount}
          </p>
        </div>
      </section>

      {/* Recent users table */}
      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              ผู้ใช้ล่าสุด
            </h2>
            <p className="text-sm text-slate-500">
              บัญชีที่เพิ่งสมัครใช้งานในระบบ
            </p>
          </div>
          <Link
            href="/admin/users"
            className="text-xs text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
          >
            ดูผู้ใช้ทั้งหมด
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pl-4 pr-3 text-left font-medium">
                  ชื่อ
                </th>
                <th className="py-2.5 px-3 text-left font-medium">อีเมล</th>
                <th className="py-2.5 px-3 text-left font-medium">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="py-2.5 pl-4 pr-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                    >
                      {u.name ?? "-"}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3">{u.email ?? "-"}</td>
                  <td className="py-2.5 px-3">
                    {u.createdAt.toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-slate-400 text-sm"
                  >
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

