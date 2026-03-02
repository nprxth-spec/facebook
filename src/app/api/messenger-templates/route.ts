import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const templates = await prisma.messengerTemplate.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" }
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { name, greeting, iceBreakers } = await req.json();

        if (!name || !greeting || !iceBreakers) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const template = await prisma.messengerTemplate.create({
            data: {
                userId: session.user.id,
                name,
                greeting,
                iceBreakers
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error creating template:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
