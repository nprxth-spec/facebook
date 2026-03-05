import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { assertSameOrigin } from "@/lib/security";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: paymentMethodId } = await params;
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: "payment method id is required" },
      { status: 400 },
    );
  }

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Stripe detach payment method error", error);
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 },
    );
  }
}

