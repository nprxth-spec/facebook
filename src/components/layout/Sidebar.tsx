"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  {
    key: "dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "export",
    href: "/export",
    icon: FileSpreadsheet,
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTheme();

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700 transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">AdSync</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? t(`sidebar.${item.key}`) : undefined}
                  >
                    <item.icon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-5 h-5")} />
                    {!collapsed && <span>{t(`sidebar.${item.key}`)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggle}
            className={cn(
              "w-full flex items-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors",
              collapsed ? "justify-center" : "justify-end"
            )}
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /><path d="m14 15 3-3-3-3" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /><path d="m15 15-3-3 3-3" /></svg>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
