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

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host") ?? "localhost:3000"}`;

  try {
    // Try to find existing customer by email, otherwise create a new one
    const search = await stripe.customers.search({
      query: `email:\"${user.email}\"`,
      limit: 1,
    });

    let customer =
      search.data[0] ??
      (await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: {
          appUserId: user.id,
        },
      }));

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${baseUrl}/settings?tab=billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}

