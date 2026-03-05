import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function GET(_req: NextRequest) {
  const session = await auth();
  const user = session?.user;

  if (!user?.email || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find or lazily create a Stripe customer for this user
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

    const [paymentMethods, invoices, subscriptions] = await Promise.all([
      stripe.paymentMethods.list({
        customer: customer.id,
        type: "card",
      }),
      stripe.invoices.list({
        customer: customer.id,
        limit: 12,
      }),
      stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 5,
      }),
    ]);

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        defaultPaymentMethodId:
          typeof customer.invoice_settings?.default_payment_method === "string"
            ? customer.invoice_settings.default_payment_method
            : (customer.invoice_settings?.default_payment_method as any)?.id ?? null,
      },
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand ?? null,
        last4: pm.card?.last4 ?? null,
        expMonth: pm.card?.exp_month ?? null,
        expYear: pm.card?.exp_year ?? null,
        name: pm.billing_details?.name ?? null,
      })),
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        created: inv.created,
        total: inv.total,
        currency: inv.currency,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      })),
      subscriptions: subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: (sub as any).current_period_end,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
        planId: (sub.metadata as any)?.planId ?? null,
        items: sub.items.data.map((item) => ({
          id: item.id,
          priceId: item.price.id,
          productId: item.price.product,
          unitAmount: item.price.unit_amount,
          currency: item.price.currency,
          nickname: item.price.nickname,
        })),
      })),
    });
  } catch (error) {
    console.error("Stripe overview error", error);
    return NextResponse.json(
      { error: "Failed to load billing overview" },
      { status: 500 },
    );
  }
}

