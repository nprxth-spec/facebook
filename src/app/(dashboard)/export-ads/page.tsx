"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search, ChevronDown, Check, X, Loader2, AlertCircle,
    FileSpreadsheet, Upload, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";

// ────────────────── Types ──────────────────
interface AdAccount { id: string; accountId: string; name: string; isActive: boolean; currency?: string }
interface SheetFile { id: string; name: string; modifiedTime?: string }
interface SheetTab { sheetId: number; title: string; index: number }
interface ColMap { fbCol: string; sheetCol: string }

const SKIP = "__skip__";

// ────────────────── Column config ──────────────────
const AD_COLUMNS = [
    { key: "ad_id", label: "Ad ID" },
    { key: "page_id", label: "Page ID" },
    { key: "account_name", label: "Account Name" },
    { key: "ad_name", label: "Ad Name" },
    { key: "campaign_name", label: "Campaign Name" },
    { key: "sex", label: "เพศ (Sex)" },
    { key: "age", label: "อายุ (Age)" },
    { key: "interests", label: "ความสนใจ (Interests)" },
    { key: "excluded_interests", label: "ไม่รวมผู้สนใจ (Excluded)" },
    { key: "budget", label: "Budget" },
    { key: "created_time", label: "วันที่สร้าง (Created)" },
    { key: "captions", label: "Captions" },
    { key: "status", label: "Status" },
];

const SHEET_COLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const DEFAULT_MAPPING: ColMap[] = [
    { fbCol: "ad_id", sheetCol: "A" },  // A
    { fbCol: "page_id", sheetCol: "B" },  // B
    { fbCol: SKIP, sheetCol: "C" },  // C skip
    { fbCol: SKIP, sheetCol: "D" },  // D skip
    { fbCol: SKIP, sheetCol: "E" },  // E skip
    { fbCol: SKIP, sheetCol: "F" },  // F skip
    { fbCol: "account_name", sheetCol: "G" },  // G
    { fbCol: "sex", sheetCol: "H" },  // H
    { fbCol: "age", sheetCol: "I" },  // I
    { fbCol: "interests", sheetCol: "J" },  // J
    { fbCol: "excluded_interests", sheetCol: "K" },  // K
    { fbCol: SKIP, sheetCol: "L" },  // L skip
    { fbCol: SKIP, sheetCol: "M" },  // M skip
    { fbCol: "budget", sheetCol: "N" },  // N
    { fbCol: SKIP, sheetCol: "O" },  // O skip
    { fbCol: SKIP, sheetCol: "P" },  // P skip
    { fbCol: SKIP, sheetCol: "Q" },  // Q skip
    { fbCol: "created_time", sheetCol: "R" },  // R
    { fbCol: SKIP, sheetCol: "S" },  // S skip
    { fbCol: "captions", sheetCol: "T" },  // T
];

// ────────────────── Google Sheets Icon ──────────────────
function GoogleSheetsIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-[13px] h-9 text-green-600", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.5 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.3 3 3 3h18c1.7 0 3-1.3 3-3V9.5L14.5 0zM17 21H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7v-2h10v2zm-3-4.5V2.5L19.5 8H14z" />
        </svg>
    );
}

