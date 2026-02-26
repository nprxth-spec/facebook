"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, XCircle, Clock, Search, RefreshCw,
  FileSpreadsheet, ChevronLeft, ChevronRight, Filter, Calendar, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const PAGE_SIZE = 15;

export default function ExportLogsPage() {
  const [data, setData]           = useState<LogsResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType]     = useState<"all" | "manual" | "auto">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "error">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterType !== "all" && { exportType: filterType }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });
      const res = await fetch(`/api/export-logs?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterType, filterStatus]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ประวัติการส่งออก</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">บันทึกการส่งออกข้อมูลทั้งหมด</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5"/> รีเฟรช
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "ทั้งหมด", value: totals.total, icon: FileSpreadsheet, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
          { label: "สำเร็จ", value: totals.success, icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
          { label: "ล้มเหลว", value: totals.error, icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
          { label: "แถวทั้งหมด", value: totals.rows.toLocaleString(), icon: RefreshCw, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4"/>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <Input placeholder="ค้นหาชื่อการตั้งค่า..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                {(["all", "manual", "auto"] as const).map((t) => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={cn("px-3 py-1.5 font-medium transition-colors",
                      filterType === t ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}>
                    {t === "all" ? "ทั้งหมด" : t === "manual" ? "แมนวล" : "อัตโนมัติ"}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                {(["all", "success", "error"] as const).map((s) => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={cn("px-3 py-1.5 font-medium transition-colors",
                      filterStatus === s ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}>
                    {s === "all" ? "ทั้งหมด" : s === "success" ? "สำเร็จ" : "ล้มเหลว"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  {["วันเวลา", "ประเภท", "ชื่อการตั้งค่า / ชีต", "บัญชีโฆษณา", "แถว", "วันที่ข้อมูล", "สถานะ"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto"/>
                    </td>
                  </tr>
                ) : !data?.logs?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Filter className="w-8 h-8 mx-auto mb-2 opacity-40"/>
                      <p>{search || filterType !== "all" || filterStatus !== "all" ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีประวัติการส่งออก"}</p>
                    </td>
                  </tr>
                ) : (
                  data.logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0"/>
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {format(new Date(log.createdAt), "d MMM yyyy", { locale: th })}
                            </p>
                            <p className="text-xs text-gray-400">{format(new Date(log.createdAt), "HH:mm")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={log.exportType === "auto" ? "default" : "secondary"} className="text-xs">
                          {log.exportType === "auto" ? "อัตโนมัติ" : "แมนวล"}
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
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3"/>
                            {format(new Date(log.dataDate), "d MMM yyyy", { locale: th })}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "success" ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3"/> สำเร็จ
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium" title={log.error ?? ""}>
                            <XCircle className="w-3 h-3"/> ล้มเหลว
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
                แสดง {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data?.total ?? 0)} จาก {data?.total ?? 0} รายการ
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                  <ChevronLeft className="w-3.5 h-3.5"/>
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
                  <ChevronRight className="w-3.5 h-3.5"/>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
