import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { assertSameOrigin } from "@/lib/security";

export async function POST(req: Request) {
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

  const { paymentMethodId } = (await req.json().catch(() => ({}))) as {
    paymentMethodId?: string;
  };

  if (!paymentMethodId) {
    return NextResponse.json(
      { error: "paymentMethodId is required" },
      { status: 400 },
    );
  }

  try {
    const search = await stripe.customers.search({
      query: `email:\"${user.email}\"`,
      limit: 1,
    });

    const customer = search.data[0];
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Optionally update active subscriptions' default payment method
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
    });

    await Promise.all(
      subs.data.map((sub) =>
        stripe.subscriptions.update(sub.id, {
          default_payment_method: paymentMethodId,
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Stripe set default payment method error", error);
    return NextResponse.json(
      { error: "Failed to update default payment method" },
      { status: 500 },
    );
  }
}

