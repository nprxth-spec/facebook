import { google } from "googleapis";
import { format, subDays } from "date-fns";
import { prisma } from "@/lib/db";

const FB_API = "https://graph.facebook.com/v19.0";

const FB_FIELD_MAP: Record<string, string> = {
    date: "date_start",
    account_id: "account_id",
    account_name: "account_name",
    ad_id: "ad_id",
    ad_name: "ad_name",
    adset_id: "adset_id",
    adset_name: "adset_name",
    campaign_id: "campaign_id",
    campaign_name: "campaign_name",
    impressions: "impressions",
    reach: "reach",
    clicks: "clicks",
    spend: "spend",
    cpc: "cpc",
    cpm: "cpm",
    ctr: "ctr",
    frequency: "frequency",
    engagement: "inline_post_engagement",
    conversions: "actions",
    cost_per_conversion: "cost_per_action_type",
    link_clicks: "inline_link_clicks",
    messages: "actions",
    video_avg_time: "video_avg_time_watched_actions",
    video_plays: "video_play_actions",
    video_3s: "actions",
    video_p25: "video_p25_watched_actions",
    video_p50: "video_p50_watched_actions",
    video_p75: "video_p75_watched_actions",
    video_p95: "video_p95_watched_actions",
    video_p100: "video_p100_watched_actions",
    video_views: "video_p25_watched_actions",
};

interface ColumnMapping {
    fbCol: string;
    sheetCol: string;
}

import type { OAuth2Client } from "google-auth-library";

export interface ExportServiceOptions {
    userId: string;
    fbToken: string;
    oauth2Client: OAuth2Client;
    adAccountIds: string[];
    googleSheetId: string;
    description?: string;
    sheetTab: string;
    columnMapping: ColumnMapping[];
    writeMode: "append" | "overwrite";
    dataDate?: string | Date;
    dateRange?: string; // today, yesterday, last_7_days
    configId?: string;
    configName?: string;
    exportType?: "manual" | "auto";
    timezone?: string;
}

function colLetterToIndex(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
        result = result * 26 + (letter.toUpperCase().charCodeAt(i) - 64);
    }
    return result - 1;
}

function indexToColLetter(index: number): string {
    let letter = "";
    let n = index + 1;
    while (n > 0) {
        const rem = (n - 1) % 26;
        letter = String.fromCharCode(65 + rem) + letter;
        n = Math.floor((n - 1) / 26);
    }
    return letter;
}

async function fetchFbInsights(
    accountId: string,
    token: string,
    since: string,
    until: string,
    fields: string[]
): Promise<Record<string, string>[]> {
    const fieldsParam = [...new Set([
        "date_start", "account_id", "account_name", "ad_id", "ad_name",
        "adset_id", "adset_name", "campaign_id", "campaign_name", ...fields,
    ])].join(",");

    const params = new URLSearchParams({
        fields: fieldsParam,
        time_range: JSON.stringify({ since, until }),
        time_increment: "1",
        level: "ad",
        limit: "500",
        access_token: token,
    });

    let rows: Record<string, string>[] = [];
    let url: string | null = `${FB_API}/${accountId}/insights?${params}`;

    while (url) {
        const fbRes = await fetch(url);
        const fbData: {
            data?: Record<string, string>[];
            error?: { message: string };
            paging?: { next?: string };
        } = await fbRes.json();
        if (fbData.error) throw new Error(fbData.error.message);
        rows = rows.concat(fbData.data ?? []);
        url = fbData.paging?.next ?? null;
    }

    return rows;
}

