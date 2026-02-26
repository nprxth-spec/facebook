import { auth } from "@/lib/auth";
import { getGoogleClient } from "@/lib/tokens";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = await getGoogleClient(session.user.id);
  if (!oauth2Client) {
    return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") ?? "").trim();

  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // base query: เฉพาะ Spreadsheet ที่ไม่ถูกลบ
    let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
    if (search) {
      // ให้ Drive ช่วยค้นหาตามชื่อไฟล์ (case-insensitive)
      const safe = search.replace(/'/g, "\\'");
      q += ` and name contains '${safe}'`;
    }

    const res = await drive.files.list({
      q,
      fields: "files(id,name,modifiedTime,owners),nextPageToken",
      orderBy: "modifiedTime desc",
      pageSize: 200,
    });

    // ยังแสดงเฉพาะไฟล์ที่ชื่อขึ้นต้นด้วย "101วิเคราะห์แอด"
    const prefix = "101วิเคราะห์แอด";
    const files = (res.data.files ?? [])
      .filter((f) => (f.name ?? "").startsWith(prefix))
      .map((f) => ({
        id: f.id!,
        name: f.name!,
        modifiedTime: f.modifiedTime,
      }));

    return NextResponse.json({ files });
  } catch (err: unknown) {
    console.error("Google Drive error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch sheets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
