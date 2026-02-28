import { auth } from "@/lib/auth";
import { getFacebookToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getFacebookToken(session.user.id);
    if (!token) return NextResponse.json({ error: "No Facebook token" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) return NextResponse.json({ error: "pageId is required" }, { status: 400 });

    try {
        // Find page token first
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`);
        const pagesData = await pagesRes.json();
        const page = pagesData.data?.find((p: any) => p.id === pageId);

        let msgTemplates: any[] = [];
        let leadForms: any[] = [];

        if (page?.access_token) {
            const pageToken = page.access_token;

            // Try message_templates
            const msgRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/message_templates?access_token=${pageToken}`);
            const msgData = await msgRes.json();
            msgTemplates = msgData.data || [];
            if (msgData.error) console.error("Msg Error:", msgData.error);

            // Try messenger_lead_forms
            const leadRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/messenger_lead_forms?access_token=${pageToken}`);
            const leadData = await leadRes.json();
            leadForms = leadData.data || [];
            if (leadData.error) console.error("Lead Error:", leadData.error);
        }

        return NextResponse.json({
            templates: msgTemplates,
            leadForms: leadForms,
            pageFound: !!page
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
