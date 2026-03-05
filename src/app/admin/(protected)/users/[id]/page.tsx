import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const billingPlans: { id: string; labelTh: string }[] = [
  { id: "free", labelTh: "แพ็กเกจฟรี" },
  { id: "pro", labelTh: "แพ็กเกจ Pro" },
  { id: "business", labelTh: "แพ็กเกจ Business" },
];

async function getUserWithBilling(userId: string | undefined) {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user || !user.email) return null;

  const search = await stripe.customers.search({
    query: `email:\"${user.email}\"`,
    limit: 1,
  });

  const customer = search.data[0] ?? null;

  if (!customer) {
    return { user, customer: null, subscriptions: [] as any[] };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "all",
    limit: 5,
  });

  return {
    user,
    customer,
    subscriptions: subscriptions.data,
  };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUserWithBilling(id);

  if (!data) {
    notFound();
  }

  const { user, customer, subscriptions } = data;

  const activeSub = subscriptions.find(
    (s) =>
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
        (s.status ?? "").toLowerCase(),
      ),
  );

  const currentPlanId = (activeSub?.metadata as any)?.planId ?? null;

  const currentPlanLabel =
    currentPlanId &&
    billingPlans.find((p) => p.id === currentPlanId)?.labelTh;

  return (
    <div className="mx-auto max-w-4xl px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            ผู้ใช้: {user.name ?? "-"}
          </h1>
          <p className="text-sm text-slate-500">{user.email ?? "-"}</p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          ← กลับรายการผู้ใช้
        </Link>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 mb-1">
            สมัครเมื่อ
          </p>
          <p className="text-base font-medium text-slate-900">
            {user.createdAt.toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 mb-1">
            แพ็กเกจปัจจุบัน
          </p>
          <p className="text-base font-medium text-slate-900">
            {currentPlanLabel ?? (activeSub ? "แพ็กเกจที่ชำระเงิน" : "ฟรี")}
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            แก้ไขแพ็กเกจผู้ใช้
          </h2>
          <p className="text-xs text-slate-500">
            การเปลี่ยนแพ็กเกจจะกระทบ Stripe Subscription ของผู้ใช้นี้
          </p>
        </div>
        <p className="text-sm text-slate-500">
          เลือกแพ็กเกจใหม่ด้านล่าง จากนั้นระบบจะยกเลิก subscription เดิม (ถ้ามี)
          และสร้าง subscription ใหม่ให้ตามแพ็กเกจที่เลือก โดยใช้บัตรหลักใน
          Stripe ของผู้ใช้นี้
        </p>
        <form
          action={`/api/admin/users/${user.id}/plan`}
          method="POST"
          className="inline-flex flex-wrap gap-2 rounded-full bg-slate-50 p-1.5"
        >
          {billingPlans.map((plan) => (
            <button
              key={plan.id}
              name="planId"
              value={plan.id}
              className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-medium ${
                currentPlanId === plan.id
                  ? "bg-slate-900 text-slate-50 shadow-sm"
                  : "bg-transparent text-slate-700 hover:bg-white"
              }`}
            >
              {plan.labelTh}
            </button>
          ))}
        </form>
        {!customer && (
          <p className="text-xs text-amber-500">
            ผู้ใช้นี้ยังไม่เคยสร้าง Stripe Customer
            (ยังไม่เคยเปิดหน้า Billing หรือชำระเงิน)
          </p>
        )}
      </section>
    </div>
  );
}

