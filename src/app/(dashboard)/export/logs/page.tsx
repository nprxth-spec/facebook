"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2, XCircle, Clock, Search, RefreshCw,
  FileSpreadsheet, ChevronLeft, ChevronRight, Filter, Calendar, Loader2,
  ArrowLeft, Check, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

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

const PAGE_SIZE = 10;

export default function ExportLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterDays, setFilterDays] = useState<"all" | "7" | "14" | "30" | "lastMonth">("all");
  const [filterType, setFilterType] = useState<"all" | "manual" | "auto">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "error">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const { language } = useTheme();
  const isThai = language === "th";
  const locale = isThai ? th : enUS;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filterType, filterStatus]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterType !== "all" && { exportType: filterType }),
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterDays !== "all" && { days: filterDays }),
      });
      const res = await fetch(`/api/export-logs?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterType, filterStatus, filterDays]);

  // Summary stats from current full dataset (fetch separately for totals)
  const [totals, setTotals] = useState({ total: 0, success: 0, error: 0, rows: 0 });
  useEffect(() => {
    fetch("/api/export-logs?page=1&limit=1000")
      .then((r) => r.json())
      .then((d: LogsResponse) => {
        setTotals({
          total: d.total,
          success: d.logs.filter((l) => l.status === "success").length,
          error: d.logs.filter((l) => l.status === "error").length,
          rows: d.logs.reduce((sum, l) => sum + l.rowCount, 0),
        });
      });
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  if (!mounted) return null;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isThai ? "ประวัติการส่งออก" : "Export history"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isThai ? "บันทึกการส่งออกข้อมูลทั้งหมด" : "Log of all export runs."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/export">
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> {isThai ? "กลับ" : "Back"}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> {isThai ? "รีเฟรช" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: isThai ? "ทั้งหมด" : "Total runs",
            value: totals.total,
            icon: FileSpreadsheet,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: isThai ? "สำเร็จ" : "Succeeded",
            value: totals.success,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50 dark:bg-green-900/20",
          },
          {
            label: isThai ? "ล้มเหลว" : "Failed",
            value: totals.error,
            icon: XCircle,
            color: "text-red-600 bg-red-50 dark:bg-red-900/20",
          },
          {
            label: isThai ? "แถวทั้งหมด" : "Total rows",
            value: totals.rows.toLocaleString(),
            icon: RefreshCw,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={
                  isThai ? "ค้นหาชื่อการตั้งค่า..." : "Search by configuration name..."
                }
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* Date Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9 px-3 text-xs font-medium border-gray-200 dark:border-gray-700">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>
                      {filterDays === "all"
                        ? isThai ? "เวลา: ทั้งหมด" : "Time: All"
                        : filterDays === "7"
                          ? isThai ? "7 วันล่าสุด" : "Last 7 Days"
                          : filterDays === "14"
                            ? isThai ? "14 วันล่าสุด" : "Last 14 Days"
                            : filterDays === "30"
                              ? isThai ? "1 เดือนล่าสุด" : "Last 1 Month"
                              : isThai ? "เดือนที่ผ่านมา" : "Last Month"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 p-1">
                  {(["all", "7", "14", "30", "lastMonth"] as const).map((d) => (
                    <DropdownMenuItem
                      key={d}
                      onClick={() => setFilterDays(d)}
                      className={cn(
                        "text-xs px-2 py-1.5 cursor-pointer rounded-md flex items-center justify-between",
                        filterDays === d ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {d === "all"
                        ? (isThai ? "ทั้งหมด" : "All Time")
                        : d === "30"
                          ? (isThai ? "1 เดือนล่าสุด" : "Last 1 Month")
                          : d === "lastMonth"
                            ? (isThai ? "เดือนที่ผ่านมา" : "Last Month")
                            : (isThai ? `${d} วันล่าสุด` : `Last ${d} Days`)}
                      {filterDays === d && <Check className="w-3 h-3" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Type Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9 px-3 text-xs font-medium border-gray-200 dark:border-gray-700">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <span>
                      {filterType === "all"
                        ? isThai ? "ประเภท: ทั้งหมด" : "Type: All"
                        : filterType === "manual"
                          ? isThai ? "แมนวล" : "Manual"
                          : isThai ? "อัตโนมัติ" : "Automatic"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 p-1">
                  {(["all", "manual", "auto"] as const).map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={cn(
                        "text-xs px-2 py-1.5 cursor-pointer rounded-md flex items-center justify-between",
                        filterType === t ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {t === "all" ? (isThai ? "ทั้งหมด" : "All") : t === "manual" ? (isThai ? "แมนวล" : "Manual") : (isThai ? "อัตโนมัติ" : "Automatic")}
                      {filterType === t && <Check className="w-3 h-3" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9 px-3 text-xs font-medium border-gray-200 dark:border-gray-700">
                    <div className={cn("w-1.5 h-1.5 rounded-full", filterStatus === "all" ? "bg-gray-400" : filterStatus === "success" ? "bg-green-500" : "bg-red-500")} />
                    <span>
                      {filterStatus === "all"
                        ? isThai ? "สถานะ: ทั้งหมด" : "Status: All"
                        : filterStatus === "success"
                          ? isThai ? "สำเร็จ" : "Succeeded"
                          : isThai ? "ล้มเหลว" : "Failed"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 p-1">
                  {(["all", "success", "error"] as const).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={cn(
                        "text-xs px-2 py-1.5 cursor-pointer rounded-md flex items-center justify-between",
                        filterStatus === s ? "bg-primary/10 text-primary" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {s !== "all" && <div className={cn("w-1.5 h-1.5 rounded-full", s === "success" ? "bg-green-500" : "bg-red-500")} />}
                        {s === "all" ? (isThai ? "ทั้งหมด" : "All") : s === "success" ? (isThai ? "สำเร็จ" : "Succeeded") : (isThai ? "ล้มเหลว" : "Failed")}
                      </div>
                      {filterStatus === s && <Check className="w-3 h-3" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  {(isThai
                    ? [
                      { label: "วันเวลา", align: "text-left" },
                      { label: "ประเภท", align: "text-left" },
                      { label: "ชื่อการตั้งค่า / ชีต", align: "text-left" },
                      { label: "บัญชีโฆษณา", align: "text-center" },
                      { label: "จำนวนแถวที่ส่งออก", align: "text-center" },
                      { label: "วันที่ข้อมูล", align: "text-center" },
                      { label: "สถานะ", align: "text-left" }
                    ]
                    : [
                      { label: "Date / time", align: "text-left" },
                      { label: "Type", align: "text-left" },
                      { label: "Config / Sheet", align: "text-left" },
                      { label: "Ad accounts", align: "text-center" },
                      { label: "Exported Rows", align: "text-center" },
                      { label: "Data date", align: "text-center" },
                      { label: "Status", align: "text-left" }
                    ]
                  ).map((col) => (
                    <th key={col.label} className={cn("px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap", col.align)}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : !data?.logs?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>
                        {search || filterType !== "all" || filterStatus !== "all"
                          ? isThai
                            ? "ไม่พบข้อมูลที่ค้นหา"
                            : "No results match your filters"
                          : isThai
                            ? "ยังไม่มีประวัติการส่งออก"
                            : "No export history yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {format(new Date(log.createdAt), "d MMM yyyy", { locale })}
                            </p>
                            <p className="text-xs text-gray-400">{format(new Date(log.createdAt), "HH:mm")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.exportType === "auto" ? "default" : "secondary"} className="text-xs">
                          {log.exportType === "auto"
                            ? isThai ? "อัตโนมัติ" : "Automatic"
                            : isThai ? "แมนวล" : "Manual"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{log.configName ?? "—"}</p>
                        <p className="text-xs text-gray-400">{log.sheetFileName ?? "—"} · {log.sheetTabName ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.adAccountCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("font-medium text-sm", !log.rowCount ? "text-gray-400" : "text-gray-900 dark:text-gray-100")}>
                          {log.rowCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.dataDate ? (
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(log.dataDate), "d MMM yyyy", { locale })}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "success" ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {isThai ? "สำเร็จ" : "Succeeded"}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium" title={log.error ?? ""}>
                            <XCircle className="w-3 h-3" />
                            {isThai ? "ล้มเหลว" : "Failed"}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isThai ? "แสดง" : "Showing"}{" "}
                {((page - 1) * PAGE_SIZE) + 1}–
                {Math.min(page * PAGE_SIZE, data?.total ?? 0)}{" "}
                {isThai ? "จาก" : "of"} {data?.total ?? 0}{" "}
                {isThai ? "รายการ" : "entries"}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pn: number;
                  if (totalPages <= 5) pn = i + 1;
                  else if (page <= 3) pn = i + 1;
                  else if (page >= totalPages - 2) pn = totalPages - 4 + i;
                  else pn = page - 2 + i;
                  return (
                    <Button key={pn} variant={page === pn ? "default" : "outline"} size="sm" onClick={() => setPage(pn)} className="h-7 w-7 p-0 text-xs">
                      {pn}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
