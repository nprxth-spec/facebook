import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.managerAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = session.user.id;

  // To avoid duplicates, check if the account already exists for this user.
  let account = await prisma.managerAccount.findFirst({
    where: { accountId: body.accountId, userId }
  });

  if (account) {
    // Optionally update the name or platform if it already exists
    account = await prisma.managerAccount.update({
      where: { id: account.id },
      data: { name: body.name, platform: body.platform }
    });
  } else {
    account = await prisma.managerAccount.create({
      data: {
        userId,
        isActive: false, // Default to inactive when first synced
        ...body,
      },
    });
  }

  return NextResponse.json(account);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...data } = await req.json();
  const account = await prisma.managerAccount.update({
    where: { id, userId: session.user.id },
    data,
  });

  return NextResponse.json(account);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.managerAccount.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