// ────────────────── MultiSelect Dropdown ──────────────────
function MultiSelectDropdown({ options, selected, onChange, placeholder, loading, error }: {
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
    const filtered = options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search));
    const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => !loading && setOpen(!open)}
                className={cn("flex items-center justify-between w-full h-10 px-3 text-sm border rounded-lg bg-white dark:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
                    error ? "border-red-400" : "border-gray-200 dark:border-gray-700 hover:border-primary")}>
                {loading ? <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังโหลด...</span>
                    : error ? <span className="flex items-center gap-2 text-red-500"><AlertCircle className="w-3.5 h-3.5" />{error}</span>
                        : <span className={cn("truncate", !selected.length && "text-gray-400")}>
                            {!selected.length ? placeholder : selected.length === 1 ? options.find((o) => o.id === selected[0])?.name : `${selected.length} บัญชีที่เลือก`}
                        </span>}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                    {!!selected.length && <span onClick={(e) => { e.stopPropagation(); onChange([]); }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-3.5 h-3.5" /></span>}
                    <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
                </div>
            </button>
            {open && !loading && !error && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input type="text" placeholder="ค้นหาบัญชี..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                                onClick={(e) => e.stopPropagation()} />
                        </div>
                    </div>
                    <div className="flex gap-2 px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 text-xs">
                        <button onClick={() => onChange(filtered.map((o) => o.id))} className="text-primary hover:underline">เลือกทั้งหมด</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => onChange([])} className="text-gray-500 hover:underline">ยกเลิก</button>
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                        {filtered.map((opt) => (
                            <div key={opt.id} onClick={() => toggle(opt.id)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", selected.includes(opt.id) ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-500")}>
                                    {selected.includes(opt.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{opt.name}</p>
                                    <p className="text-xs text-gray-400">{opt.id}{opt.currency ? ` · ${opt.currency}` : ""}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────── Sheet Dropdown ──────────────────
function SheetDropdown({ sheets, value, onChange, placeholder, loading, error }: {
    sheets: SheetFile[]; value: string; onChange: (id: string, name: string) => void;
    placeholder: string; loading?: boolean; error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [remoteSheets, setRemoteSheets] = useState<SheetFile[] | null>(null);
    const [remoteLoading, setRemoteLoading] = useState(false);
    const [remoteError, setRemoteError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    useEffect(() => {
        if (!open) return;
        const q = search.trim();
        if (!q) { setRemoteSheets(null); setRemoteError(null); setRemoteLoading(false); return; }
        setRemoteLoading(true);
        const controller = new AbortController();
        const id = setTimeout(() => {
            fetch(`/api/google/sheets?search=${encodeURIComponent(q)}`, { signal: controller.signal })
                .then((r) => r.json())
                .then((d) => { if (d.error) { setRemoteError(d.error); setRemoteSheets([]); } else { setRemoteError(null); setRemoteSheets(d.files ?? []); } })
                .catch((e) => { if (e.name === "AbortError") return; setRemoteError("ค้นหาไม่ได้"); setRemoteSheets([]); })
                .finally(() => setRemoteLoading(false));
        }, 300);
        return () => { controller.abort(); clearTimeout(id); };
    }, [open, search]);
    const baseList = remoteSheets ?? sheets;
    const current = baseList.find((s) => s.id === value) ?? null;
    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => !loading && setOpen((o) => !o)}
                className={cn("flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer", error && "border-red-400")}>
                {loading ? <span className="flex items-center gap-2 text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังโหลด...</span>
                    : error ? <span className="flex items-center gap-2 text-red-500"><AlertCircle className="w-3.5 h-3.5" />{error}</span>
                        : current ? <span className="flex items-center gap-2 truncate"><GoogleSheetsIcon className="shrink-0" /><span className="truncate">{current.name}</span></span>
                            : <span className="text-gray-400 truncate">{placeholder}</span>}
                <ChevronDown className={cn("ml-2 h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
            </button>
            {open && !loading && !error && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 p-2 dark:border-gray-700">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="ค้นหาไฟล์..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {remoteLoading ? <div className="flex items-center justify-center px-3 py-3 text-xs text-gray-500"><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> กำลังค้นหา...</div>
                            : remoteError ? <div className="px-3 py-3 text-center text-xs text-red-500">{remoteError}</div>
                                : baseList.length === 0 ? <div className="px-3 py-3 text-center text-sm text-gray-500">ไม่พบไฟล์</div>
                                    : baseList.map((s) => (
                                        <button key={s.id} type="button" onClick={() => { onChange(s.id, s.name); setOpen(false); }}
                                            className={cn("flex w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 items-start gap-3 cursor-pointer", s.id === value && "bg-primary/10 text-primary dark:bg-primary/40")}>
                                            <GoogleSheetsIcon className="mt-0.5 shrink-0" />
                                            <p className="truncate text-gray-900 dark:text-gray-100 font-medium">{s.name}</p>
                                        </button>
                                    ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────── Tab Dropdown ──────────────────
function TabDropdown({ tabs, value, onChange, placeholder, disabled, loading }: {
    tabs: SheetTab[]; value: string; onChange: (val: string) => void;
    placeholder: string; disabled?: boolean; loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const current = tabs.find((t) => t.title === value) ?? null;
    return (
        <div ref={ref} className="relative">
            <button type="button" disabled={disabled || loading || !tabs.length} onClick={() => setOpen((o) => !o)}
                className="flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
                {loading ? <span className="flex items-center gap-2 text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> กำลังโหลด...</span>
                    : !tabs.length ? <span className="text-gray-400 truncate">{!disabled ? "ไม่พบชีต" : placeholder}</span>
                        : current ? <span className="truncate">{current.title}</span>
                            : <span className="text-gray-400 truncate">{placeholder}</span>}
                <ChevronDown className={cn("ml-2 h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
            </button>
            {open && !loading && !!tabs.length && !disabled && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="max-h-60 overflow-y-auto py-1">
                        {tabs.map((t) => (
                            <button key={t.sheetId} type="button" onClick={() => { onChange(t.title); setOpen(false); }}
                                className={cn("flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer", t.title === value && "bg-primary/10 text-primary dark:bg-primary/40 dark:text-blue-100")}>
                                <span className="truncate">{t.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────── Main Page ──────────────────
export default function ExportAdsPage() {
    const { language } = useTheme();
    const isThai = language === "th";

    // Accounts
    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [accountsError, setAccountsError] = useState("");
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

    // Sheets
    const [sheets, setSheets] = useState<SheetFile[]>([]);
    const [sheetsLoading, setSheetsLoading] = useState(true);
    const [sheetsError, setSheetsError] = useState("");
    const [sheetId, setSheetId] = useState("");
    const [sheetName, setSheetName] = useState("");

    // Tabs
    const [tabs, setTabs] = useState<SheetTab[]>([]);
    const [tabsLoading, setTabsLoading] = useState(false);
    const [sheetTab, setSheetTab] = useState("");

    // Column Mapping
    const [mapping, setMapping] = useState<ColMap[]>(DEFAULT_MAPPING);

    // Export
    const [isExporting, setIsExporting] = useState(false);

    // ── Load accounts ──
    useEffect(() => {
        fetch("/api/manager-accounts")
            .then((r) => r.json())
            .then((data) => {
                if (!Array.isArray(data)) throw new Error("โหลดบัญชีไม่สำเร็จ");
                const active = data.filter((acc) => acc.isActive);
                if (!active.length) { setAccountsError("ยังไม่มีบัญชีที่เลือกใช้งาน"); return; }
                setAdAccounts(active.map((acc) => ({ id: acc.accountId, accountId: acc.accountId, name: acc.name, isActive: true })));
            })
            .catch((e) => setAccountsError(e.message))
            .finally(() => setAccountsLoading(false));
    }, []);

    // ── Load sheets ──
    useEffect(() => {
        fetch("/api/google/sheets")
            .then((r) => r.json())
            .then((d) => { if (d.error) throw new Error(d.error); setSheets(d.files); })
            .catch((e) => setSheetsError(e.message))
            .finally(() => setSheetsLoading(false));
    }, []);

    // ── Load tabs when sheet changes ──
    useEffect(() => {
        if (!sheetId) { setTabs([]); setSheetTab(""); return; }
        setTabsLoading(true);
        fetch(`/api/google/sheets/${sheetId}/tabs`)
            .then((r) => r.json())
            .then((d) => { if (d.error) throw new Error(d.error); setTabs(d.tabs); })
            .catch(() => setTabs([]))
            .finally(() => setTabsLoading(false));
    }, [sheetId]);

    const updateMapping = useCallback((i: number, key: "fbCol" | "sheetCol", val: string) => {
        setMapping((prev) => prev.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
    }, []);

    const addRow = () => setMapping((prev) => [...prev, { fbCol: "", sheetCol: "" }]);
    const removeRow = (i: number) => setMapping((prev) => prev.filter((_, idx) => idx !== i));

    // ── Export ──
    const handleExport = async () => {
        if (!selectedAccounts.length) { toast.error(isThai ? "กรุณาเลือกบัญชีโฆษณา" : "Select ad accounts"); return; }
        if (!sheetId) { toast.error(isThai ? "กรุณาเลือกไฟล์ Google Sheets" : "Select a Google Sheet"); return; }
        if (!sheetTab) { toast.error(isThai ? "กรุณาเลือกแท็บ" : "Select a sheet tab"); return; }

        setIsExporting(true);
        try {
            const res = await fetch("/api/export-ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adAccountIds: selectedAccounts.map((id) => `act_${id.replace(/^act_/, "")}`),
                    googleSheetId: sheetId,
                    sheetTab,
                    columnMapping: mapping,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error ?? "Export failed");
            toast.success(
                isThai
                    ? `ส่งออกสำเร็จ ${data.rowCount} แถว${data.skipped ? ` (ข้าม ${data.skipped} รายการที่มีอยู่แล้ว)` : ""}`
                    : `Exported ${data.rowCount} rows${data.skipped ? ` (skipped ${data.skipped} existing)` : ""}`
            );
        } catch (err: unknown) {
            toast.error((err instanceof Error ? err.message : undefined) ?? "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {isThai ? "ส่งออกข้อมูลโฆษณา" : "Export Ads Info"}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isThai ? "ส่งออกข้อมูลโฆษณา (targeting, budget, caption) ไปยัง Google Sheets" : "Export ad details (targeting, budget, captions) to Google Sheets"}
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    {isThai
                        ? "ระบบจะตรวจสอบ Ad ID ใน Column A ของชีตที่เลือก หากมีอยู่แล้วจะข้ามโดยอัตโนมัติ เพื่อป้องกันการบันทึกซ้ำ"
                        : "The system checks Column A for existing Ad IDs and skips duplicates automatically to prevent duplicate records."}
                </p>
            </div>

            {/* Step 1: Ad Accounts */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        {isThai ? "เลือกบัญชีโฆษณา" : "Select Ad Accounts"}
                    </h2>
                </div>
                <MultiSelectDropdown
                    options={adAccounts}
                    selected={selectedAccounts}
                    onChange={setSelectedAccounts}
                    placeholder={isThai ? "เลือกบัญชีโฆษณา..." : "Select ad accounts..."}
                    loading={accountsLoading}
                    error={accountsError}
                />
                {!!selectedAccounts.length && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedAccounts.map((id) => (
                            <Badge key={id} variant="secondary" className="text-xs gap-1">
                                {adAccounts.find((a) => a.id === id)?.name ?? id}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedAccounts((p) => p.filter((s) => s !== id))} />
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Step 2: Google Sheet */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        {isThai ? "เลือกไฟล์ Google Sheets" : "Select Google Sheet"}
                    </h2>
                </div>
                <SheetDropdown
                    sheets={sheets}
                    value={sheetId}
                    onChange={(id, name) => { setSheetId(id); setSheetName(name); setSheetTab(""); }}
                    placeholder={isThai ? "ค้นหาและเลือกไฟล์..." : "Search and select file..."}
                    loading={sheetsLoading}
                    error={sheetsError}
                />
                <TabDropdown
                    tabs={tabs}
                    value={sheetTab}
                    onChange={setSheetTab}
                    placeholder={isThai ? "เลือกแท็บชีต..." : "Select sheet tab..."}
                    disabled={!sheetId}
                    loading={tabsLoading}
                />
            </div>

            {/* Step 3: Column Mapping */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                            {isThai ? "ตั้งค่าคอลัมน์" : "Column Mapping"}
                        </h2>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={addRow}>
                        + {isThai ? "เพิ่มแถว" : "Add Row"}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {isThai ? "ข้อมูล Facebook" : "Facebook Field"}
                                </th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">
                                    {isThai ? "คอลัมน์ Sheet" : "Sheet Column"}
                                </th>
                                <th className="w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {mapping.map((m, i) => (
                                <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="py-1.5 px-3">
                                        <select
                                            value={m.fbCol}
                                            onChange={(e) => updateMapping(i, "fbCol", e.target.value)}
                                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value={SKIP}>{isThai ? "ว่างเปล่า (skip)" : "Empty (skip)"}</option>
                                            {AD_COLUMNS.map((c) => (
                                                <option key={c.key} value={c.key}>{c.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-1.5 px-3">
                                        <select
                                            value={m.sheetCol}
                                            onChange={(e) => updateMapping(i, "sheetCol", e.target.value)}
                                            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="">-</option>
                                            {SHEET_COLS.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-1.5 px-2 text-center">
                                        <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleExport}
                    disabled={isExporting || !selectedAccounts.length || !sheetId || !sheetTab}
                    className="h-11 px-8 gap-2 text-sm font-semibold"
                >
                    {isExporting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {isThai ? "กำลังส่งออก..." : "Exporting..."}</>
                    ) : (
                        <><Upload className="w-4 h-4" /> {isThai ? "ส่งออกไปยัง Google Sheets" : "Export to Google Sheets"}</>
                    )}
                </Button>
            </div>
        </div>
    );
}
