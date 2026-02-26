"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, ChevronDown, Check, X, Calendar, Save, Play, Plus, Trash2,
  FileSpreadsheet, Clock, RefreshCw, ChevronLeft, ChevronRight, Loader2, AlertCircle, FileClock,
  XCircle, CheckCircle2, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { useTheme } from "@/components/providers/ThemeProvider";

// ---- Types ----
interface AdAccount { id: string; accountId: string; name: string; isActive: boolean; currency?: string }
interface SheetFile { id: string; name: string; modifiedTime?: string }
interface SheetTab { sheetId: number; title: string; index: number }
interface ColumnMapping { fbCol: string; sheetCol: string }
interface ExportConfig {
  id?: string
  name: string
  adAccountIds: string[]
  googleSheetId: string
  googleSheetName: string
  sheetTab: string
  columnMapping: ColumnMapping[]
  writeMode: "append" | "overwrite"
  isAuto: boolean
  autoSchedule: string
  dateRange: string
  autoDays: number[]
}

interface ExportLog {
  id: string;
  configName?: string | null;
  exportType: string;
  sheetFileName?: string | null;
  sheetTabName?: string | null;
  adAccountCount: number;
  rowCount: number;
  dataDate?: string | null;
  status: string;
  error?: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: ExportLog[];
  total: number;
  page: number;
  limit: number;
}

// ค่า fbCol สำหรับคอลัมน์ที่ต้องการเว้นว่าง (skip)
const SKIP_FB_COL = "__skip__";

const FB_COLUMNS = [
  "date",
  "account_id",
  "account_name",
  "ad_id",
  "ad_name",
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "impressions",
  "reach",
  "engagement",
  "clicks",
  "spend",
  "cpc",
  "cpm",
  "ctr",
  "frequency",
  "conversions",
  "cost_per_conversion",
  "link_clicks",
  "messages",
  "video_avg_time",
  "video_plays",
  "video_3s",
  "video_p25",
  "video_p50",
  "video_p75",
  "video_p95",
  "video_p100",
  "video_views",
];
const SHEET_COLS = "ABCDEFGHIJKLMNOPQRST".split("");

const DAYS = [
  { id: 0, labelTh: "อา", labelEn: "Su" },
  { id: 1, labelTh: "จ", labelEn: "Mo" },
  { id: 2, labelTh: "อ", labelEn: "Tu" },
  { id: 3, labelTh: "พ", labelEn: "We" },
  { id: 4, labelTh: "พฤ", labelEn: "Th" },
  { id: 5, labelTh: "ศ", labelEn: "Fr" },
  { id: 6, labelTh: "ส", labelEn: "Sa" },
];

const DEFAULT_CONFIG: ExportConfig = {
  name: "",
  adAccountIds: [],
  googleSheetId: "",
  googleSheetName: "",
  sheetTab: "",
  // ค่าเริ่มต้นตามที่กำหนด
  columnMapping: [
    { fbCol: "date", sheetCol: "A" }, // date
    { fbCol: "ad_id", sheetCol: "B" }, // ad id
    { fbCol: SKIP_FB_COL, sheetCol: "C" }, // skip (ว่าง)
    { fbCol: SKIP_FB_COL, sheetCol: "D" }, // skip (ว่าง)
    { fbCol: SKIP_FB_COL, sheetCol: "E" }, // skip (ว่าง)
    { fbCol: "reach", sheetCol: "F" }, // Reach
    { fbCol: "impressions", sheetCol: "G" }, // Impression
    { fbCol: "engagement", sheetCol: "H" }, // Engagement
    { fbCol: "clicks", sheetCol: "I" }, // Click all
    { fbCol: "messages", sheetCol: "J" }, // Message
    { fbCol: "spend", sheetCol: "K" }, // Cost
    { fbCol: SKIP_FB_COL, sheetCol: "L" }, // skip (ว่าง)
    { fbCol: "video_avg_time", sheetCol: "M" }, // VDO Average Play time
    { fbCol: "video_plays", sheetCol: "N" }, // การเล่นวีดิโอ
    { fbCol: "video_3s", sheetCol: "O" }, // การเล่นวีดิโอ 3 วินาที
    { fbCol: "video_p25", sheetCol: "P" }, // VDO Plays at 25%
    { fbCol: "video_p50", sheetCol: "Q" }, // VDO Plays at 50%
    { fbCol: "video_p75", sheetCol: "R" }, // VDO Plays at 75%
    { fbCol: "video_p95", sheetCol: "S" }, // VDO Plays at 95%
    { fbCol: "video_p100", sheetCol: "T" }, // VDO Plays at 100%
  ],
  writeMode: "append",
  isAuto: false,
  autoSchedule: "08:00",
  dateRange: "today",
  autoDays: [0, 1, 2, 3, 4, 5, 6],
};

