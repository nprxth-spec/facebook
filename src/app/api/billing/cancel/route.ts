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

  try {
    const search = await stripe.customers.search({
      query: `email:\"${user.email}\"`,
      limit: 1,
    });
    const customer = search.data[0];
    if (!customer) {
      return NextResponse.json({ ok: true });
    }

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
    });

    const cancellable = subs.data.filter((sub) =>
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
        (sub.status ?? "").toLowerCase(),
      ),
    );

    await Promise.all(cancellable.map((sub) => stripe.subscriptions.cancel(sub.id)));

    return NextResponse.json({ ok: true, cancelledCount: cancellable.length });
  } catch (error) {
    console.error("Stripe cancel subscription error", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}

