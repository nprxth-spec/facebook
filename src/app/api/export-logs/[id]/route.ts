import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: { params: { id: string } | Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const params = await context.params;
        const log = await prisma.exportLog.findFirst({
            where: {
                id: params.id,
                userId: session.user.id, // ensure user owns this log
            }
        });

        if (!log) {
            return NextResponse.json({ error: "Log not found" }, { status: 404 });
        }

        return NextResponse.json({ details: (log as any).details });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch log details" }, { status: 500 });
    }
}
