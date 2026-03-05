"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight } from "lucide-react";
import { th, enUS } from "date-fns/locale";
import { useTheme } from "@/components/providers/ThemeProvider";
import { PageShell } from "@/components/layout/PageShell";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { RecentExports } from "@/components/dashboard/RecentExports";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AutoExports } from "@/components/dashboard/AutoExports";
import { ConnectionsCard } from "@/components/dashboard/ConnectionsCard";

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

  const greetingTitle = `${
    isThai ? "สวัสดี" : "Hello"
  }, ${session?.user?.name?.split(" ")[0] ?? (isThai ? "คุณ" : "there")}`;
  const description = isThai
    ? "ภาพรวมระบบจัดการโฆษณาและการส่งออกข้อมูล"
    : "Overview of your ad management and data exports.";

  const connectionWarning =
    !hasGoogle || !hasFacebook ? (
      <Link href="/settings">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
          <Activity className="w-3.5 h-3.5" />
          {isThai
            ? "บัญชียังเชื่อมต่อไม่ครบ คลิกเพื่อตั้งค่า"
            : "Connections incomplete. Tap to setup."}
          <ArrowUpRight className="w-3 h-3 opacity-50" />
        </div>
      </Link>
    ) : null;

  return (
    <PageShell title={greetingTitle} description={description} actions={connectionWarning}>
      <OverviewCards stats={stats} loading={loading} isThai={isThai} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-6">
        <RecentExports stats={stats} loading={loading} isThai={isThai} locale={locale} />

        <div className="space-y-6">
          <QuickActions isThai={isThai} />
          <AutoExports
            configs={autoConfigs}
            loading={autoLoading}
            isThai={isThai}
            formatAutoDays={formatAutoDays}
          />
          <ConnectionsCard
            hasGoogle={hasGoogle}
            hasFacebook={hasFacebook}
            isThai={isThai}
          />
        </div>
      </div>
    </PageShell>
  );
}

