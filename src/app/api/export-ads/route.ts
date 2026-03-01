import { auth } from "@/lib/auth";
import { getAllFacebookTokens, getGoogleClient } from "@/lib/tokens";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/db";

const FB_API = "https://graph.facebook.com/v19.0";
const SKIP_COL = "__skip__";

interface ColumnMapping { fbCol: string; sheetCol: string }

interface ExportAdsRequest {
    adAccountIds: string[];  // accountId format e.g. "act_XXXXXX"
    googleSheetId: string;
    sheetTab: string;
    columnMapping: ColumnMapping[];
}

function colLetterToIndex(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
        result = result * 26 + (letter.toUpperCase().charCodeAt(i) - 64);
    }
    return result - 1;
}

/** ดึงข้อมูลโฆษณาจาก FB /ads endpoint (ไม่ใช่ insights) */
async function fetchAdsInfo(accountId: string, token: string): Promise<Record<string, unknown>[]> {
    const fields = [
        "id",
        "name",
        "adset_id",
        "campaign_id",
        "created_time",
        "status",
        "effective_status",
        "creative{name,object_story_spec,body,image_url}",
        "adset{daily_budget,lifetime_budget,targeting_optimization_types,targeting{age_min,age_max,age_range,genders,interests,flexible_spec,excluded_custom_audiences}}",
        "campaign{name,objective}",
        "insights.date_preset(lifetime){spend}"
    ].join(",");

    // ดึง account name แยก
    const accountRes = await fetch(`${FB_API}/${accountId}?fields=name&access_token=${token}`);
    const accountData = await accountRes.json() as { name?: string };
    const accountName = accountData.name ?? accountId;

    let rows: Record<string, unknown>[] = [];
    let url: string | null =
        `${FB_API}/${accountId}/ads?fields=${encodeURIComponent(fields)}&limit=100&access_token=${token}`;

    while (url) {
        const res = await fetch(url);
        const data: { data?: Record<string, unknown>[]; error?: { message: string }; paging?: { next?: string } } = await res.json();
        if (data.error) throw new Error(data.error.message);
        const chunk = (data.data ?? []).map(ad => ({ ...ad, _account_name: accountName }));
        rows = rows.concat(chunk);
        url = data.paging?.next ?? null;
    }

    return rows;
}

/** แปลงข้อมูล targeting → text (รองรับ Advantage+ audience) */
function parseTargeting(adset: Record<string, unknown> | undefined) {
    if (!adset) return { sex: "", age: "", interests: "" };

    const targeting = adset.targeting as Record<string, unknown> | undefined;
    if (!targeting) return { sex: "", age: "", interests: "" };

    // Gender: 1=Male, 2=Female, ไม่มี=ทุกเพศ
    const genders = targeting.genders as number[] | undefined;
    let sex = "ทุกเพศ";
    if (genders?.includes(1) && !genders.includes(2)) sex = "Male";
    else if (genders?.includes(2) && !genders.includes(1)) sex = "Female";

    // Age — regular targeting
    let ageMin = targeting.age_min as number | undefined;
    let ageMax = targeting.age_max as number | undefined;

    // Advantage+ Audience ใช้ age_range: [min, max]
    const ageRange = targeting.age_range as number[] | undefined;
    if (Array.isArray(ageRange) && ageRange.length === 2) {
        ageMin = ageRange[0];
        ageMax = ageRange[1];
    }

    // flexible_spec (Advantage+ หรือ detailed targeting)
    const flexibleSpec = targeting.flexible_spec as Array<Record<string, unknown>> | undefined;
    if (flexibleSpec) {
        flexibleSpec.forEach((spec) => {
            if (spec.age_min !== undefined) ageMin = spec.age_min as number;
            if (spec.age_max !== undefined) ageMax = spec.age_max as number;
        });
    }

    const age = ageMin || ageMax ? `${ageMin ?? 18}-${ageMax ?? "65+"}` : "";

    // Interests — top-level + flexible_spec ทั้งคู่
    let interestList: string[] = (targeting.interests as Array<{ name: string }> | undefined)
        ?.map((i) => i.name).filter(Boolean) ?? [];

    if (flexibleSpec) {
        flexibleSpec.forEach((spec) => {
            const specInterests = spec.interests as Array<{ name: string }> | undefined;
            if (specInterests) interestList.push(...specInterests.map((i) => i.name).filter(Boolean));
            const behaviors = spec.behaviors as Array<{ name: string }> | undefined;
            if (behaviors) interestList.push(...behaviors.map((i) => i.name).filter(Boolean));
        });
    }
    interestList = Array.from(new Set(interestList));

    return { sex, age, interests: interestList.join(", ") };
}

