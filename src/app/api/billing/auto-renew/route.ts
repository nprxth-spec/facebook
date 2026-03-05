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

  const { enabled } = (await req.json().catch(() => ({}))) as {
    enabled?: boolean;
  };

  if (typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled must be boolean" },
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
      return NextResponse.json({ ok: true });
    }

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
    });

    await Promise.all(
      subs.data.map((sub) =>
        stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: !enabled,
        }),
      ),
    );

    return NextResponse.json({ ok: true, enabled });
  } catch (error) {
    console.error("Stripe auto-renew toggle error", error);
    return NextResponse.json(
      { error: "Failed to update auto-renew setting" },
      { status: 500 },
    );
  }
}

