"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import {
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Users,
  ArrowUpRight,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { useTheme } from "@/components/providers/ThemeProvider";

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

interface DashboardStats {
  managerAccountCount: number;
  monthlyExports: number;
  totalRows: number;
  successRate: number;
  recentLogs: ExportLog[];
}

interface AutoExportConfig {
  id: string;
  name: string;
  googleSheetName: string | null;
  sheetTab: string | null;
  autoSchedule: string | null;
  autoDays: number[] | null;
  isAuto: boolean;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoConfigs, setAutoConfigs] = useState<AutoExportConfig[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const { language } = useTheme();
  const isThai = language === "th";
  const locale = isThai ? th : enUS;

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasGoogle = connectedProviders.includes("google");
  const hasFacebook = connectedProviders.includes("facebook");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const formatAutoDays = (days: number[] | null | undefined) => {
    if (!days || days.length === 0) return "";
    if (days.length === 7) {
      return isThai ? "ทุกวัน" : "Every day";
    }
    const labelsTh = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    const labelsEn = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const labels = isThai ? labelsTh : labelsEn;
    return days
      .sort()
      .map((d) => labels[d] ?? String(d))
      .join(", ");
  };

  useEffect(() => {
    fetch("/api/export-configs")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const active = data.filter(
          (c: AutoExportConfig) => c.isAuto && c.autoSchedule
        );
        setAutoConfigs(active);
      })
      .finally(() => setAutoLoading(false));
  }, []);

  const statCards = [
    {
      label: isThai ? "บัญชีโฆษณา" : "Ad accounts",
      value: loading ? "—" : String(stats?.managerAccountCount ?? 0),
      icon: Users,
      color: "text-primary bg-primary/10 dark:bg-primary/20",
      sub: isThai ? "บัญชีที่ใช้งาน" : "Active accounts",
    },
    {
      label: isThai ? "ส่งออกเดือนนี้" : "Exports this month",
      value: loading ? "—" : String(stats?.monthlyExports ?? 0),
      icon: FileSpreadsheet,
      color: "text-green-600 bg-green-50 dark:bg-green-900/20",
      sub: isThai ? "ครั้ง" : "runs",
    },
    {
      label: isThai ? "แถวทั้งหมด" : "Total rows",
      value: loading ? "—" : (stats?.totalRows ?? 0).toLocaleString(),
      icon: BarChart3,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
      sub: isThai ? "แถวที่ส่งออกสำเร็จ" : "rows exported successfully",
    },
    {
      label: isThai ? "ส่งออกสำเร็จ" : "Success rate",
      value: loading ? "—" : `${stats?.successRate ?? 0}%`,
      icon: TrendingUp,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
      sub: isThai ? "อัตราความสำเร็จ" : "success rate",
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {isThai ? "สวัสดี" : "Hello"},{" "}
            {session?.user?.name?.split(" ")[0] ?? (isThai ? "คุณ" : "there")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isThai
              ? "ภาพรวมระบบจัดการโฆษณาและการส่งออกข้อมูล"
              : "Overview of your ad management and data exports."}
          </p>
        </div>

        {/* Connection warning slim banner */}
        {(!hasGoogle || !hasFacebook) && (
          <Link href="/settings">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
              <Activity className="w-3.5 h-3.5" />
              {isThai
                ? "บัญชียังเชื่อมต่อไม่ครบ คลิกเพื่อตั้งค่า"
                : "Connections incomplete. Tap to setup."}
              <ArrowUpRight className="w-3 h-3 opacity-50" />
            </div>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="p-4 rounded-[1rem] border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm Backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]}`} />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">{s.label}</p>
              {loading && <Loader2 className="w-3 h-3 text-gray-300 animate-spin ml-auto" />}
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Exports */}
        <div className="lg:col-span-2 space-y-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {isThai ? "ประวัติการส่งออกล่าสุด" : "Recent exports"}
            </h2>
          </div>
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
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
                  <div key={log.id} className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.status === "success" ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"}`}>
                      {log.status === "success"
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <XCircle className="w-4 h-4" />
                      }
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
                        <span className="text-xs font-normal text-gray-500">{isThai ? "แถว" : "rows"}</span>
                      </p>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        {log.exportType === "auto"
                          ? isThai ? "อัตโนมัติ" : "Auto"
                          : isThai ? "แมนวล" : "Manual"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {isThai ? "เมนูลัด" : "Quick start"}
            </h3>
            <div className="space-y-2">
              {[
                {
                  href: "/export",
                  icon: FileSpreadsheet,
                  color: "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary",
                  label: isThai ? "ส่งออกข้อมูล" : "Export data",
                },
                {
                  href: "/settings?tab=manager-accounts",
                  icon: Users,
                  color: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
                  label: isThai ? "จัดการบัญชีโฆษณา" : "Manage Ad Accounts",
                },
              ].map((item) => (
                <Link href={item.href} key={item.href} className="block">
                  <div className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                      {item.label}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Auto exports */}
          <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isThai ? "งานอัตโนมัติ" : "Automations"}
              </h3>
            </div>
            <div>
              {autoLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                </div>
              ) : !autoConfigs.length ? (
                <div className="py-2 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isThai
                      ? "ไม่มีงานที่ทำงานอยู่"
                      : "No active automations"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {autoConfigs.slice(0, 3).map((cfg) => (
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
                          {cfg.autoDays && cfg.autoDays.length > 0 && ` · ${formatAutoDays(cfg.autoDays)}`}
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

          {/* Connection status */}
          <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {isThai ? "การเชื่อมต่อ" : "Connections"}
            </h3>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/60">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
              </div>
              <span className={`text-[11px] font-medium tracking-wide ${hasGoogle ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                {hasGoogle ? (isThai ? "เชื่อมต่อ" : "Connected") : (isThai ? "ไม่ได้เชื่อม" : "Not connected")}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
              </div>
              <span className={`text-[11px] font-medium tracking-wide ${hasFacebook ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                {hasFacebook ? (isThai ? "เชื่อมต่อ" : "Connected") : (isThai ? "ไม่ได้เชื่อม" : "Not connected")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