function sumActionArray(row: Record<string, unknown>, fieldName: string): number {
    const actions = row[fieldName];
    if (!Array.isArray(actions)) return 0;
    return actions.reduce((sum, a: { value?: string | number }) => {
        const v = parseFloat(String(a?.value ?? "0"));
        return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
}

function formatSecondsToMMSS(totalSeconds: number): string {
    const s = Math.max(0, Math.round(totalSeconds));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}.${ss}`;
}

function extractActionsByType(
    row: Record<string, unknown>,
    typePrefix: string
): number {
    const actions = row["actions"];
    if (!Array.isArray(actions)) return 0;
    const match = actions.find(
        (a: { action_type?: string }) =>
            typeof a.action_type === "string" &&
            a.action_type.startsWith(typePrefix)
    );
    const v = parseFloat(String(match?.value ?? "0"));
    return Number.isFinite(v) ? v : 0;
}

function getMetricValue(fbRow: Record<string, unknown>, fbCol: string): number {
    if (!fbCol || fbCol === "__skip__") return 0;
    const apiField = FB_FIELD_MAP[fbCol] ?? fbCol;

    if (fbCol === "conversions") return extractActionsByType(fbRow, "offsite_conversion.fb_pixel_purchase");
    if (fbCol === "cost_per_conversion") {
        const raw = fbRow["cost_per_action_type"];
        if (!Array.isArray(raw)) return 0;
        const match = raw.find((a: { action_type?: string, value?: string | number }) => typeof a.action_type === "string" && a.action_type.startsWith("offsite_conversion.fb_pixel_purchase"));
        const v = parseFloat(String(match?.value ?? "0"));
        return Number.isFinite(v) ? v : 0;
    }
    if (fbCol === "messages") return extractActionsByType(fbRow, "onsite_conversion.messaging_conversation_started");
    if (fbCol === "video_3s") return extractActionsByType(fbRow, "video_view");

    if (["video_avg_time", "video_plays", "video_p25", "video_p50", "video_p75", "video_p95", "video_p100", "video_views"].includes(fbCol)) {
        const val = fbRow[apiField];
        if (Array.isArray(val)) return sumActionArray(fbRow, apiField);
        const n = parseFloat(String(val ?? "0"));
        return Number.isFinite(n) ? n : 0;
    }

    const raw = fbRow[apiField];
    if (raw == null) return 0;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    return Number.isFinite(n) ? n : 0;
}

function mapRowToSheetRow(
    fbRow: Record<string, unknown>,
    mapping: ColumnMapping[]
): ({ colIndex: number; value: string } | null)[] {
    return mapping
        .filter((m) => m.sheetCol)
        .map((m) => {
            if (!m.fbCol || m.fbCol === "__skip__") {
                return null;
            }

            const TEXT_FIELDS = new Set(["date", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "account_id", "account_name"]);
            const isNumericField = !TEXT_FIELDS.has(m.fbCol);
            const apiField = FB_FIELD_MAP[m.fbCol] ?? m.fbCol;
            let value = "";

            if (m.fbCol === "conversions") {
                value = String(extractActionsByType(fbRow, "offsite_conversion.fb_pixel_purchase"));
            } else if (m.fbCol === "cost_per_conversion") {
                const raw = fbRow["cost_per_action_type"];
                if (Array.isArray(raw)) {
                    const match = raw.find((a: { action_type?: string, value?: string | number }) => typeof a.action_type === "string" && a.action_type.startsWith("offsite_conversion.fb_pixel_purchase"));
                    value = String(match?.value ?? "0");
                } else {
                    value = "0";
                }
            } else if (m.fbCol === "messages") {
                value = String(extractActionsByType(fbRow, "onsite_conversion.messaging_conversation_started"));
            } else if (m.fbCol === "video_3s") {
                value = String(extractActionsByType(fbRow, "video_view"));
            } else if (m.fbCol === "video_avg_time") {
                const val = fbRow[apiField];
                const secs = Array.isArray(val) ? sumActionArray(fbRow, apiField) : parseFloat(String(val ?? "0")) || 0;
                value = formatSecondsToMMSS(secs);
            } else if (["video_plays", "video_p25", "video_p50", "video_p75", "video_p95", "video_p100", "video_views"].includes(m.fbCol)) {
                const val = fbRow[apiField];
                if (Array.isArray(val)) {
                    value = String(sumActionArray(fbRow, apiField));
                } else {
                    value = String(val ?? "0");
                }
            } else {
                value = String(fbRow[apiField] ?? "");
            }

            if (isNumericField && m.fbCol !== "video_avg_time" && (value === "" || value === "undefined" || value === "null")) {
                value = "0";
            }

            return { colIndex: colLetterToIndex(m.sheetCol), value };
        });
}

/**
 * Executes the export process: fetches data from FB, maps to columns, writes to Google Sheets, and saves a log.
 */
export async function runExportTask(options: ExportServiceOptions) {
    const {
        userId, fbToken, oauth2Client, adAccountIds, googleSheetId,
        sheetTab, columnMapping, writeMode, dataDate, dateRange = "today",
        configId, configName, exportType = "manual", timezone = "Asia/Bangkok"
    } = options;

    let since: string;
    let until: string;
    let logDate: Date;

    // Calculate dates based on provided timezone
    const now = new Date();
    const targetNowString = now.toLocaleString("en-US", { timeZone: timezone });
    const targetNow = new Date(targetNowString);

    if (exportType === "auto" || !dataDate) {
        if (dateRange === "yesterday") {
            const yesterday = subDays(targetNow, 1);
            since = until = format(yesterday, "yyyy-MM-dd");
            logDate = yesterday;
        } else if (dateRange === "last_7_days") {
            const sevenDaysAgo = subDays(targetNow, 7);
            since = format(sevenDaysAgo, "yyyy-MM-dd");
            until = format(targetNow, "yyyy-MM-dd");
            logDate = targetNow;
        } else {
            // default to today
            since = until = format(targetNow, "yyyy-MM-dd");
            logDate = targetNow;
        }
    } else {
        const parsedDate = dataDate instanceof Date ? dataDate : new Date(dataDate);
        const dateStringInTZ = parsedDate.toLocaleString("en-US", { timeZone: timezone });
        const dateInTZ = new Date(dateStringInTZ);
        since = until = format(dateInTZ, "yyyy-MM-dd");
        logDate = dateInTZ;
    }


    const fbFields = [
        ...new Set(
            columnMapping
                .filter((m) => m.fbCol && m.fbCol !== "__skip__")
                .map((m) => FB_FIELD_MAP[m.fbCol] ?? m.fbCol)
                .filter(Boolean)
        ),
    ];

    let totalRows = 0;
    let logStatus = "success";
    let logError: string | undefined;

    try {
        const allFbRows: Record<string, unknown>[] = [];
        for (const accountId of adAccountIds) {
            const rows = await fetchFbInsights(accountId, fbToken, since, until, fbFields);
            allFbRows.push(...rows);
        }

        const statsCols = new Set(["F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]);
        const statsMappings = columnMapping.filter(m => statsCols.has(m.sheetCol) && m.fbCol && m.fbCol !== "__skip__");

        const filteredFbRows = allFbRows.filter((fbRow) => {
            if (!statsMappings.length) return true;
            return statsMappings.map((m) => getMetricValue(fbRow as Record<string, unknown>, m.fbCol)).some((v) => v > 0);
        });

        totalRows = filteredFbRows.length;
        const sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });
        // Extract just the columns we actually want to write to
        const activeMappings = columnMapping.filter(m => m.sheetCol && m.fbCol && m.fbCol !== "__skip__");
        if (activeMappings.length === 0) {
            throw new Error("No valid columns to export");
        }

        // Group active mappings into contiguous ranges
        // e.g. if we have columns A, B, D, E, F, it becomes [[A, B], [D, E, F]]
        const sortedMappings = [...activeMappings].sort((a, b) => colLetterToIndex(a.sheetCol) - colLetterToIndex(b.sheetCol));

        type RangeGroup = { sheetCols: string[], colIndices: number[], fbCols: string[] };
        const mappingGroups: RangeGroup[] = [];

        for (const m of sortedMappings) {
            const idx = colLetterToIndex(m.sheetCol);
            if (mappingGroups.length === 0) {
                mappingGroups.push({ sheetCols: [m.sheetCol], colIndices: [idx], fbCols: [m.fbCol] });
            } else {
                const lastGroup = mappingGroups[mappingGroups.length - 1];
                const lastIndex = lastGroup.colIndices[lastGroup.colIndices.length - 1];
                if (idx === lastIndex + 1) {
                    // Contiguous
                    lastGroup.sheetCols.push(m.sheetCol);
                    lastGroup.colIndices.push(idx);
                    lastGroup.fbCols.push(m.fbCol);
                } else {
                    // Gap
                    mappingGroups.push({ sheetCols: [m.sheetCol], colIndices: [idx], fbCols: [m.fbCol] });
                }
            }
        }

        // We will do a batchUpdate. For append mode, we need to know the starting row.
        let startRow = 2; // For overwrite mode
        if (writeMode === "append") {
            const existing = await sheetsClient.spreadsheets.values.get({
                spreadsheetId: googleSheetId,
                range: `'${sheetTab}'!A:A`, // Just checking column A to find the last row might not be enough if A is skipped, but usually we map A. Let's check a wider range like A:ZZ to be safe, but just getting max rows is fine.
            });
            startRow = (existing.data.values?.length ?? 1) + 1;
        }

        const dataEntries = mappingGroups.map(group => {
            const startCol = group.sheetCols[0];
            const endCol = group.sheetCols[group.sheetCols.length - 1];

            // Build the rows array for this specific group
            const rowsForGroup = filteredFbRows.map(fbRow => {
                // We use mapRowToSheetRow, but we only need the exact values for this group
                // mapRowToSheetRow returns null for skipped, but here we only iterate through active ones anyway
                // So let's build the values directly
                return group.fbCols.map(fbCol => {
                    const tempMapping = [{ fbCol, sheetCol: "A" }]; // Dummy sheetCol just to use existing function logic
                    const mapped = mapRowToSheetRow(fbRow as Record<string, unknown>, tempMapping);
                    const item = mapped[0];
                    return item ? item.value : "";
                });
            });

            const rangeString = `'${sheetTab}'!${startCol}${startRow}:${endCol}${startRow + rowsForGroup.length - 1}`;

            return {
                range: rangeString,
                values: rowsForGroup
            };
        });

        if (writeMode === "overwrite") {
            // Clear existing data first, but ONLY for the columns we are writing to
            // This preserves formulas in skipped columns
            // However, clear might be complex with multiple ranges.
            // Let's clear the specific ranges we are about to write, but from row 2 to bottom
            const rangesToClear = mappingGroups.map(g => {
                return `'${sheetTab}'!${g.sheetCols[0]}2:${g.sheetCols[g.sheetCols.length - 1]}`;
            });

            await sheetsClient.spreadsheets.values.batchClear({
                spreadsheetId: googleSheetId,
                requestBody: {
                    ranges: rangesToClear
                }
            });
        }

        // Now do the batchUpdate
        await sheetsClient.spreadsheets.values.batchUpdate({
            spreadsheetId: googleSheetId,
            requestBody: {
                valueInputOption: "USER_ENTERED",
                data: dataEntries
            }
        });
    } catch (err: unknown) {
        logStatus = "error";
        logError = err instanceof Error ? err.message : "Unknown error";
        console.error("Export error:", err);
    }

    const sheetName = await (async () => {
        try {
            const drive = google.drive({ version: "v3", auth: oauth2Client });
            const file = await drive.files.get({ fileId: googleSheetId, fields: "name" });
            return file.data.name ?? googleSheetId;
        } catch {
            return googleSheetId;
        }
    })();

    const exportLog = await prisma.exportLog.create({
        data: {
            userId,
            configId: configId ?? null,
            configName: configName ?? null,
            exportType,
            sheetFileName: sheetName,
            sheetTabName: sheetTab,
            adAccountCount: adAccountIds.length,
            rowCount: totalRows,
            dataDate: logDate,
            status: logStatus,
            error: logError,
        },
    });

    if (logStatus === "error") throw new Error(logError);
    return { success: true, rowCount: totalRows, log: exportLog };
}
