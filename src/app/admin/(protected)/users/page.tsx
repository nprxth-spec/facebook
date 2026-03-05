import Link from "next/link";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { UserPlanActionsCell } from "./UserPlanActionsCell";

const billingPlans: { id: string; labelTh: string }[] = [
  { id: "free", labelTh: "ฟรี" },
  { id: "pro", labelTh: "Pro" },
  { id: "business", labelTh: "Business" },
];

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      lastFbPagesSyncAt: true,
      lastFbAccountsSyncAt: true,
    },
  });

  // ดึงแพ็กเกจปัจจุบันของแต่ละผู้ใช้จาก Stripe (แบบคร่าว ๆ พอใช้สำหรับหน้าผู้ดูแล)
  const planByUserId: Record<string, { planId: string | null; label: string }> =
    {};
  await Promise.all(
    users.map(async (u) => {
      if (!u.email) {
        planByUserId[u.id] = { planId: "free", label: billingPlans[0].labelTh };
        return;
      }
      try {
        const search = await stripe.customers.search({
          query: `email:\"${u.email}\"`,
          limit: 1,
        });
        const customer = search.data[0];
        if (!customer) {
          planByUserId[u.id] = {
            planId: "free",
            label: billingPlans[0].labelTh,
          };
          return;
        }
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 5,
        });
        const activeSub = subs.data.find((s) =>
          ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
            (s.status ?? "").toLowerCase(),
          ),
        );
        if (!activeSub) {
          planByUserId[u.id] = {
            planId: "free",
            label: billingPlans[0].labelTh,
          };
          return;
        }
        const planId = (activeSub.metadata as any)?.planId as string | null;
        if (planId) {
          const plan = billingPlans.find((p) => p.id === planId);
          planByUserId[u.id] = {
            planId,
            label: plan?.labelTh ?? "ชำระเงิน",
          };
        } else {
          planByUserId[u.id] = { planId: null, label: "ชำระเงิน" };
        }
      } catch {
        planByUserId[u.id] = { planId: null, label: "ไม่ทราบ" };
      }
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            จัดการผู้ใช้
          </h1>
          <p className="text-sm text-slate-500">
            ดูข้อมูลผู้ใช้ และจัดการแพ็กเกจ / สิทธิ์การใช้งาน
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          ← กลับไปแดชบอร์ด
        </Link>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-sm text-slate-500">
            ผู้ใช้ทั้งหมด {users.length.toLocaleString("th-TH")} รายการ
          </p>
          <div className="w-56">
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
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
                <th className="py-2.5 px-3 text-left font-medium">แพ็กเกจ</th>
                <th className="py-2.5 px-3 text-left font-medium">
                  Sync Pages ล่าสุด
                </th>
                <th className="py-2.5 px-3 text-left font-medium">
                  Sync Accounts ล่าสุด
                </th>
                <th className="py-2.5 pr-4 pl-3 text-right font-medium">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  } hover:bg-sky-50/70`}
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
                  <td className="py-2.5 px-3">
                    {planByUserId[u.id]?.label ?? "-"}
                  </td>
                  <td className="py-2.5 px-3">
                    {u.lastFbPagesSyncAt
                      ? u.lastFbPagesSyncAt.toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "-"}
                  </td>
                  <td className="py-2.5 px-3">
                    {u.lastFbAccountsSyncAt
                      ? u.lastFbAccountsSyncAt.toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "-"}
                  </td>
                  <td className="py-2.5 pr-4 pl-3 text-right">
                    <UserPlanActionsCell
                      userId={u.id}
                      userName={u.name ?? u.email ?? "-"}
                      currentPlanId={planByUserId[u.id]?.planId ?? "free"}
                      currentPlanLabel={planByUserId[u.id]?.label ?? "ฟรี"}
                    />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-slate-400 text-sm"
                  >
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

