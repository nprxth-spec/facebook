import Link from "next/link";
import { FileSpreadsheet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  isThai: boolean;
}

export function QuickActions({ isThai }: QuickActionsProps) {
  const items = [
    {
      href: "/export",
      icon: FileSpreadsheet,
      color:
        "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary",
      label: isThai ? "ส่งออกข้อมูล" : "Export data",
    },
    {
      href: "/settings?tab=manager-accounts",
      icon: Users,
      color:
        "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
      label: isThai ? "จัดการบัญชีโฆษณา" : "Manage Ad Accounts",
    },
  ];

  return (
    <div className="space-y-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        {isThai ? "เมนูลัด" : "Quick start"}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <Link href={item.href} key={item.href} className="block">
            <div className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.color}`}
              >
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
  );
}

