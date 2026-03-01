"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const features = [
  {
    icon: FileSpreadsheet,
    titleTh: "ส่งออกไป Google Sheets",
    titleEn: "Export to Google Sheets",
    descriptionTh: "ส่งข้อมูลโฆษณา Facebook ไปยัง Google Sheets ได้ทันที รองรับหลายบัญชีพร้อมกัน",
    descriptionEn: "Send your Facebook Ads data to Google Sheets instantly, supporting multiple accounts.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: RefreshCw,
    titleTh: "อัปเดตอัตโนมัติ",
    titleEn: "Automatic updates",
    descriptionTh: "ตั้งค่าการส่งออกอัตโนมัติทุกวัน ไม่ต้องทำซ้ำด้วยตัวเอง",
    descriptionEn: "Schedule automatic daily exports so you never have to repeat the same work.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart3,
    titleTh: "แผงควบคุม",
    titleEn: "Dashboard",
    descriptionTh: "ดูสถิติและสถานะการส่งออกทั้งหมดได้ในหน้าเดียว",
    descriptionEn: "See all export stats and statuses in a single dashboard.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Shield,
    titleTh: "ปลอดภัย",
    titleEn: "Secure",
    descriptionTh: "เข้าสู่ระบบด้วย Google หรือ Facebook OAuth ที่ปลอดภัย",
    descriptionEn: "Sign in securely with Google or Facebook OAuth.",
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: Clock,
    titleTh: "ประวัติการส่งออก",
    titleEn: "Export history",
    descriptionTh: "ตรวจสอบประวัติการส่งออกทุกครั้ง พร้อมรายละเอียดครบถ้วน",
    descriptionEn: "Review every export with full details in the history.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Zap,
    titleTh: "แมพคอลัมน์อิสระ",
    titleEn: "Flexible column mapping",
    descriptionTh: "กำหนดเองได้ว่าข้อมูลไหนจะไปอยู่คอลัมน์ไหนใน Sheet",
    descriptionEn: "Define exactly which data goes to which column in your sheet.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const benefitsTh = [
  "รองรับหลายบัญชีโฆษณาพร้อมกัน",
  "เลือกช่วงวันที่ข้อมูลได้เอง",
  "แมพคอลัมน์ตามต้องการ",
  "ส่งออกแบบอัตโนมัติหรือแมนวล",
  "ประวัติการส่งออกครบถ้วน",
  "รองรับ Dark Mode",
];

const benefitsEn = [
  "Support multiple ad accounts at once",
  "Choose any date range you need",
  "Flexible column mapping",
  "Manual or automatic exports",
  "Complete export history",
  "Built-in dark mode support",
];

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const { language } = useTheme();
  const isThai = language === "th";
  const benefits = isThai ? benefitsTh : benefitsEn;

  // If user is already logged in, send them to dashboard when visiting "/"
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm dark:bg-slate-950/80 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/centxo-logo.png" alt="Centxo Logo" className="w-8 h-8 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Centxo
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Facebook Ads → Google Sheets
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-700 border border-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:border-white/10 dark:hover:bg-white/5"
              >
                {isThai ? "เข้าสู่ระบบ" : "Log in"}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-none shadow-[0_18px_45px_rgba(37,99,235,0.45)] hover:from-blue-400 hover:to-cyan-300"
              >
                {isThai ? "เริ่มต้นฟรี" : "Start for free"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Left: copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1 text-[11px] text-sky-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sky-200">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              <span className="uppercase tracking-[0.16em] font-semibold">
                {isThai ? "อัปเดตข้อมูลแบบเรียลไทม์" : "Real‑time ad reporting"}
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight">
                {isThai ? (
                  <>
                    ดึงข้อมูล{" "}
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      Facebook Ads
                    </span>
                    <br />
                    เข้าสู่ Google Sheets อัตโนมัติ
                  </>
                ) : (
                  <>
                    Sync your{" "}
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      Facebook Ads
                    </span>
                    <br />
                    into Google Sheets, on autopilot.
                  </>
                )}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
                {isThai
                  ? "เชื่อมต่อบัญชีโฆษณา ตั้งเวลาส่งออก และให้รายงานวิ่งเข้าชีตของคุณทุกวัน โดยไม่ต้องดึง Report เองอีกต่อไป"
                  : "Connect your ad accounts, schedule exports, and keep your reports flowing into Sheets every day—without ever downloading a CSV again."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex gap-3">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="gap-2 px-7 bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-none shadow-[0_20px_45px_rgba(37,99,235,0.55)] hover:from-blue-400 hover:to-cyan-300"
                  >
                    {isThai ? "เริ่มใช้งานฟรี" : "Get started for free"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-6 border-white/20 bg-transparent text-slate-100 hover:bg-white/5"
                  >
                    {isThai ? "ดูฟีเจอร์" : "View features"}
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 sm:mt-0">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {isThai
                    ? "ฟรี 14 วัน · ไม่ต้องใช้บัตรเครดิต"
                    : "14‑day free trial · No card required"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] text-slate-700 shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-slate-200">
                <BarChart3 className="w-3.5 h-3.5 text-sky-300" />
                {isThai ? "รองรับหลายบัญชีโฆษณา" : "Multi‑account exports"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] text-slate-700 shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-slate-200">
                <RefreshCw className="w-3.5 h-3.5 text-sky-300" />
                {isThai ? "ตั้งเวลาส่งออกรายวัน" : "Daily scheduling"}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] text-slate-700 shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-slate-200">
                <Shield className="w-3.5 h-3.5 text-sky-300" />
                {isThai ? "OAuth ปลอดภัยด้วย Google / Facebook" : "Secure OAuth with Google / Facebook"}
              </div>
            </div>
          </div>

          {/* Right: app preview */}
          <div className="relative">
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 -left-6 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.15)] overflow-hidden backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isThai ? "แดชบอร์ดภาพรวมการส่งออก" : "Export overview dashboard"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Centxo
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: Users,
                      labelTh: "บัญชีโฆษณา",
                      labelEn: "Ad accounts",
                    },
                    {
                      icon: FileSpreadsheet,
                      labelTh: "ส่งออกวันนี้",
                      labelEn: "Exports today",
                    },
                    {
                      icon: BarChart3,
                      labelTh: "แถวทั้งหมด",
                      labelEn: "Total rows",
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1.5 dark:bg-slate-900/70 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800/80">
                          <stat.icon className="w-3.5 h-3.5 text-sky-500 dark:text-sky-300" />
                        </div>
                        <span className="text-[11px] text-emerald-300">
                          +{(idx + 1) * 3}%
                        </span>
                      </div>
                      <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        12{idx}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isThai ? stat.labelTh : stat.labelEn}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3 dark:border-white/10 dark:bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {isThai ? "งานที่ตั้งเวลา" : "Scheduled jobs"}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Facebook Ads → Sheets
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-400/60 bg-emerald-400/10 text-[11px] text-emerald-700 px-2 py-0.5 dark:text-emerald-200"
                    >
                      <span className="mr-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {isThai ? "ทำงานอยู่" : "Running"}
                    </Badge>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {isThai
                        ? "อัปเดตทุกวัน เวลา 08:00 น."
                        : "Runs daily at 08:00"}
                    </span>
                    <span>
                      {isThai ? "ดึง 3 บัญชี" : "3 accounts"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/centxo-logo.png" alt="Centxo Logo" className="w-7 h-7 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white">Centxo</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isThai ? "© 2026 Centxo. สงวนลิขสิทธิ์ทั้งหมด" : "© 2026 Centxo. All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  );
}
