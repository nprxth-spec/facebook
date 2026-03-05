import { CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Locale } from "date-fns";

interface ExportLog {
  id: string;
  configName?: string | null;
  sheetFileName?: string | null;
  sheetTabName?: string | null;
  rowCount: number;
  exportType: string;
  status: string;
  createdAt: string;
}

interface RecentExportsProps {
  stats: { recentLogs: ExportLog[] } | null;
  loading: boolean;
  isThai: boolean;
  locale: Locale;
}

export function RecentExports({ stats, loading, isThai, locale }: RecentExportsProps) {
  return (
    <div className="lg:col-span-2 space-y-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
      <div className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          {isThai ? "ประวัติการส่งออกล่าสุด" : "Recent exports"}
        </h2>
      </div>
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-primary animate-spin" />
          </div>
        ) : !stats?.recentLogs?.length ? (
          <div className="text-center py-8">
            <FileSpreadsheet className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {isThai ? "ยังไม่มีประวัติการส่งออก" : "No export history yet"}
            </p>
            <Link href="/export">
              <Button size="sm" variant="outline" className="rounded-full">
                {isThai ? "เริ่มส่งออกข้อมูล" : "Start exporting"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {stats.recentLogs.map((log) => (
              <div
                key={log.id}
                className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    log.status === "success"
                      ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {log.configName ?? "ไม่มีชื่อ"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {log.sheetFileName ?? "—"} ·{" "}
                    {format(new Date(log.createdAt), "d MMM HH:mm", { locale })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {log.rowCount.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-gray-500">
                      {isThai ? "แถว" : "rows"}
                    </span>
                  </p>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {log.exportType === "auto"
                      ? isThai
                        ? "อัตโนมัติ"
                        : "Auto"
                      : isThai
                      ? "แมนวล"
                      : "Manual"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

