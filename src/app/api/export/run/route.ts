import { auth } from "@/lib/auth";
import { getAllFacebookTokens, getGoogleClient } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { runExportTask } from "@/lib/export-service";
import { prisma } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

const MAX_EXPORT_AD_ACCOUNTS =
  Number.parseInt(process.env.MAX_EXPORT_AD_ACCOUNTS || "25") || 25;

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
  try {
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: ExportRequest = await req.json();
  const { adAccountIds, googleSheetId, sheetTab, columnMapping, writeMode, dataDate, configId, configName } = body;

  if (!adAccountIds?.length) return NextResponse.json({ error: "No ad accounts selected" }, { status: 400 });
  if (adAccountIds.length > MAX_EXPORT_AD_ACCOUNTS) {
    return NextResponse.json(
      {
        error: `Too many ad accounts in one export. Please select at most ${MAX_EXPORT_AD_ACCOUNTS} accounts or split into multiple runs.`,
      },
      { status: 400 }
    );
  }
  if (!googleSheetId) return NextResponse.json({ error: "No Google Sheet selected" }, { status: 400 });
  if (!sheetTab) return NextResponse.json({ error: "No sheet tab selected" }, { status: 400 });
  if (!columnMapping?.length) return NextResponse.json({ error: "No column mapping" }, { status: 400 });
  if (!dataDate) return NextResponse.json({ error: "No data date" }, { status: 400 });

  const fbAccounts = await getAllFacebookTokens(session.user.id);
  if (!fbAccounts.length) return NextResponse.json({ error: "Facebook not connected" }, { status: 400 });
  const fbTokens = fbAccounts.map((a) => a.token);

  const oauth2Client = await getGoogleClient(session.user.id);
  if (!oauth2Client) return NextResponse.json({ error: "Google not connected" }, { status: 400 });

  const userPrefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id }
  });
  const timezone = userPrefs?.timezone || "Asia/Bangkok";

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const result = await runExportTask({
      userId: session.user.id,
      fbTokens,
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
      timezone,
      ip,
      userAgent,
      sourcePath: "/api/export/run",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
