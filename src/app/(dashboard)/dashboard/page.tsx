"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isThai ? "สวัสดี" : "Hello"},{" "}
          {session?.user?.name?.split(" ")[0] ?? (isThai ? "คุณ" : "there")} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {isThai
            ? "ภาพรวมการส่งออกข้อมูลโฆษณาของคุณ"
            : "Overview of your ad data exports."}
        </p>
      </div>

      {/* Connection warning */}
      {(!hasGoogle || !hasFacebook) && (
        <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-start gap-3">
          <Activity className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              {isThai ? "บัญชียังไม่ครบ" : "Connections incomplete"}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              {!hasFacebook &&
                (isThai ? "ยังไม่ได้เชื่อมต่อ Facebook " : "Facebook is not connected ")}
              {!hasGoogle &&
                (isThai ? "ยังไม่ได้เชื่อมต่อ Google " : "Google is not connected ")}
              —{" "}
              {isThai
                ? "เชื่อมต่อเพื่อใช้งานได้เต็มรูปแบบ"
                : "Connect them to use all features."}
            </p>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="outline" className="shrink-0 text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-300 dark:border-yellow-700">
              {isThai ? "ตั้งค่า" : "Settings"}
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                {loading && <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exports */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>{isThai ? "การส่งออกล่าสุด" : "Recent exports"}</CardTitle>
                <CardDescription>
                  {isThai ? "5 รายการล่าสุด" : "Last 5 runs"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : !stats?.recentLogs?.length ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isThai ? "ยังไม่มีประวัติการส่งออก" : "No export history yet"}
                  </p>
                  <Link href="/export">
                    <Button size="sm" className="mt-3">
                      {isThai ? "เริ่มส่งออกข้อมูล" : "Start exporting data"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.status === "success" ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                        {log.status === "success"
                          ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
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
                          {isThai ? "แถว" : "rows"}
                        </p>
                        <Badge variant={log.exportType === "auto" ? "default" : "secondary"} className="text-xs">
                          {log.exportType === "auto"
                            ? isThai ? "อัตโนมัติ" : "Automatic"
                            : isThai ? "แมนวล" : "Manual"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{isThai ? "เริ่มต้นเร็ว" : "Quick start"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  href: "/export",
                  icon: FileSpreadsheet,
                  color: "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary",
                  label: isThai ? "ส่งออกข้อมูล" : "Export data",
                  sub: isThai ? "ส่งไป Google Sheets" : "Send to Google Sheets",
                },
                {
                  href: "/settings",
                  icon: Users,
                  color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
                  label: isThai ? "บัญชีโฆษณา" : "Ad accounts",
                  sub: isThai ? "จัดการบัญชี" : "Manage accounts",
                },
              ].map((item) => (
                <Link href={item.href} key={item.href} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Connection status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {isThai ? "สถานะการเชื่อมต่อ" : "Connection status"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">Google</span>
                </div>
                <Badge variant={hasGoogle ? "success" : "secondary"}>
                  {hasGoogle
                    ? isThai ? "เชื่อมต่อแล้ว" : "Connected"
                    : isThai ? "ยังไม่ได้เชื่อมต่อ" : "Not connected"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">Facebook</span>
                </div>
                <Badge variant={hasFacebook ? "success" : "secondary"}>
                  {hasFacebook
                    ? isThai ? "เชื่อมต่อแล้ว" : "Connected"
                    : isThai ? "ยังไม่ได้เชื่อมต่อ" : "Not connected"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
