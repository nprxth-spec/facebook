"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/logs", label: "Export Logs" },
  { href: "/admin/logs/activity", label: "Activity Logs" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const currentNav =
    navItems.find((item) => {
      if (item.href === "/admin") {
        return pathname === "/admin";
      }
      // แมตช์แบบ prefix แต่ต้องตรง segment แรกเต็ม ๆ
      return pathname === item.href || pathname.startsWith(item.href + "/");
    }) ?? navItems[0];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (e) {
      console.error("Failed to logout admin", e);
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-slate-200 bg-white/95 px-4 py-6 flex flex-col gap-6 backdrop-blur">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">
            Centxo
          </div>
          <div className="text-base font-semibold tracking-wide text-slate-900">
            Admin Monitor
          </div>
        </div>
        <nav className="flex flex-col gap-1.5 text-sm">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 cursor-pointer flex items-center justify-between ${
                  active
                    ? "bg-slate-900 text-slate-50 shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <header className="h-14 border-b border-slate-200 px-8 flex items-center justify-between bg-white/95 backdrop-blur">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Admin
            </span>
            <span className="text-base font-semibold text-slate-900">
              {currentNav.label}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60 cursor-pointer"
          >
            {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

