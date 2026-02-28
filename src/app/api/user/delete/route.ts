import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
