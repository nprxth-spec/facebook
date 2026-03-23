"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";
import { NextResponse } from "next/server";

/**
 * DELETE /api/google-connections
 * Disconnect Google for the currently signed-in user by removing stored tokens
 * (next-auth Account rows with provider="google").
 */
export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.account.deleteMany({
    where: { userId: session.user.id, provider: "google" },
  });

  return NextResponse.json({ success: true });
}

