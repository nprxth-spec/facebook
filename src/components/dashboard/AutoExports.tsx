import { Clock } from "lucide-react";

interface AutoExportConfig {
  id: string;
  name: string;
  googleSheetName: string | null;
  sheetTab: string | null;
  autoSchedule: string | null;
  autoDays: number[] | null;
  isAuto: boolean;
}

interface AutoExportsProps {
  configs: AutoExportConfig[];
  loading: boolean;
  isThai: boolean;
  formatAutoDays: (days: number[] | null | undefined) => string;
}

export function AutoExports({
  configs,
  loading,
  isThai,
  formatAutoDays,
}: AutoExportsProps) {
  return (
    <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {isThai ? "งานอัตโนมัติ" : "Automations"}
        </h3>
      </div>
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-primary animate-spin" />
          </div>
        ) : !configs.length ? (
          <div className="py-2 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isThai ? "ไม่มีงานที่ทำงานอยู่" : "No active automations"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {configs.slice(0, 3).map((cfg) => (
              <div
                key={cfg.id}
                className="flex items-center gap-3 py-2 px-1"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {cfg.name || (isThai ? "ไม่มีชื่อ" : "Untitled")}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {cfg.autoSchedule}
                    {cfg.autoDays &&
                      cfg.autoDays.length > 0 &&
                      ` · ${formatAutoDays(cfg.autoDays)}`}
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

