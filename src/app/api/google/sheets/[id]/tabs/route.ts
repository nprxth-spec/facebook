import { auth } from "@/lib/auth";
import { getGoogleClient } from "@/lib/tokens";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const oauth2Client = await getGoogleClient(session.user.id);
  if (!oauth2Client) {
    return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    const res = await sheets.spreadsheets.get({
      spreadsheetId: id,
      fields: "sheets.properties(sheetId,title,index)",
    });

    const tabs = (res.data.sheets ?? []).map((s) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title,
      index: s.properties?.index,
    }));

    return NextResponse.json({ tabs });
  } catch (err: unknown) {
    console.error("Google Sheets tabs error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch tabs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