/** แปลง excluded_custom_audiences → text */
function parseExcluded(adset: Record<string, unknown> | undefined): string {
    if (!adset) return "";
    const targeting = adset.targeting as Record<string, unknown> | undefined;
    if (!targeting) return "";
    const excluded = targeting.excluded_custom_audiences as Array<{ name?: string }> | undefined;
    return excluded?.map((e) => e.name ?? "").filter(Boolean).join(", ") ?? "";
}

/** ดึง page_id จาก creative */
function getPageId(ad: Record<string, unknown>): string {
    const creative = ad.creative as Record<string, unknown> | undefined;
    if (!creative) return "";
    const spec = creative.object_story_spec as Record<string, unknown> | undefined;
    return String(spec?.page_id ?? "");
}

/** ดึง caption/body จาก creative */
function getCaption(ad: Record<string, unknown>): string {
    const creative = ad.creative as Record<string, unknown> | undefined;
    if (!creative) return "";
    // Try link_data.message first, then photo_data.caption, then body
    const spec = creative.object_story_spec as Record<string, unknown> | undefined;
    if (spec) {
        const linkData = spec.link_data as Record<string, unknown> | undefined;
        if (linkData?.message) return String(linkData.message);
        const photoData = spec.photo_data as Record<string, unknown> | undefined;
        if (photoData?.caption) return String(photoData.caption);
        const videoData = spec.video_data as Record<string, unknown> | undefined;
        if (videoData?.message) return String(videoData.message);
    }
    return String(creative.body ?? "");
}

/** แปลง FB budget (เป็น cents) → หน่วยหลัก */
function parseBudget(adset: Record<string, unknown> | undefined): string {
    if (!adset) return "";
    const daily = adset.daily_budget as string | undefined;
    const lifetime = adset.lifetime_budget as string | undefined;
    if (daily && daily !== "0") return String(parseInt(daily) / 100);
    if (lifetime && lifetime !== "0") return String(parseInt(lifetime) / 100);
    return "";
}

/** แปลง created_time RFC3339 → date string */
function formatDate(ts: string | undefined): string {
    if (!ts) return "";
    try {
        return new Date(ts).toISOString().split("T")[0];
    } catch {
        return ts;
    }
}

/** หา Custom Status ตามเงื่อนไข */
function getCustomStatus(ad: Record<string, unknown>): string {
    const eff = String(ad.effective_status ?? ad.status ?? "").toUpperCase();
    const insights = ad.insights as { data?: { spend?: string }[] } | undefined;
    const spend = parseFloat(insights?.data?.[0]?.spend ?? "0");
    const hasStats = spend > 0;

    if (["ACTIVE"].includes(eff)) return "Active";
    if (["PENDING_REVIEW", "IN_PROCESS", "PREAPPROVED"].includes(eff)) return "Review";
    if (["PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED"].includes(eff)) return "Ads off";
    if (["DISAPPROVED"].includes(eff)) return hasStats ? "Inactive(Content)" : "Fail(Content)";
    if (["WITH_ISSUES", "ADACCOUNT_DISABLED", "CAMPAIGN_GROUP_DISABLED", "NO_CREDIT_CARD_ERROR"].includes(eff)) {
        return hasStats ? "Inactive(Acc/Page)" : "Fail(Acc/Page)";
    }

    // Fallback based on hasStats assuming anything else weird is an account level error if not explicitly Active/Paused
    if (!eff || eff === "UNKNOWN") return "Review"; // Just a fallback, usually FB gives status
    return eff;
}

