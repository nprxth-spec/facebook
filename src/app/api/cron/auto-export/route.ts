import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runExportTask } from "@/lib/export-service";
import { getAllFacebookTokens, getGoogleClient } from "@/lib/tokens";
import { format } from "date-fns";

// Secret token for cron job to prevent unauthorized access
// ต้องกำหนดผ่าน env เสมอ ห้ามมี fallback แบบเดิมที่เดาง่าย
const CRON_SECRET = process.env.CRON_SECRET;
const CRON_BATCH_SIZE =
    Number.parseInt(process.env.CRON_BATCH_SIZE || "5") || 5; // Process export configs concurrently
const MAX_AUTO_EXPORT_CONFIGS =
    Number.parseInt(process.env.MAX_AUTO_EXPORT_CONFIGS || "50") || 50;
const MAX_EXPORT_AD_ACCOUNTS =
    Number.parseInt(process.env.MAX_EXPORT_AD_ACCOUNTS || "25") || 25;

export async function GET(req: Request) {
    // 0. Guard: ถ้าไม่ตั้งค่า CRON_SECRET ให้ fail ชัดเจน (โดยเฉพาะ production)
    if (!CRON_SECRET) {
        console.error("[Auto-Export] CRON_SECRET is not configured");
        return NextResponse.json(
            { error: "Cron secret is not configured on the server" },
            { status: 500 }
        );
    }

    // 1. Verify cron secret (support both Header and Query Parameter)
    const url = new URL(req.url);
    const secretQuery = url.searchParams.get("secret");
    const authHeader = req.headers.get("authorization");

    const isValidToken = authHeader === `Bearer ${CRON_SECRET}` || secretQuery === CRON_SECRET;

    if (!isValidToken) {
        return NextResponse.json({ error: "Unauthorized cron block" }, { status: 401 });
    }

    try {
        // 2. Find all export configs that are auto-enabled (include user preferences)
        const autoConfigs = await prisma.exportConfig.findMany({
            where: { isAuto: true },
            include: {
                user: {
                    include: { preferences: true }
                }
            }
        });

        if (autoConfigs.length === 0) {
            return NextResponse.json({ message: "No auto-export configs found" });
        }

        if (autoConfigs.length > MAX_AUTO_EXPORT_CONFIGS) {
            console.warn(
                `[Auto-Export] Too many auto configs (${autoConfigs.length}). Limiting to first ${MAX_AUTO_EXPORT_CONFIGS}.`
            );
        }

        const limitedAutoConfigs = autoConfigs.slice(0, MAX_AUTO_EXPORT_CONFIGS);

        const now = new Date();
        const forceRun = url.searchParams.get("force") === "true";

        console.log(
            `[Auto-Export] Run triggered at ${now.toISOString()} | Configs: ${autoConfigs.length} (processing up to ${limitedAutoConfigs.length}) | Force: ${forceRun}`
        );

        // 3. Filter configs that should run now (schedule + dedup check)
        const configsToRun = await Promise.all(
            limitedAutoConfigs.map(async (config) => {
                const userTimezone = config.user.preferences?.timezone || "Asia/Bangkok";
                const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
                const currentHour = userTime.getHours().toString().padStart(2, "0");
                const currentMin = userTime.getMinutes().toString().padStart(2, "0");
                const currentDay = userTime.getDay();

                if (!forceRun) {
                    // Check day schedule
                    if (config.autoDays && Array.isArray(config.autoDays) && config.autoDays.length > 0) {
                        if (!config.autoDays.includes(currentDay)) return null;
                    }

                    // Check hour/minute schedule
                    const [schedHour, schedMin] = (config.autoSchedule || "00:00").split(":");
                    if (schedHour !== currentHour) return null;
                    if (parseInt(currentMin) < parseInt(schedMin)) return null;

                    // Deduplication: skip if already ran successfully in the last 12 hours
                    // This handles timezone differences robustly because the schedule runs exactly once per 24 hours.
                    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

                    const existingLog = await prisma.exportLog.findFirst({
                        where: {
                            configId: config.id,
                            exportType: "auto",
                            status: "success",
                            createdAt: { gte: twelveHoursAgo },
                        },
                        select: { id: true },
                    });

                    if (existingLog) {
                        console.log(`[-] Skip "${config.name}": already ran today`);
                        return null;
                    }
                }

                return config;
            })
        );

        const pending = configsToRun.filter(Boolean) as typeof limitedAutoConfigs;
        console.log(`[Auto-Export] Pending: ${pending.length} configs`);

        let processedCount = 0;
        const errors: string[] = [];

        // 4. Process in parallel batches (CRON_BATCH_SIZE at a time)
        for (let i = 0; i < pending.length; i += CRON_BATCH_SIZE) {
            const batch = pending.slice(i, i + CRON_BATCH_SIZE);

            await Promise.all(
                batch.map(async (config) => {
                    try {
                        const fbAccounts = await getAllFacebookTokens(config.userId);
                        const oauth2Client = await getGoogleClient(config.userId);

                        if (!fbAccounts.length || !oauth2Client) {
                            errors.push(`"${config.name}": Missing tokens`);
                            return;
                        }
                        const fbTokens = fbAccounts.map((a) => a.token);

                        const userTimezone = config.user.preferences?.timezone || "Asia/Bangkok";
                        const columnMapping = config.columnMapping as Array<{ fbCol: string; sheetCol: string }>;

                        if (config.adAccountIds.length > MAX_EXPORT_AD_ACCOUNTS) {
                            const msg = `Too many ad accounts (${config.adAccountIds.length}) in auto config "${config.name}". Max allowed is ${MAX_EXPORT_AD_ACCOUNTS}.`;
                            console.warn("[Auto-Export] " + msg);
                            errors.push(msg);
                            return;
                        }

                        await runExportTask({
                            userId: config.userId,
                            fbTokens,
                            oauth2Client,
                            adAccountIds: config.adAccountIds,
                            googleSheetId: config.googleSheetId,
                            sheetTab: config.sheetTab,
                            columnMapping,
                            writeMode: config.writeMode as "append" | "overwrite",
                            dateRange: config.dateRange || "today",
                            configId: config.id,
                            configName: config.name,
                            exportType: "auto",
                            timezone: userTimezone,
                            ip: "server",
                            userAgent: "cron-auto-export",
                            sourcePath: "/api/cron/auto-export",
                        });

                        processedCount++;
                        console.log(`[+] Done: "${config.name}"`);
                    } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : String(e);
                        console.error(`[!] Failed: "${config.name}":`, msg);
                        errors.push(`"${config.name}": ${msg}`);
                    }
                })
            );
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            skipped: limitedAutoConfigs.length - pending.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: unknown) {
        console.error("Cron auto-export failed:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Suppress unused import warning
void format;