// ---- Multi-select dropdown ----
function MultiSelectDropdown({
  options, selected, onChange, placeholder, loading, error,
}: {
  options: AdAccount[]; selected: string[]; onChange: (ids: string[]) => void;
  placeholder: string; loading?: boolean; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
  );
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !loading && setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
          error ? "border-red-400" : "border-gray-200 dark:border-gray-700 hover:border-primary"
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังโหลด...
          </span>
        ) : error ? (
          <span className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </span>
        ) : (
          <span className={cn("truncate", !selected.length && "text-gray-400")}>
            {!selected.length
              ? placeholder
              : selected.length === 1
              ? options.find((o) => o.id === selected[0])?.name
              : `${selected.length} บัญชีที่เลือก`}
          </span>
        )}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {!!selected.length && (
            <span onClick={(e) => { e.stopPropagation(); onChange([]); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && !loading && !error && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาบัญชี..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="flex gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 text-xs">
            <button onClick={() => onChange(filtered.map((o) => o.id))} className="text-primary hover:underline">
              เลือกทั้งหมด
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={() => onChange([])} className="text-gray-500 hover:underline">
              ล้าง
            </button>
            {!!selected.length && (
              <span className="ml-auto text-gray-500">{selected.length} เลือก</span>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">ไม่พบบัญชี</div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      selected.includes(opt.id)
                        ? "bg-primary border-primary"
                        : "border-gray-300 dark:border-gray-500",
                    )}
                  >
                    {selected.includes(opt.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {opt.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {opt.id}
                      {opt.currency ? ` · ${opt.currency}` : ""}
                    </p>
                  </div>
                  {!opt.isActive && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      ปิดใช้งาน
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Single-select Sheet dropdown with search ----
function SheetDropdown({
  sheets,
  value,
  onChange,
  placeholder,
  loading,
  error,
}: {
  sheets: SheetFile[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder: string;
  loading?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [remoteSheets, setRemoteSheets] = useState<SheetFile[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกนอกกรอบ
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);

    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ค้นหาจาก Google Sheets ผ่าน API เมื่อมีการพิมพ์ค้นหา
  useEffect(() => {
    if (!open) return;
    const q = search.trim();
    if (!q) {
      setRemoteSheets(null);
      setRemoteError(null);
      setRemoteLoading(false);
      return;
    }

    setRemoteLoading(true);
    const controller = new AbortController();
    const id = setTimeout(() => {
      fetch(`/api/google/sheets?search=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.error) {
            setRemoteError(d.error);
            setRemoteSheets([]);
          } else {
            setRemoteError(null);
            setRemoteSheets(d.files ?? []);
          }
        })
        .catch((e) => {
          if (e.name === "AbortError") return;
          setRemoteError("ไม่สามารถค้นหาไฟล์ได้");
          setRemoteSheets([]);
        })
        .finally(() => setRemoteLoading(false));
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [open, search]);

  const baseList = remoteSheets ?? sheets;
  const current = baseList.find((s) => s.id === value) ?? null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !loading && setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary",
          error && "border-red-400"
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังโหลด...
          </span>
        ) : error ? (
          <span className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </span>
        ) : current ? (
          <span className="truncate">{current.name}</span>
        ) : (
          <span className="text-gray-400 truncate">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 text-gray-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && !loading && !error && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาไฟล์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {remoteLoading ? (
              <div className="flex items-center justify-center px-3 py-3 text-xs text-gray-500">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                กำลังค้นหา...
              </div>
            ) : remoteError ? (
              <div className="px-3 py-3 text-center text-xs text-red-500">
                {remoteError}
              </div>
            ) : baseList.length === 0 ? (
              <div className="px-3 py-3 text-center text-sm text-gray-500">
                ไม่พบไฟล์
              </div>
            ) : (
              baseList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id, s.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700",
                    s.id === value && "bg-primary/10 text-primary dark:bg-primary/40"
                  )}
                >
                  <span className="truncate text-gray-900 dark:text-gray-100">
                    {s.name}
                  </span>
                  {s.modifiedTime && (
                    <span className="mt-0.5 text-[10px] text-gray-400">
                      แก้ไขล่าสุด{" "}
                      {format(new Date(s.modifiedTime), "d MMM yyyy", { locale: th })}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Single-select Tab dropdown (Sheet tab) ----
function TabDropdown({
  tabs,
  value,
  onChange,
  placeholder,
  disabled,
  loading,
}: {
  tabs: SheetTab[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const current = tabs.find((t) => t.title === value) ?? null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || loading || !tabs.length}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> กำลังโหลด...
          </span>
        ) : !tabs.length ? (
          <span className="text-gray-400 truncate">
            {!disabled ? "ไม่พบชีต" : placeholder}
          </span>
        ) : current ? (
          <span className="truncate">{current.title}</span>
        ) : (
          <span className="text-gray-400 truncate">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 text-gray-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && !loading && !!tabs.length && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-60 overflow-y-auto py-1">
            {tabs.map((t) => (
              <button
                key={t.sheetId}
                type="button"
                onClick={() => {
                  onChange(t.title);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700",
                  t.title === value &&
                  "bg-primary/10 text-primary dark:bg-primary/40 dark:text-blue-100"
                )}
              >
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Mini Calendar ----
function MiniCalendar({
  value,
  onChange,
  locale,
  isThai,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
  locale: typeof th;
  isThai: boolean;
}) {
  const [cur, setCur] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(cur), end: endOfMonth(cur) });
  const firstDay = startOfMonth(cur).getDay();

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-72">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCur(subMonths(cur, 1))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {format(cur, "MMMM yyyy", { locale })}
        </span>
        <button
          onClick={() => setCur(addMonths(cur, 1))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d.id}
            className="text-center text-xs text-gray-400 py-1"
          >
            {isThai ? d.labelTh : d.labelEn}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {days.map((day) => {
          const sel = value ? isSameDay(day, value) : false;
          const today = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              onClick={() => onChange(day)}
              className={cn(
                "w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-colors",
                sel
                  ? "bg-primary text-white"
                  : today
                    ? "bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function ExportPage() {
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState("");

  const [sheets, setSheets] = useState<SheetFile[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [sheetsError, setSheetsError] = useState("");

  const [tabs, setTabs] = useState<SheetTab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);

  const [savedConfigs, setSavedConfigs] = useState<ExportConfig[]>([]);
  const [cfg, setCfg] = useState<ExportConfig>({ ...DEFAULT_CONFIG });
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);

  // --- Logs Modal State ---
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsData, setLogsData] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsFilterType, setLogsFilterType] = useState<"all" | "manual" | "auto">("all");
  const [logsFilterStatus, setLogsFilterStatus] = useState<"all" | "success" | "error">("all");
  const [debouncedLogsSearch, setDebouncedLogsSearch] = useState("");

  // Summary stats for logs
  const [logTotals, setLogTotals] = useState({ total: 0, success: 0, error: 0, rows: 0 });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLogsSearch(logsSearch), 400);
    return () => clearTimeout(t);
  }, [logsSearch]);

  useEffect(() => {
    setLogsPage(1);
  }, [debouncedLogsSearch, logsFilterType, logsFilterStatus]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(logsPage),
        limit: "15",
        ...(debouncedLogsSearch && { search: debouncedLogsSearch }),
        ...(logsFilterType !== "all" && { exportType: logsFilterType }),
        ...(logsFilterStatus !== "all" && { status: logsFilterStatus }),
      });
      const res = await fetch(`/api/export-logs?${params}`);
      const json = await res.json();
      setLogsData(json);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    } finally {
      setLogsLoading(false);
    }
  }, [logsPage, debouncedLogsSearch, logsFilterType, logsFilterStatus]);

  useEffect(() => {
    if (isLogsOpen) fetchLogs();
  }, [isLogsOpen, fetchLogs]);

  const fetchLogTotals = useCallback(() => {
    fetch("/api/export-logs?page=1&limit=1000")
      .then((r) => r.json())
      .then((d: LogsResponse) => {
        setLogTotals({
          total: d.total,
          success: d.logs.filter((l) => l.status === "success").length,
          error: d.logs.filter((l) => l.status === "error").length,
          rows: d.logs.reduce((sum, l) => sum + l.rowCount, 0),
        });
      })
      .catch(e => console.error("Failed to fetch log totals", e));
  }, []);

  useEffect(() => {
    fetchLogTotals();
  }, [fetchLogTotals]);

  const logsTotalPages = logsData ? Math.ceil(logsData.total / 15) : 0;

  // --- Delete Confirmation State ---
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<{ id: string, name: string } | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const { language } = useTheme();
  const isThai = language === "th";
  const locale = isThai ? th : enUS;

  // fetch ad accounts: ใช้ได้เฉพาะบัญชีที่เลือกใช้งานใน Settings (ManagerAccounts ที่ isActive = true)
  useEffect(() => {
    fetch("/api/manager-accounts")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("โหลดบัญชีไม่สำเร็จ");
        }
        const active = data.filter((acc: any) => acc.isActive);
        if (!active.length) {
          setAdAccounts([]);
          setAccountsError("ยังไม่มีบัญชีที่เลือกใช้งาน กรุณาไปเลือกในหน้า Settings");
        } else {
          const mapped: AdAccount[] = active.map((acc: any) => ({
            id: acc.accountId,
            accountId: acc.accountId,
            name: acc.name,
            isActive: true,
          }));
          setAdAccounts(mapped);
          setAccountsError("");
        }
      })
      .catch((e) => setAccountsError(e.message))
      .finally(() => setAccountsLoading(false));
  }, []);

  // fetch Google Sheets
  useEffect(() => {
    fetch("/api/google/sheets")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSheets(d.files);
      })
      .catch((e) => setSheetsError(e.message))
      .finally(() => setSheetsLoading(false));
  }, []);

  // fetch sheet tabs when sheet changes
  useEffect(() => {
    if (!cfg.googleSheetId) { setTabs([]); return; }
    setTabsLoading(true);
    fetch(`/api/google/sheets/${cfg.googleSheetId}/tabs`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTabs(d.tabs);
      })
      .catch(() => setTabs([]))
      .finally(() => setTabsLoading(false));
  }, [cfg.googleSheetId]);

  // fetch saved configs
  useEffect(() => {
    fetch("/api/export-configs")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setSavedConfigs(data));
  }, []);

  // close calendar on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const updateCfg = useCallback(<K extends keyof ExportConfig>(key: K, val: ExportConfig[K]) => {
    setCfg((p) => ({ ...p, [key]: val }));
  }, []);

  const addMapping = () => updateCfg("columnMapping", [...cfg.columnMapping, { fbCol: "", sheetCol: "" }]);
  const removeMapping = (i: number) => updateCfg("columnMapping", cfg.columnMapping.filter((_, idx) => idx !== i));
  const updateMapping = (i: number, key: "fbCol" | "sheetCol", val: string) => {
    const next = cfg.columnMapping.map((m, idx) => idx === i ? { ...m, [key]: val } : m);
    updateCfg("columnMapping", next);
  };

  const saveConfig = async () => {
    if (!cfg.name.trim()) {
      toast.error(isThai ? "กรุณาใส่ชื่อการตั้งค่า" : "Please enter a configuration name");
      return;
    }
    const sheetName = sheets.find((s) => s.id === cfg.googleSheetId)?.name ?? "";

    // หากเป็นแมนนวล ให้ล้างค่า schedule ออกเพื่อให้ระบบรู้ว่าเป็นประเภทแมนนวลถาวร
    const finalCfg = {
      ...cfg,
      googleSheetName: sheetName,
      autoSchedule: cfg.isAuto ? cfg.autoSchedule : ""
    };

    if (activeConfigId) {
      await fetch("/api/export-configs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: activeConfigId, ...finalCfg }) });
      setSavedConfigs((p) => p.map((c) => c.id === activeConfigId ? { ...finalCfg, id: activeConfigId } : c));
    } else {
      const res = await fetch("/api/export-configs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(finalCfg) });
      const saved = await res.json();
      setSavedConfigs((p) => [saved, ...p]);
      setActiveConfigId(saved.id);
    }
    toast.success(isThai ? "บันทึกการตั้งค่าสำเร็จ" : "Configuration saved");
  };

  const loadConfig = (c: ExportConfig) => {
    setCfg(c);
    setActiveConfigId(c.id ?? null);
    toast.info(
      isThai ? `โหลดการตั้งค่า "${c.name}" แล้ว` : `Loaded configuration "${c.name}"`,
    );
  };

  const deleteConfig = async () => {
    if (!configToDelete) return;
    await fetch("/api/export-configs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: configToDelete.id }) });
    setSavedConfigs((p) => p.filter((c) => c.id !== configToDelete.id));
    if (activeConfigId === configToDelete.id) setActiveConfigId(null);
    setIsDeleteConfirmOpen(false);
    setConfigToDelete(null);
    toast.success("ลบการตั้งค่าแล้ว");
  };

  const toggleAutoConfig = async (id: string, currentIsAuto: boolean) => {
    const newIsAuto = !currentIsAuto;
    try {
      await fetch("/api/export-configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAuto: newIsAuto })
      });

      // Update local state list
      setSavedConfigs((p) => p.map((c) => c.id === id ? { ...c, isAuto: newIsAuto } : c));

      // If the toggled config is the currently active one, update the form state too
      if (activeConfigId === id) {
        setCfg((p) => ({ ...p, isAuto: newIsAuto }));
      }

      toast.success(newIsAuto ? "เปิดใช้งานส่งออกอัตโนมัติแล้ว" : "ปิดใช้งานส่งออกอัตโนมัติแล้ว");
    } catch (error) {
      toast.error(
        isThai
          ? "เกิดข้อผิดพลาดในการอัปเดตสถานะ"
          : "An error occurred while updating status",
      );
    }
  };

  const handleExport = async () => {
    if (!cfg.adAccountIds.length) {
      toast.error(isThai ? "กรุณาเลือกบัญชีโฆษณา" : "Please select at least one ad account");
      return;
    }
    if (!cfg.googleSheetId) {
      toast.error(isThai ? "กรุณาเลือก Google Sheet" : "Please select a Google Sheet file");
      return;
    }
    if (!cfg.sheetTab) {
      toast.error(isThai ? "กรุณาเลือก Sheet Tab" : "Please select a Sheet tab");
      return;
    }
    if (!cfg.columnMapping.some((m) => m.fbCol && m.sheetCol)) {
      toast.error(
        isThai ? "กรุณากำหนด Column Mapping" : "Please configure at least one column mapping",
      );
      return;
    }
    if (!selectedDate) {
      toast.error(isThai ? "กรุณาเลือกวันที่ข้อมูล" : "Please choose a data date");
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/export/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adAccountIds: cfg.adAccountIds,
          googleSheetId: cfg.googleSheetId,
          sheetTab: cfg.sheetTab,
          columnMapping: cfg.columnMapping.filter((m) => m.fbCol && m.sheetCol),
          writeMode: cfg.writeMode,
          dataDate: selectedDate.toISOString(),
          configId: activeConfigId ?? undefined,
          configName: cfg.name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      toast.success(
        isThai
          ? `ส่งออกสำเร็จ! ${data.rowCount.toLocaleString()} แถว`
          : `Export successful! ${data.rowCount.toLocaleString()} rows`,
      );
    } catch (e: unknown) {
      toast.error(
        e instanceof Error
          ? e.message
          : isThai
            ? "เกิดข้อผิดพลาด"
            : "An error occurred",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const selectedSheet = sheets.find((s) => s.id === cfg.googleSheetId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isThai ? "ส่งออกข้อมูล" : "Export data"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {isThai
            ? "ส่งข้อมูลโฆษณา Facebook ไปยัง Google Sheets"
            : "Export your Facebook Ads data to Google Sheets."}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">

          {/* 1. Ad Accounts */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {isThai ? "1. เลือกบัญชีโฆษณา" : "1. Select ad accounts"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelectDropdown
                options={adAccounts}
                selected={cfg.adAccountIds}
                onChange={(ids) => updateCfg("adAccountIds", ids)}
                placeholder={isThai ? "เลือกบัญชีโฆษณา..." : "Choose ad accounts..."}
                loading={accountsLoading}
                error={accountsError}
              />
              {cfg.adAccountIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cfg.adAccountIds.map((id) => {
                    const acc = adAccounts.find((a) => a.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 pr-1">
                        {acc?.name ?? id}
                        <button onClick={() => updateCfg("adAccountIds", cfg.adAccountIds.filter((i) => i !== id))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Google Sheet */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {isThai ? "2. เลือก Google Sheet" : "2. Select Google Sheet"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isThai ? "ไฟล์ Google Sheet" : "Google Sheet file"}</Label>
                  <SheetDropdown
                    sheets={sheets}
                    value={cfg.googleSheetId}
                    onChange={(id, name) =>
                      setCfg((p) => ({ ...p, googleSheetId: id, googleSheetName: name, sheetTab: "" }))
                    }
                    placeholder={
                      isThai ? "เลือกไฟล์ Google Sheet" : "Choose a Google Sheet file"
                    }
                    loading={sheetsLoading}
                    error={sheetsError || undefined}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{isThai ? "ชีต (Tab)" : "Sheet tab"}</Label>
                  <TabDropdown
                    tabs={tabs}
                    value={cfg.sheetTab}
                    onChange={(val) => updateCfg("sheetTab", val)}
                    placeholder={
                      !cfg.googleSheetId
                        ? isThai
                          ? "เลือกไฟล์ก่อน"
                          : "Choose a file first"
                        : isThai
                          ? "เลือกชีต..."
                          : "Choose a sheet..."
                    }
                    disabled={!cfg.googleSheetId}
                    loading={tabsLoading}
                  />
                </div>
              </div>
              {selectedSheet && (
                <p className="text-xs text-gray-400">
                  {isThai ? "ไฟล์ที่เลือก:" : "Selected file:"}{" "}
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {selectedSheet.name}
                  </span>
                  {selectedSheet.modifiedTime &&
                    ` · ${
                      isThai ? "แก้ไขล่าสุด" : "Last modified"
                    } ${format(new Date(selectedSheet.modifiedTime), "d MMM yyyy", {
                      locale,
                    })}`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 3. Column Mapping */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {isThai ? "3. แมพคอลัมน์" : "3. Column mapping"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isThai
                      ? "กำหนดข้อมูล Facebook → คอลัมน์ Sheet"
                      : "Map Facebook fields → Sheet columns"}
                  </CardDescription>
                </div>
                <Button onClick={addMapping} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> {isThai ? "เพิ่ม" : "Add"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {cfg.columnMapping.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <select
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={m.fbCol}
                        onChange={(e) => updateMapping(idx, "fbCol", e.target.value)}
                      >
                        <option value="">
                          {isThai ? "คอลัมน์ Facebook..." : "Facebook column..."}
                        </option>
                        <option value={SKIP_FB_COL}>
                          {isThai ? "skip (ว่าง)" : "skip (empty)"}
                        </option>
                        {FB_COLUMNS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={m.sheetCol}
                        onChange={(e) => updateMapping(idx, "sheetCol", e.target.value)}
                      >
                        <option value="">
                          {isThai ? "คอลัมน์ Sheet..." : "Sheet column..."}
                        </option>
                        {SHEET_COLS.map((c) => (
                          <option key={c} value={c}>
                            {isThai ? `คอลัมน์ ${c}` : `Column ${c}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => removeMapping(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={cfg.columnMapping.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {cfg.columnMapping.some((m) => m.fbCol && m.sheetCol) && (
                <div className="mt-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <p className="text-xs text-primary dark:text-primary font-medium">
                    {isThai ? "ตัวอย่าง:" : "Example:"}
                  </p>
                  <p className="text-xs text-primary dark:text-primary mt-1">
                    {cfg.columnMapping.filter((m) => m.fbCol && m.sheetCol).slice(0, 4).map((m) => `${m.fbCol}→${m.sheetCol}`).join(", ")}
                    {cfg.columnMapping.filter((m) => m.fbCol && m.sheetCol).length > 4 && " ..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Save & Saved configs */}
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {isThai ? "บันทึกการตั้งค่า" : "Saved configurations"}
              </CardTitle>
              <button
                onClick={() => setIsLogsOpen(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                title={isThai ? "ดูประวัติการส่งออก" : "View export history"}
              >
                <FileClock className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              </button>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* 1. Saved configs (Moved to top) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isThai ? "การตั้งค่าที่บันทึกไว้" : "Saved configurations"}
                  </Label>
                  {savedConfigs.length > 0 && (
                    <span className="text-[10px] text-gray-400">({savedConfigs.length})</span>
                  )}
                </div>
                {savedConfigs.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">ยังไม่มีการตั้งค่าที่บันทึก</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {savedConfigs.map((c) => (
                      <div key={c.id}
                        className={cn("w-full py-2 px-3 rounded-lg border cursor-pointer transition-all relative group shadow-sm flex items-center justify-between gap-3",
                          activeConfigId === c.id
                            ? "border-primary bg-primary/10 dark:bg-primary/20 dark:border-primary ring-1 ring-primary/10"
                            : "border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 bg-white dark:bg-gray-900"
                        )}
                        onClick={() => loadConfig(c)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate flex-1 leading-tight">{c.name}</p>
                            {c.autoSchedule && c.isAuto && (
                              <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 rounded-sm">
                                {c.autoSchedule}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-[10px] text-gray-500 truncate leading-normal">
                              {c.adAccountIds?.length ?? 0}{" "}
                              {isThai ? "บัญชี" : "accounts"} · {c.googleSheetName || "—"}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1 rounded-sm",
                                c.autoSchedule ? "bg-primary/20 text-primary dark:bg-primary/40 dark:text-primary" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {c.autoSchedule
                                  ? isThai ? "อัตโนมัติ" : "Automatic"
                                  : isThai ? "แมนนวล" : "Manual"}
                              </span>
                              {c.autoSchedule && (
                                <div className="flex items-center gap-1">
                                  <div className={cn("h-1.5 w-1.5 rounded-full", c.isAuto ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-gray-300")} />
                                  <span className={cn("text-[10px]", c.isAuto ? "text-green-600 font-medium" : "text-gray-400")}>
                                    {c.isAuto
                                      ? isThai ? "เปิดใช้งาน" : "Enabled"
                                      : isThai ? "ปิดการทำงาน" : "Disabled"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between min-h-[42px] shrink-0 border-l border-gray-100 dark:border-gray-800 pl-3 ml-1">
                          <div className="h-4 flex items-center justify-end w-full">
                            {c.autoSchedule ? (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                title={
                                  c.isAuto
                                    ? isThai
                                      ? "ปิดส่งออกอัตโนมัติ"
                                      : "Disable automatic export"
                                    : isThai
                                      ? "เปิดส่งออกอัตโนมัติ"
                                      : "Enable automatic export"
                                }
                              >
                                <Switch
                                  className="scale-[0.6] origin-right data-[state=checked]:bg-green-500"
                                  checked={c.isAuto}
                                  onCheckedChange={() => toggleAutoConfig(c.id!, c.isAuto)}
                                />
                              </div>
                            ) : (
                              <div className="w-8" /> /* Manual configs don't get a switch */
                            )}
                          </div>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setConfigToDelete({ id: c.id!, name: c.name });
                            setIsDeleteConfirmOpen(true);
                          }}
                            className="text-gray-400 hover:text-red-500 transition-all p-1 -mr-1"
                            title={isThai ? "ลบ" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Save Configuration (Moved to bottom) */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>
                      {isThai
                        ? "ชื่อการตั้งค่าใหม่ / อัปเดต"
                        : "New / updated configuration name"}
                    </Label>
                    <Input
                      placeholder={
                        isThai ? "เช่น รายงานประจำเดือน..." : "e.g. Monthly report..."
                      }
                      value={cfg.name}
                      onChange={(e) => updateCfg("name", e.target.value)}
                    />
                  </div>
                  <Button onClick={saveConfig} variant="outline" className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    {activeConfigId
                      ? isThai
                        ? "อัปเดตการตั้งค่าปัจจุบัน"
                        : "Update current configuration"
                      : isThai
                        ? "บันทึกสร้างใหม่"
                        : "Save as new"}
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 4. Write Mode + Schedule */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {isThai ? "4. การเขียนข้อมูล & ตั้งเวลา" : "4. Write mode & schedule"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{isThai ? "วิธีการเขียน" : "Write mode"}</Label>
                <div className="space-y-1">
                  {([
                    {
                      id: "append",
                      label: isThai ? "เขียนต่อแถว" : "Append rows",
                    },
                    {
                      id: "overwrite",
                      label: isThai ? "เขียนทับทั้งหมด" : "Overwrite all",
                    },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateCfg("writeMode", opt.id)}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 rounded-lg transition-colors text-left",
                        cfg.writeMode === opt.id
                          ? "bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0",
                          cfg.writeMode === opt.id ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                        )}
                      >
                        {cfg.writeMode === opt.id && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="ml-2.5 text-sm">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>{isThai ? "รูปแบบการทำงาน" : "Execution mode"}</Label>
                <div className="space-y-1">
                  {([
                    {
                      id: false,
                      label: isThai ? "ส่งออกแบบแมนวล" : "Manual export",
                    },
                    {
                      id: true,
                      label: isThai ? "ส่งออกอัตโนมัติ" : "Automatic export",
                    },
                  ] as const).map((opt) => (
                    <button
                      key={String(opt.id)}
                      onClick={() => updateCfg("isAuto", opt.id)}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 rounded-lg transition-colors text-left",
                        cfg.isAuto === opt.id
                          ? "bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <div
                          className={cn(
                            "flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0",
                            cfg.isAuto === opt.id ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                          )}
                        >
                          {cfg.isAuto === opt.id && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="ml-2.5 text-sm">
                          {opt.label}
                        </span>
                      </div>
                      {opt.id && cfg.isAuto === opt.id && (
                        <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin-slow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {cfg.isAuto && (
                <div className="space-y-3 pt-2 border-t dark:border-gray-800">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      {isThai ? "เวลาส่งออก (24 ชม.)" : "Export time (24h)"}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center gap-1">
                        <select
                          value={cfg.autoSchedule.split(":")[0]}
                          onChange={(e) => {
                            const [_, m] = cfg.autoSchedule.split(":");
                            updateCfg("autoSchedule", `${e.target.value}:${m}`);
                          }}
                          className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {Array.from({ length: 24 }).map((_, i) => {
                            const h = String(i).padStart(2, "0");
                            return <option key={h} value={h}>{h}</option>;
                          })}
                        </select>
                        <span className="text-gray-400">:</span>
                        <select
                          value={cfg.autoSchedule.split(":")[1]}
                          onChange={(e) => {
                            const [h, _] = cfg.autoSchedule.split(":");
                            updateCfg("autoSchedule", `${h}:${e.target.value}`);
                          }}
                          className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {Array.from({ length: 60 }).map((_, i) => {
                            const m = String(i).padStart(2, "0");
                            return <option key={m} value={m}>{m}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      {isThai ? "ความถี่ในการส่งออก" : "Export frequency"}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={cfg.autoDays.length === 7 ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => updateCfg("autoDays", [0, 1, 2, 3, 4, 5, 6])}
                        className={cn("text-xs h-8 px-3", cfg.autoDays.length === 7 && "bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/40 dark:text-primary")}
                      >
                        {isThai ? "ทุกวัน" : "Every day"}
                      </Button>
                      <Button
                        type="button"
                        variant={cfg.autoDays.length < 7 ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          if (cfg.autoDays.length === 7) updateCfg("autoDays", [1, 2, 3, 4, 5]);
                        }}
                        className={cn("text-xs h-8 px-3", cfg.autoDays.length < 7 && "bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/40 dark:text-primary")}
                      >
                        {isThai ? "เลือกวัน" : "Pick days"}
                      </Button>
                    </div>

                    {cfg.autoDays.length < 7 && (
                      <div className="flex gap-1 mt-1">
                        {DAYS.map((day) => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              const newDays = cfg.autoDays.includes(day.id)
                                ? cfg.autoDays.filter((d) => d !== day.id)
                                : [...cfg.autoDays, day.id].sort();
                              if (newDays.length > 0) updateCfg("autoDays", newDays);
                            }}
                            className={cn(
                              "h-7 w-7 rounded-md text-[10px] flex items-center justify-center border transition-colors",
                              cfg.autoDays.includes(day.id)
                                ? "bg-primary border-primary text-white font-bold"
                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                            )}
                          >
                            {isThai ? day.labelTh : day.labelEn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Date */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {isThai ? "5. เลือกวันที่ข้อมูล" : "5. Choose data date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cfg.isAuto ? (
                <div className="space-y-1.5 px-1">
                  <select
                    value={cfg.dateRange}
                    onChange={(e) => updateCfg("dateRange", e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="today">
                      {isThai ? "วันนี้ (Today)" : "Today"}
                    </option>
                    <option value="yesterday">
                      {isThai ? "เมื่อวาน (Yesterday)" : "Yesterday"}
                    </option>
                    <option value="last_7_days">
                      {isThai ? "7 วันที่ผ่านมา (Last 7 Days)" : "Last 7 days"}
                    </option>
                  </select>
                </div>
              ) : (
                <div ref={calRef} className="relative inline-block">
                  <button
                    onClick={() => setShowCal(!showCal)}
                    className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm text-gray-900 transition-colors hover:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {selectedDate
                      ? format(selectedDate, "d MMMM yyyy", { locale })
                      : isThai
                        ? "เลือกวันที่..."
                        : "Select a date..."}
                    {selectedDate && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(null);
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                  {showCal && (
                    <div className="absolute z-50 mt-1">
                      <MiniCalendar
                        value={selectedDate}
                        locale={locale}
                        isThai={isThai}
                        onChange={(d) => {
                          setSelectedDate(d);
                          setShowCal(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export button */}
          <Card className="border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {isThai ? "ส่งออกข้อมูล" : "Export data"}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>
                  {isThai ? "บัญชี" : "Accounts"}: {cfg.adAccountIds.length}{" "}
                  {isThai ? "รายการ" : "selected"}
                </p>
                <p>
                  {isThai ? "วันที่" : "Date"}:{" "}
                  {selectedDate ? format(selectedDate, "d MMM yyyy", { locale }) : "—"}
                </p>
                <p>
                  {isThai ? "ชีต" : "Sheet"}: {cfg.sheetTab || "—"}
                </p>
                <p>
                  {isThai ? "การเขียน" : "Write mode"}:{" "}
                  {cfg.writeMode === "append"
                    ? isThai
                      ? "เขียนต่อ"
                      : "Append"
                    : isThai
                      ? "เขียนทับ"
                      : "Overwrite"}
                </p>
              </div>
              <Button onClick={handleExport} className="w-full gap-2" disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {isThai ? "กำลังส่งออก..." : "Exporting..."}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />{" "}
                    {isThai ? "ส่งออกทันที" : "Export now"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>


          <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="px-6 py-4 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold">
                    {isThai ? "ประวัติการส่งออก (Logs)" : "Export history (Logs)"}
                  </DialogTitle>
                  <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2 h-8 mr-6">
                    <RefreshCw className={cn("w-3.5 h-3.5", logsLoading && "animate-spin")} />{" "}
                    {isThai ? "รีเฟรช" : "Refresh"}
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50 dark:bg-gray-900/50">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 shrink-0">
                  {[
                    {
                      label: isThai ? "ทั้งหมด" : "TOTAL",
                      value: logTotals.total,
                      icon: FileSpreadsheet,
                      color: "text-primary bg-primary/10 dark:bg-primary/20",
                    },
                    {
                      label: isThai ? "สำเร็จ" : "SUCCESS",
                      value: logTotals.success,
                      icon: CheckCircle2,
                      color: "text-green-600 bg-green-50 dark:bg-green-900/20",
                    },
                    {
                      label: isThai ? "ล้มเหลว" : "FAILED",
                      value: logTotals.error,
                      icon: XCircle,
                      color: "text-red-600 bg-red-50 dark:bg-red-900/20",
                    },
                    {
                      label: isThai ? "แถวทั้งหมด" : "ROWS",
                      value: logTotals.rows.toLocaleString(),
                      icon: RefreshCw,
                      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
                    },
                  ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                          <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{s.value}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="px-4 pb-3 flex flex-col sm:flex-row gap-3 shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={
                        isThai ? "ค้นหาชื่อการตั้งค่า..." : "Search by configuration name..."
                      }
                      className="pl-9 h-9 text-sm"
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-[11px] bg-white dark:bg-gray-800">
                      {(["all", "manual", "auto"] as const).map((t) => (
                        <button key={t} onClick={() => setLogsFilterType(t)}
                          className={cn("px-3 py-1.5 font-medium transition-colors border-r last:border-r-0 dark:border-gray-700",
                            logsFilterType === t ? "bg-primary text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}>
                          {t === "all"
                            ? isThai ? "ทั้งหมด" : "All"
                            : t === "manual"
                              ? isThai ? "แมนวล" : "Manual"
                              : isThai ? "อัตโนมัติ" : "Automatic"}
                        </button>
                      ))}
                    </div>
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-[11px] bg-white dark:bg-gray-800">
                      {(["all", "success", "error"] as const).map((s) => (
                        <button key={s} onClick={() => setLogsFilterStatus(s)}
                          className={cn("px-3 py-1.5 font-medium transition-colors border-r last:border-r-0 dark:border-gray-700",
                            logsFilterStatus === s ? "bg-primary text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}>
                          {s === "all"
                            ? isThai ? "ทั้งหมด" : "All"
                            : s === "success"
                              ? isThai ? "สำเร็จ" : "Succeeded"
                              : isThai ? "ล้มเหลว" : "Failed"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto bg-white dark:bg-gray-950 border-t dark:border-gray-800">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 shadow-sm">
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        {(isThai
                          ? ["วันเวลา", "ประเภท", "ชื่อการตั้งค่า / ชีต", "บัญชี", "แถว", "วันที่ข้อมูล", "สถานะ"]
                          : ["DATE / TIME", "TYPE", "CONFIG / SHEET", "ACCOUNTS", "ROWS", "DATA DATE", "STATUS"]
                        ).map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {logsLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-20 text-center">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : !logsData?.logs?.length ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-20 text-center text-gray-500 dark:text-gray-400"
                          >
                            <Filter className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">
                              {isThai ? "ไม่พบประวัติการส่งออก" : "No export history yet"}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        logsData.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {format(new Date(log.createdAt), "d MMM yyyy", { locale })}
                              </p>
                                  <p className="text-xs text-gray-400">{format(new Date(log.createdAt), "HH:mm")}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={log.exportType === "auto" ? "default" : "secondary"}
                                className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-tighter"
                              >
                                {log.exportType === "auto"
                                  ? isThai ? "AUTO" : "AUTO"
                                  : isThai ? "MANUAL" : "MANUAL"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">{log.configName ?? "—"}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{log.sheetFileName ?? "—"} · {log.sheetTabName ?? "—"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium">{log.adAccountCount}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-sm font-bold", !log.rowCount ? "text-gray-400" : "text-blue-600 dark:text-blue-400")}>
                                {log.rowCount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {log.dataDate ? (
                                <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {format(new Date(log.dataDate), "d MMM yyyy", { locale })}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {log.status === "success" ? (
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  {isThai ? "SUCCESS" : "SUCCESS"}
                                </div>
                              ) : (
                                <div
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  title={log.error ?? ""}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> {isThai ? "ERROR" : "ERROR"}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logsTotalPages > 1 && (
                  <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 flex items-center justify-between shrink-0">
                    <p className="text-xs text-gray-500">
                      {isThai ? "หน้า" : "Page"} {logsPage} {isThai ? "จาก" : "of"}{" "}
                      {logsTotalPages} ({logsData?.total}{" "}
                      {isThai ? "รายการ" : "entries"})
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1} className="h-8 w-8 p-0">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))} disabled={logsPage === logsTotalPages} className="h-8 w-8 p-0">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden rounded-xl border-none shadow-2xl">
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 text-left">
                {isThai ? "ลบการตั้งค่า?" : "Delete configuration?"}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left leading-snug">
                {isThai ? "คุณแน่ใจหรือไม่ที่จะลบ" : "Are you sure you want to delete"}{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  "{configToDelete?.name}"
                </span>
                ?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 pt-0">
            <Button
              variant="ghost"
              size="sm"
              className="px-4 h-9 rounded-lg text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              {isThai ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="px-4 h-9 rounded-lg bg-red-600 hover:bg-red-700 font-bold"
              onClick={deleteConfig}
            >
              {isThai ? "ตกลง" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
