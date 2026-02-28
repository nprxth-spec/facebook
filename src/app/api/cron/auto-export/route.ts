import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runExportTask } from "@/lib/export-service";
import { getFacebookToken, getGoogleClient } from "@/lib/tokens";
import { format } from "date-fns";

// Secret token for cron job to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || "fallback_secret_key";
const CRON_BATCH_SIZE = 5; // Process up to 5 export configs concurrently

export async function GET(req: Request) {
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

        const now = new Date();
        const forceRun = url.searchParams.get("force") === "true";

        console.log(`[Auto-Export] Run triggered at ${now.toISOString()} | Configs: ${autoConfigs.length} | Force: ${forceRun}`);

        // 3. Filter configs that should run now (schedule + dedup check)
        const configsToRun = await Promise.all(
            autoConfigs.map(async (config) => {
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

                    // Deduplication: skip if already ran today in user's timezone
                    const startOfToday = new Date(userTime);
                    startOfToday.setHours(0, 0, 0, 0);
                    const endOfToday = new Date(userTime);
                    endOfToday.setHours(23, 59, 59, 999);

                    const existingLog = await prisma.exportLog.findFirst({
                        where: {
                            configId: config.id,
                            exportType: "auto",
                            status: "success",
                            createdAt: { gte: startOfToday, lte: endOfToday },
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

        const pending = configsToRun.filter(Boolean) as typeof autoConfigs;
        console.log(`[Auto-Export] Pending: ${pending.length} configs`);

        let processedCount = 0;
        const errors: string[] = [];

        // 4. Process in parallel batches (CRON_BATCH_SIZE at a time)
        for (let i = 0; i < pending.length; i += CRON_BATCH_SIZE) {
            const batch = pending.slice(i, i + CRON_BATCH_SIZE);

            await Promise.all(
                batch.map(async (config) => {
                    try {
                        const fbToken = await getFacebookToken(config.userId);
                        const oauth2Client = await getGoogleClient(config.userId);

                        if (!fbToken || !oauth2Client) {
                            errors.push(`"${config.name}": Missing tokens`);
                            return;
                        }

                        const userTimezone = config.user.preferences?.timezone || "Asia/Bangkok";
                        const columnMapping = config.columnMapping as Array<{ fbCol: string; sheetCol: string }>;

                        await runExportTask({
                            userId: config.userId,
                            fbToken,
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
            skipped: autoConfigs.length - pending.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: unknown) {
        console.error("Cron auto-export failed:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// Suppress unused import warning
void format;
