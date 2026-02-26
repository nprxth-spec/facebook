"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Search, ChevronDown, Check, X, Calendar, Save, Play, Plus, Trash2,
  FileSpreadsheet, Clock, RefreshCw, ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { th } from "date-fns/locale";

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
  { id: 0, label: "อา" },
  { id: 1, label: "จ" },
  { id: 2, label: "อ" },
  { id: 3, label: "พ" },
  { id: 4, label: "พฤ" },
  { id: 5, label: "ศ" },
  { id: 6, label: "ส" },
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
          "flex items-center justify-between w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
          error ? "border-red-400" : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
        )}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />กำลังโหลด...</span>
        ) : error ? (
          <span className="flex items-center gap-2 text-red-500"><AlertCircle className="w-3.5 h-3.5" />{error}</span>
        ) : (
          <span className={cn("truncate", !selected.length && "text-gray-400")}>
            {!selected.length ? placeholder : selected.length === 1
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
              <input type="text" placeholder="ค้นหาบัญชี..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="flex gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 text-xs">
            <button onClick={() => onChange(filtered.map((o) => o.id))} className="text-blue-600 dark:text-blue-400 hover:underline">เลือกทั้งหมด</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => onChange([])} className="text-gray-500 hover:underline">ล้าง</button>
            {!!selected.length && <span className="ml-auto text-gray-500">{selected.length} เลือก</span>}
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">ไม่พบบัญชี</div>
            ) : filtered.map((opt) => (
              <div key={opt.id} onClick={() => toggle(opt.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  selected.includes(opt.id) ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-500"
                )}>
                  {selected.includes(opt.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{opt.name}</p>
                  <p className="text-xs text-gray-400">{opt.id}{opt.currency ? ` · ${opt.currency}` : ""}</p>
                </div>
                {!opt.isActive && <Badge variant="secondary" className="text-xs ml-auto">ปิดใช้งาน</Badge>}
              </div>
            ))}
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
          "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
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
                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
                    s.id === value && "bg-blue-50 text-blue-700 dark:bg-blue-900/40"
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
          "flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60",
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
                  "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
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
function MiniCalendar({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const [cur, setCur] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(cur), end: endOfMonth(cur) });
  const firstDay = startOfMonth(cur).getDay();

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-72">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCur(subMonths(cur, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {format(cur, "MMMM yyyy", { locale: th })}
        </span>
        <button onClick={() => setCur(addMonths(cur, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day) => {
          const sel = value ? isSameDay(day, value) : false;
          const today = isSameDay(day, new Date());
          return (
            <button key={day.toISOString()} onClick={() => onChange(day)}
              className={cn("w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-colors",
                sel ? "bg-blue-600 text-white"
                  : today ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >{format(day, "d")}</button>
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

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

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
    if (!cfg.name.trim()) { toast.error("กรุณาใส่ชื่อการตั้งค่า"); return; }
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
    toast.success("บันทึกการตั้งค่าสำเร็จ");
  };

  const loadConfig = (c: ExportConfig) => {
    setCfg(c);
    setActiveConfigId(c.id ?? null);
    toast.info(`โหลดการตั้งค่า "${c.name}" แล้ว`);
  };

  const deleteConfig = async (id: string) => {
    await fetch("/api/export-configs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setSavedConfigs((p) => p.filter((c) => c.id !== id));
    if (activeConfigId === id) setActiveConfigId(null);
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
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const handleExport = async () => {
    if (!cfg.adAccountIds.length) { toast.error("กรุณาเลือกบัญชีโฆษณา"); return; }
    if (!cfg.googleSheetId) { toast.error("กรุณาเลือก Google Sheet"); return; }
    if (!cfg.sheetTab) { toast.error("กรุณาเลือก Sheet Tab"); return; }
    if (!cfg.columnMapping.some((m) => m.fbCol && m.sheetCol)) { toast.error("กรุณากำหนด Column Mapping"); return; }
    if (!selectedDate) { toast.error("กรุณาเลือกวันที่ข้อมูล"); return; }

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
      toast.success(`ส่งออกสำเร็จ! ${data.rowCount.toLocaleString()} แถว`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedSheet = sheets.find((s) => s.id === cfg.googleSheetId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ส่งออกข้อมูล</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">ส่งข้อมูลโฆษณา Facebook ไปยัง Google Sheets</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">

          {/* 1. Ad Accounts */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">1. เลือกบัญชีโฆษณา</CardTitle>
            </CardHeader>
            <CardContent>
              <MultiSelectDropdown
                options={adAccounts}
                selected={cfg.adAccountIds}
                onChange={(ids) => updateCfg("adAccountIds", ids)}
                placeholder="เลือกบัญชีโฆษณา..."
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
              <CardTitle className="text-base">2. เลือก Google Sheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>ไฟล์ Google Sheet</Label>
                  <SheetDropdown
                    sheets={sheets}
                    value={cfg.googleSheetId}
                    onChange={(id, name) =>
                      setCfg((p) => ({ ...p, googleSheetId: id, googleSheetName: name, sheetTab: "" }))
                    }
                    placeholder="เลือกไฟล์ google sheet"
                    loading={sheetsLoading}
                    error={sheetsError || undefined}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>ชีต (Tab)</Label>
                  <TabDropdown
                    tabs={tabs}
                    value={cfg.sheetTab}
                    onChange={(val) => updateCfg("sheetTab", val)}
                    placeholder={!cfg.googleSheetId ? "เลือกไฟล์ก่อน" : "เลือกชีต..."}
                    disabled={!cfg.googleSheetId}
                    loading={tabsLoading}
                  />
                </div>
              </div>
              {selectedSheet && (
                <p className="text-xs text-gray-400">
                  ไฟล์ที่เลือก: <span className="font-medium text-gray-600 dark:text-gray-300">{selectedSheet.name}</span>
                  {selectedSheet.modifiedTime && ` · แก้ไขล่าสุด ${format(new Date(selectedSheet.modifiedTime), "d MMM yyyy", { locale: th })}`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 3. Column Mapping */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">3. แมพคอลัมน์</CardTitle>
                  <CardDescription className="mt-1">กำหนดข้อมูล Facebook → คอลัมน์ Sheet</CardDescription>
                </div>
                <Button onClick={addMapping} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> เพิ่ม
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {cfg.columnMapping.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <select
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={m.fbCol}
                        onChange={(e) => updateMapping(idx, "fbCol", e.target.value)}
                      >
                        <option value="">คอลัมน์ Facebook...</option>
                        <option value={SKIP_FB_COL}>skip (ว่าง)</option>
                        {FB_COLUMNS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={m.sheetCol} onChange={(e) => updateMapping(idx, "sheetCol", e.target.value)}
                      >
                        <option value="">คอลัมน์ Sheet...</option>
                        {SHEET_COLS.map((c) => <option key={c} value={c}>คอลัมน์ {c}</option>)}
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
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">ตัวอย่าง:</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
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
            <CardHeader className="pb-4">
              <CardTitle className="text-base">บันทึกการตั้งค่า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>ชื่อการตั้งค่า</Label>
                  <Input placeholder="เช่น รายงานประจำเดือน..." value={cfg.name} onChange={(e) => updateCfg("name", e.target.value)} />
                </div>
                <Button onClick={saveConfig} variant="outline" className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  {activeConfigId ? "อัปเดตการตั้งค่า" : "บันทึกการตั้งค่า"}
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">การตั้งค่าที่บันทึกไว้</Label>
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
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 ring-1 ring-blue-500/10"
                            : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-900 bg-white dark:bg-gray-900"
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
                              {c.adAccountIds?.length ?? 0} บัญชี · {c.googleSheetName || "—"}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1 rounded-sm",
                                c.autoSchedule ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {c.autoSchedule ? "อัตโนมัติ" : "แมนนวล"}
                              </span>
                              {c.autoSchedule && (
                                <div className="flex items-center gap-1">
                                  <div className={cn("h-1.5 w-1.5 rounded-full", c.isAuto ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-gray-300")} />
                                  <span className={cn("text-[10px]", c.isAuto ? "text-green-600 font-medium" : "text-gray-400")}>
                                    {c.isAuto ? "เปิดใช้งาน" : "ปิดการทำงาน"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between min-h-[42px] shrink-0 border-l border-gray-100 dark:border-gray-800 pl-3 ml-1">
                          <div className="h-4 flex items-center justify-end w-full">
                            {c.autoSchedule ? (
                              <div onClick={(e) => e.stopPropagation()} title={c.isAuto ? "ปิดส่งออกอัตโนมัติ" : "เปิดส่งออกอัตโนมัติ"}>
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
                          <button onClick={(e) => { e.stopPropagation(); deleteConfig(c.id!); }}
                            className="text-gray-400 hover:text-red-500 transition-all p-1 -mr-1" title="ลบ">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. Write Mode + Schedule */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">4. การเขียนข้อมูล & ตั้งเวลา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>วิธีการเขียน</Label>
                <div className="space-y-1">
                  {([
                    { id: "append", label: "เขียนต่อแถว" },
                    { id: "overwrite", label: "เขียนทับทั้งหมด" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateCfg("writeMode", opt.id)}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 rounded-lg transition-colors text-left",
                        cfg.writeMode === opt.id
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0",
                          cfg.writeMode === opt.id ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
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
                <Label>รูปแบบการทำงาน</Label>
                <div className="space-y-1">
                  {([
                    { id: false, label: "ส่งออกแบบแมนวล" },
                    { id: true, label: "ส่งออกอัตโนมัติ" },
                  ] as const).map((opt) => (
                    <button
                      key={String(opt.id)}
                      onClick={() => updateCfg("isAuto", opt.id)}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 rounded-lg transition-colors text-left",
                        cfg.isAuto === opt.id
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <div
                          className={cn(
                            "flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0",
                            cfg.isAuto === opt.id ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
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
                        <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin-slow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {cfg.isAuto && (
                <div className="space-y-3 pt-2 border-t dark:border-gray-800">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">เวลาส่งออก (24 ชม.)</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center gap-1">
                        <select
                          value={cfg.autoSchedule.split(":")[0]}
                          onChange={(e) => {
                            const [_, m] = cfg.autoSchedule.split(":");
                            updateCfg("autoSchedule", `${e.target.value}:${m}`);
                          }}
                          className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <Label className="text-xs text-gray-500">ความถี่ในการส่งออก</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={cfg.autoDays.length === 7 ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => updateCfg("autoDays", [0, 1, 2, 3, 4, 5, 6])}
                        className={cn("text-xs h-8 px-3", cfg.autoDays.length === 7 && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300")}
                      >
                        ทุกวัน
                      </Button>
                      <Button
                        type="button"
                        variant={cfg.autoDays.length < 7 ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          if (cfg.autoDays.length === 7) updateCfg("autoDays", [1, 2, 3, 4, 5]);
                        }}
                        className={cn("text-xs h-8 px-3", cfg.autoDays.length < 7 && "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300")}
                      >
                        เลือกวัน
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
                                ? "bg-blue-500 border-blue-600 text-white font-bold"
                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                            )}
                          >
                            {day.label}
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
              <CardTitle className="text-base">5. เลือกวันที่ข้อมูล</CardTitle>
            </CardHeader>
            <CardContent>
              {cfg.isAuto ? (
                <div className="space-y-1.5 px-1">
                  <select
                    value={cfg.dateRange}
                    onChange={(e) => updateCfg("dateRange", e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">วันนี้ (Today)</option>
                    <option value="yesterday">เมื่อวาน (Yesterday)</option>
                    <option value="last_7_days">7 วันที่ผ่านมา (Last 7 Days)</option>
                  </select>
                </div>
              ) : (
                <div ref={calRef} className="relative inline-block">
                  <button
                    onClick={() => setShowCal(!showCal)}
                    className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm text-gray-900 transition-colors hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {selectedDate
                      ? format(selectedDate, "d MMMM yyyy", { locale: th })
                      : "เลือกวันที่..."}
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
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">ส่งออกข้อมูล</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>บัญชี: {cfg.adAccountIds.length} รายการ</p>
                <p>วันที่: {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: th }) : "—"}</p>
                <p>ชีต: {cfg.sheetTab || "—"}</p>
                <p>การเขียน: {cfg.writeMode === "append" ? "เขียนต่อ" : "เขียนทับ"}</p>
              </div>
              <Button onClick={handleExport} className="w-full gap-2" disabled={isExporting}>
                {isExporting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังส่งออก...</>
                  : <><Play className="w-4 h-4" /> ส่งออกทันที</>
                }
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>
    </div >
  );
}
