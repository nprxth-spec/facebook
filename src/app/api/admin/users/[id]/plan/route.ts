import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { cookies } from "next/headers";

const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? "admin-session";

const planEnvMap: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAjax = req.headers.get("x-admin-ajax") === "1";
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token || token !== ADMIN_SESSION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: userId } = await params;
  const formData = await req.formData().catch(() => null);
  const planId = formData?.get("planId")?.toString();

  if (!planId) {
    return NextResponse.json(
      { error: "planId is required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user || !user.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const search = await stripe.customers.search({
      query: `email:\"${user.email}\"`,
      limit: 1,
    });

    const customer =
      search.data[0] ??
      (await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { appUserId: user.id },
      }));

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
    });

    const cancellable = subs.data.filter((sub) =>
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
        (sub.status ?? "").toLowerCase(),
      ),
    );

    // ยกเลิกทุก subscription เดิมก่อน
    await Promise.all(
      cancellable.map((sub) => stripe.subscriptions.cancel(sub.id)),
    );

    // ถ้าเลือก free ให้ยกเลิกอย่างเดียว ไม่สร้าง subscription ใหม่
    if (planId === "free") {
      if (isAjax) {
        return NextResponse.json({ ok: true, planId: "free" });
      }
      return NextResponse.redirect(
        new URL(`/admin/users/${user.id}`, req.url),
      );
    }

    const priceId = planEnvMap[planId] ?? process.env.STRIPE_DEFAULT_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price is not configured" },
        { status: 500 },
      );
    }

    // ใช้ default payment method ปัจจุบันของ customer
    const defaultPm =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : (customer.invoice_settings?.default_payment_method as any)?.id;

    if (!defaultPm) {
      return NextResponse.json(
        {
          error:
            "Customer has no default payment method. User must add a card first.",
        },
        { status: 400 },
      );
    }

    await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: defaultPm,
      metadata: { planId },
      expand: ["latest_invoice.payment_intent"],
    });

    if (isAjax) {
      return NextResponse.json({ ok: true, planId });
    }

    return NextResponse.redirect(new URL(`/admin/users/${user.id}`, req.url));
  } catch (error) {
    console.error("Admin change user plan error", error);
    return NextResponse.json(
      { error: "Failed to change user plan" },
      { status: 500 },
    );
  }
}

