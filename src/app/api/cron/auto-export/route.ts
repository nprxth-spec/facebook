import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runExportTask } from "@/lib/export-service";
import { getFacebookToken, getGoogleClient } from "@/lib/tokens";
import { format } from "date-fns";

// Secret token for cron job to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || "fallback_secret_key";

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
        // 2. Find all export configs that are auto-enabled
        const autoConfigs = await prisma.exportConfig.findMany({
            where: { isAuto: true },
        });

        if (autoConfigs.length === 0) {
            return NextResponse.json({ message: "No auto-export configs found" });
        }

        // 3. Get current time in HH:mm and day of week (Support Thailand timezone for Vercel)
        const now = new Date();
        const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
        const currentHourStr = bangkokTime.getHours().toString().padStart(2, "0");
        const currentDay = bangkokTime.getDay(); // 0 (Sun) to 6 (Sat)

        const url = new URL(req.url);
        const forceRun = url.searchParams.get("force") === "true";

        let processedFiles = 0;
        const errors: string[] = [];

        console.log(`[Auto-Export] Run triggered at Server: ${now.toISOString()}, BKK: ${bangkokTime.toLocaleString()}`);

        // 4. Process each configuration
        for (const config of autoConfigs) {
            console.log(`\n[Auto-Export] Checking config: "${config.name}" (ID: ${config.id})`);

            // Bypass schedule checks if forced
            if (!forceRun) {
                // Check if scheduled for today
                if (config.autoDays && Array.isArray(config.autoDays) && config.autoDays.length > 0) {
                    if (!config.autoDays.includes(currentDay)) {
                        console.log(`[-] Skipped: Not scheduled for today (Today is ${currentDay}, Schedule is ${config.autoDays.join(",")})`);
                        continue;
                    }
                }

                // Config schedule format is usually "HH:mm"
                const [scheduleHour, scheduleMinute] = (config.autoSchedule || "00:00").split(":");
                const currentMinuteStr = bangkokTime.getMinutes().toString().padStart(2, "0");

                // If the schedule hour matches the current hour, run it
                if (scheduleHour !== currentHourStr) {
                    console.log(`[-] Skipped: Hour mismatch (Current BKK time: ${currentHourStr}:${currentMinuteStr}, Scheduled time: ${scheduleHour}:${scheduleMinute})`);
                    continue;
                }

                if (parseInt(currentMinuteStr) < parseInt(scheduleMinute)) {
                    console.log(`[-] Skipped: Minute not reached yet (Current BKK time: ${currentHourStr}:${currentMinuteStr}, Scheduled time: ${scheduleHour}:${scheduleMinute})`);
                    continue;
                }


                // --- Deduplication Check ---
                // Check ExportLog to see if this config has already run successfully today
                const startOfToday = new Date(bangkokTime);
                startOfToday.setHours(0, 0, 0, 0);

                const endOfToday = new Date(bangkokTime);
                endOfToday.setHours(23, 59, 59, 999);

                const existingLog = await prisma.exportLog.findFirst({
                    where: {
                        configId: config.id,
                        exportType: "auto",
                        status: "success",
                        createdAt: {
                            gte: startOfToday,
                            lte: endOfToday,
                        }
                    }
                });

                if (existingLog) {
                    console.log(`[-] Skipped: Already ran successfully today (Log ID: ${existingLog.id})`);
                    continue;
                }
                // ---------------------------

            } else {
                console.log(`[!] Force run enabled, bypassing schedule checks.`);
            }

            console.log(`[+] Processing config "${config.name}"...`);


            try {
                const fbToken = await getFacebookToken(config.userId);
                const oauth2Client = await getGoogleClient(config.userId);

                if (!fbToken || !oauth2Client) {
                    console.error(`Missing tokens for user ${config.userId}`);
                    errors.push(`Config ${config.name} (${config.id}): Missing tokens`);
                    continue;
                }

                // Convert JSON mapping to proper type
                const columnMapping = config.columnMapping as Array<{ fbCol: string, sheetCol: string }>;

                await runExportTask({
                    userId: config.userId,
                    fbToken,
                    oauth2Client,
                    adAccountIds: config.adAccountIds,
                    googleSheetId: config.googleSheetId,
                    sheetTab: config.sheetTab,
                    columnMapping: columnMapping,
                    writeMode: config.writeMode as "append" | "overwrite",
                    dateRange: config.dateRange || "today",
                    configId: config.id,
                    configName: config.name,
                    exportType: "auto"
                });

                processedFiles++;
            } catch (e: any) {
                console.error(`Failed auto export for config ${config.id}`, e);
                errors.push(`Config ${config.name} (${config.id}): ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedFiles,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err: any) {
        console.error("Cron auto-export failed", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

