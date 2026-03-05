import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";
import { logActivity } from "@/lib/activity-log";

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email;

  try {
    // ลบข้อมูล Stripe ทั้งหมดที่ผูกกับอีเมลนี้ (customer + payment methods + subscriptions)
    const search = await stripe.customers.search({
      query: `email:\"${email}\"`,
      limit: 1,
    });
    const customer = search.data[0];

    if (customer) {
      // ยกเลิก subscription ทั้งหมด
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
      });
      await Promise.all(
        subs.data.map((sub) => stripe.subscriptions.cancel(sub.id)),
      );

      // ดึง payment method แล้ว detach ออกจาก customer
      const pms = await stripe.paymentMethods.list({
        customer: customer.id,
        type: "card",
      });
      await Promise.all(
        pms.data.map((pm) =>
          stripe.paymentMethods
            .detach(pm.id)
            .catch(() => null),
        ),
      );

      // ลบ customer ออกจาก Stripe
      await stripe.customers.del(customer.id);
    }
  } catch (e) {
    console.error("Stripe cleanup on user delete failed", e);
    // ไม่ block การลบบัญชี ถ้า Stripe ล้มเหลว จะลอคใน log แทน
  }

  await prisma.user.delete({ where: { id: userId } });

  await logActivity({
    req,
    userId,
    action: "account_deleted",
    category: "auth",
    metadata: { email },
  });

  return NextResponse.json({ success: true });
}
