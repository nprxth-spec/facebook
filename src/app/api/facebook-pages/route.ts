import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pages = await prisma.facebookPage.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pages);
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
    const userId = session.user.id;

    // To avoid duplicates
    let page = await prisma.facebookPage.findFirst({
        where: { pageId: body.pageId, userId }
    });

    if (page) {
        page = await prisma.facebookPage.update({
            where: { id: page.id },
            data: { name: body.name }
        });
    } else {
        page = await prisma.facebookPage.create({
            data: {
                userId,
                isActive: false, // Default to inactive when first synced
                pageId: body.pageId,
                name: body.name,
            },
        });
    }

    return NextResponse.json(page);
}

export async function PUT(req: Request) {
    try {
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, ...data } = await req.json();
    const page = await prisma.facebookPage.update({
        where: { id, userId: session.user.id },
        data,
    });

    return NextResponse.json(page);
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
    await prisma.facebookPage.delete({
        where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
}
