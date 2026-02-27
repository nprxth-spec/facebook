import { auth } from "@/lib/auth";
import { getFacebookToken, getGoogleClient } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { runExportTask } from "@/lib/export-service";
import { prisma } from "@/lib/db";

interface ColumnMapping {
  fbCol: string;
  sheetCol: string;
}

interface ExportRequest {
  adAccountIds: string[];
  googleSheetId: string;
  sheetTab: string;
  columnMapping: ColumnMapping[];
  writeMode: "append" | "overwrite";
  dataDate: string;
  configId?: string;
  configName?: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: ExportRequest = await req.json();
  const { adAccountIds, googleSheetId, sheetTab, columnMapping, writeMode, dataDate, configId, configName } = body;

  if (!adAccountIds?.length) return NextResponse.json({ error: "No ad accounts selected" }, { status: 400 });
  if (!googleSheetId) return NextResponse.json({ error: "No Google Sheet selected" }, { status: 400 });
  if (!sheetTab) return NextResponse.json({ error: "No sheet tab selected" }, { status: 400 });
  if (!columnMapping?.length) return NextResponse.json({ error: "No column mapping" }, { status: 400 });
  if (!dataDate) return NextResponse.json({ error: "No data date" }, { status: 400 });

  const fbToken = await getFacebookToken(session.user.id);
  if (!fbToken) return NextResponse.json({ error: "Facebook not connected" }, { status: 400 });

  const oauth2Client = await getGoogleClient(session.user.id);
  if (!oauth2Client) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

  const userPrefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id }
  });
  const timezone = userPrefs?.timezone || "Asia/Bangkok";

  try {
    const result = await runExportTask({
      userId: session.user.id,
      fbToken,
      oauth2Client,
      adAccountIds,
      googleSheetId,
      sheetTab,
      columnMapping,
      writeMode,
      dataDate,
      configId,
      configName,
      exportType: "manual",
      timezone
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
