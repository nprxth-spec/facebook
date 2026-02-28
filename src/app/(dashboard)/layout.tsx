"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn("transition-all duration-300 min-h-screen flex flex-col", collapsed ? "ml-16" : "ml-64")}>
        <Header />
        <main className="px-6 sm:px-[60px] lg:px-[100px] flex-1 min-h-0 h-full">{children}</main>
      </div>
    </div>
  );
}
