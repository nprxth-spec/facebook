import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";

const FB_API = "https://graph.facebook.com/v19.0";

/** GET: คืนรายการ Facebook accounts ทั้งหมดที่เชื่อมต่อกับ user */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
        where: { userId: session.user.id, provider: "facebook" },
        select: {
            id: true,
            providerAccountId: true,
            access_token: true,
        },
    });

    // ดึงข้อมูลโปรไฟล์จาก Facebook Graph API สำหรับแต่ละบัญชี
    const enriched = await Promise.all(
        accounts.map(async (acc) => {
            if (!acc.access_token) {
                return {
                    id: acc.id,
                    providerAccountId: acc.providerAccountId,
                    name: null,
                    email: null,
                    picture: null,
                };
            }
            try {
                const res = await fetch(
                    `${FB_API}/me?fields=id,name,email,picture.type(square)&access_token=${acc.access_token}`
                );
                const data = await res.json();
                return {
                    id: acc.id,
                    providerAccountId: acc.providerAccountId,
                    name: (data.name as string) ?? null,
                    email: (data.email as string) ?? null,
                    picture: (data.picture?.data?.url as string) ?? null,
                };
            } catch {
                return {
                    id: acc.id,
                    providerAccountId: acc.providerAccountId,
                    name: null,
                    email: null,
                    picture: null,
                };
            }
        })
    );

    return NextResponse.json(enriched);
}

/** DELETE: ลบการเชื่อมต่อ Facebook บัญชีนั้น */
export async function DELETE(req: Request) {
    try {
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Verify ownership
    const account = await prisma.account.findFirst({
        where: { id, userId: session.user.id, provider: "facebook" },
    });
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.account.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