/** ดึงค่า field จาก ad row ตาม fbCol key */
function getAdFieldValue(ad: Record<string, unknown>, fbCol: string): string {
    const adset = ad.adset as Record<string, unknown> | undefined;
    const targeting = parseTargeting(adset);

    switch (fbCol) {
        case "ad_id": return String(ad.id ?? "");
        case "page_id": return getPageId(ad);
        case "account_name": return String((ad._account_name as string) ?? "");
        case "creative_name": {
            const creative = ad.creative as Record<string, unknown> | undefined;
            return String(creative?.name ?? "");
        }
        case "sex": return targeting.sex;
        case "age": return targeting.age;
        case "interests": return targeting.interests;
        case "excluded_interests": return parseExcluded(adset);
        case "budget": return parseBudget(adset);
        case "created_time": return formatDate(ad.created_time as string | undefined);
        case "captions": return getCaption(ad);
        case "ad_name": return String(ad.name ?? "");
        case "campaign_name": {
            const campaign = ad.campaign as Record<string, unknown> | undefined;
            return String(campaign?.name ?? "");
        }
        case "status": return getCustomStatus(ad);
        default: return "";
    }
}

export async function POST(req: Request) {
    try { assertSameOrigin(req); } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: ExportAdsRequest = await req.json();
    const { adAccountIds, googleSheetId, sheetTab, columnMapping } = body;

    if (!adAccountIds?.length) return NextResponse.json({ error: "No ad accounts selected" }, { status: 400 });
    if (!googleSheetId) return NextResponse.json({ error: "No Google Sheet selected" }, { status: 400 });
    if (!sheetTab) return NextResponse.json({ error: "No sheet tab selected" }, { status: 400 });
    if (!columnMapping?.length) return NextResponse.json({ error: "No column mapping" }, { status: 400 });

    // ── Tokens ───────────────────────────────────────────────────────────────
    const fbTokens = await getAllFacebookTokens(session.user.id);
    if (!fbTokens.length) return NextResponse.json({ error: "Facebook not connected" }, { status: 400 });

    const oauth2Client = await getGoogleClient(session.user.id);
    if (!oauth2Client) return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    // ─────────────────────────────────────────────────────────────────────────

    try {
        // ดึง ad จากทุก account ที่เลือก (ใช้ token ที่ดีที่สุดสำหรับ account นั้น)
        const allAds: Record<string, unknown>[] = [];
        for (const accountId of adAccountIds) {
            // หา token ที่ตรงกับ account นี้ หรือใช้ token แรกที่มี
            const token = fbTokens[0].token;
            try {
                const ads = await fetchAdsInfo(accountId, token);
                allAds.push(...ads);
            } catch (e) {
                console.warn(`[export-ads] Failed to fetch ads for ${accountId}:`, e);
            }
        }

        // ── Google Sheets ────────────────────────────────────────────────────
        const sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });

        // ดึง existing adids จาก column A เพื่อ dedup และรู้ว่าอยู่บรรทัดไหน
        const existingRes = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: googleSheetId,
            range: `'${sheetTab}'!A:A`,
        });
        const existingAdIdsArr = (existingRes.data.values ?? []).map(r => String(r[0] ?? ""));

        const adIdToRow = new Map<string, number>();
        existingAdIdsArr.forEach((id, idx) => {
            if (id) adIdToRow.set(id, idx + 1); // sheet is 1-based, array is 0-based
        });

        // แยก ad ใหม่ (append) กับ ad เดิม (update status)
        const newAds = allAds.filter((ad) => {
            const adId = String(ad.id ?? "");
            return adId && !adIdToRow.has(adId);
        });

        const existingAdsToUpdate = allAds.filter((ad) => {
            const adId = String(ad.id ?? "");
            return adId && adIdToRow.has(adId);
        });

        const activeMappings = columnMapping.filter((m) => m.sheetCol && m.fbCol && m.fbCol !== SKIP_COL);
        const sortedMappings = [...activeMappings].sort((a, b) => colLetterToIndex(a.sheetCol) - colLetterToIndex(b.sheetCol));

        const batchUpdateRequests: any[] = [];

        // --- ส่วนที่ 1: Insert แถวใหม่ ---
        if (newAds.length > 0) {
            // หา start row — ต่อ row สุดท้ายเสมอ
            const lastRow = existingAdIdsArr.length || 1;
            const startRow = lastRow + 1;

            // Build range groups (contiguous columns)
            type RangeGroup = { startCol: string; endCol: string; fbCols: string[] };
            const groups: RangeGroup[] = [];
            for (const m of sortedMappings) {
                if (!groups.length) {
                    groups.push({ startCol: m.sheetCol, endCol: m.sheetCol, fbCols: [m.fbCol] });
                } else {
                    const last = groups[groups.length - 1];
                    const lastIdx = colLetterToIndex(last.endCol);
                    const thisIdx = colLetterToIndex(m.sheetCol);
                    if (thisIdx === lastIdx + 1) {
                        last.endCol = m.sheetCol;
                        last.fbCols.push(m.fbCol);
                    } else {
                        groups.push({ startCol: m.sheetCol, endCol: m.sheetCol, fbCols: [m.fbCol] });
                    }
                }
            }

            const dataEntries = groups.map((g) => ({
                range: `'${sheetTab}'!${g.startCol}${startRow}:${g.endCol}${startRow + newAds.length - 1}`,
                values: newAds.map((ad) =>
                    g.fbCols.map((fbCol) => getAdFieldValue(ad, fbCol))
                ),
            }));
            batchUpdateRequests.push(...dataEntries);
        }

        // --- ส่วนที่ 2: Update status แถวเดิม ---
        if (existingAdsToUpdate.length > 0) {
            const statusCol = activeMappings.find(m => m.fbCol === "status")?.sheetCol;
            if (statusCol) {
                const updateEntries = existingAdsToUpdate.map(ad => {
                    const rowNum = adIdToRow.get(String(ad.id));
                    const newStatus = getAdFieldValue(ad, "status");
                    return {
                        range: `'${sheetTab}'!${statusCol}${rowNum}`,
                        values: [[newStatus]]
                    };
                });
                batchUpdateRequests.push(...updateEntries);
            }
        }

        if (batchUpdateRequests.length === 0) {
            return NextResponse.json({ success: true, rowCount: 0, skipped: allAds.length, updated: 0 });
        }

        await sheetsClient.spreadsheets.values.batchUpdate({
            spreadsheetId: googleSheetId,
            requestBody: { valueInputOption: "USER_ENTERED", data: batchUpdateRequests },
        });

        // Log
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        const fileInfo = await drive.files.get({ fileId: googleSheetId, fields: "name" }).catch(() => null);
        const sheetFileName = fileInfo?.data?.name ?? googleSheetId;

        await prisma.exportLog.create({
            data: {
                userId: session.user.id,
                exportType: "ads_info",
                sheetFileName,
                sheetTabName: sheetTab,
                adAccountCount: adAccountIds.length,
                rowCount: newAds.length,
                dataDate: new Date(),
                status: "success",
            },
        });

        return NextResponse.json({
            success: true,
            rowCount: newAds.length,
            skipped: allAds.length - newAds.length,
            updated: existingAdsToUpdate.length,
        });
    } catch (err: unknown) {
        console.error("[export-ads] Error:", err);
        const msg = err instanceof Error ? err.message : "Export failed";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
