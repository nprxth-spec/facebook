import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configs = await prisma.exportConfig.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(configs);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const config = await prisma.exportConfig.create({
    data: { userId: session.user.id, ...body },
  });

  return NextResponse.json(config);
}

export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...body } = await req.json();
  const config = await prisma.exportConfig.update({
    where: { id, userId: session.user.id },
    data: body,
  });

  return NextResponse.json(config);
}

export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.exportConfig.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
