import { Loader2, Users, FileSpreadsheet, BarChart3, TrendingUp } from "lucide-react";

interface ExportLog {
  id: string;
}

interface DashboardStats {
  managerAccountCount: number;
  monthlyExports: number;
  totalRows: number;
  successRate: number;
  recentLogs: ExportLog[];
}

interface OverviewCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
  isThai: boolean;
}

export function OverviewCards({ stats, loading, isThai }: OverviewCardsProps) {
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((s) => (
        <div
          key={s.label}
          className="p-4 rounded-[1rem] border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm Backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <s.icon className={`w-4 h-4 ${s.color.split(" ")[0]}`} />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              {s.label}
            </p>
            {loading && <Loader2 className="w-3 h-3 text-gray-300 animate-spin ml-auto" />}
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

