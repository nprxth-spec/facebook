import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { assertSameOrigin } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  const user = session?.user;

  if (!user?.email || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId, paymentMethodId } = (await req.json().catch(() => ({}))) as {
    planId?: string;
    paymentMethodId?: string;
  };

  if (!planId || !paymentMethodId) {
    return NextResponse.json(
      { error: "planId and paymentMethodId are required" },
      { status: 400 },
    );
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

    // Map planId -> Stripe Price ID from env, fallback to STRIPE_DEFAULT_PRICE_ID
    const planEnvMap: Record<string, string | undefined> = {
      pro: process.env.STRIPE_PRICE_PRO,
      business: process.env.STRIPE_PRICE_BUSINESS,
    };

    const priceId = planEnvMap[planId] ?? process.env.STRIPE_DEFAULT_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price is not configured in environment variables" },
        { status: 500 },
      );
    }

    // Attach payment method to customer if needed
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    }).catch(() => null);

    // Set as default for invoices
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: { planId },
      expand: ["latest_invoice.payment_intent"],
    });

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: (subscription as any).current_period_end,
    });
  } catch (error) {
    console.error("Stripe subscribe error", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}

