import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(prefs ?? { theme: "light", accentColor: "blue", language: "th", timezone: "Asia/Bangkok" });
}

export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...body },
    update: body,
  });

  return NextResponse.json(prefs);
}
