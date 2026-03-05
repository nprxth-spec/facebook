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

    const customer =
      search.data[0] ??
      (await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { appUserId: user.id },
      }));

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Stripe setup intent error", error);
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 },
    );
  }
}

