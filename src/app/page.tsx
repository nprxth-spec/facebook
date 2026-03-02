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
      <section id="features" className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto space-y-32">

          {/* Feature 1: Export to Sheets */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-blue-600 font-bold tracking-wider text-sm uppercase block">INTEGRATION</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "ส่งข้อมูลเข้า Sheets แบบเรียลไทม์" : "Real-time sync to Google Sheets"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "เบื่อกับการต้องคอยดาวน์โหลดและรวมไฟล์ CSV หรือเปล่า? ระบบของเราดึงข้อมูล Campaign, Adsets และ Ads ทั้งหมดส่งตรงเข้า Google Sheets ทันที"
                  : "Tired of downloading and merging CSV files? Our system pulls all your Campaigns, Adsets, and Ads directly into Google Sheets instantly."}
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-blue-50 text-blue-600 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "แมพคอลัมน์อิสระ" : "Flexible Column Mapping"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "กำหนดเองได้ว่าข้อมูลไหนจะไปอยู่คอลัมน์ไหน" : "Define exactly which metrics go to which columns."}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-emerald-50 text-emerald-600 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "รองรับหลายบัญชี" : "Multi-account Support"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "ดึงข้อมูลจากหลายบัญชีโฆษณาพร้อมกันได้ในคลิกเดียว" : "Pull data from multiple ad accounts simultaneously."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup 1 */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="mx-auto flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">docs.google.com/spreadsheets</span>
                  </div>
                </div>
                {/* Mock Sheet rows */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 flex flex-col">
                  <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="w-1/3">Campaign</div>
                    <div className="w-1/4">Spend</div>
                    <div className="w-1/6">CTR</div>
                    <div className="w-1/4">Purchase</div>
                  </div>
                  {[
                    { camp: "Q3_Sale_Retargeting", spend: "$450.00", ctr: "2.4%", pur: "12" },
                    { camp: "LeadGen_Broad_v2", spend: "$1,200.50", ctr: "1.8%", pur: "45" },
                    { camp: "Brand_Awareness_Top", spend: "$80.00", ctr: "0.9%", pur: "2" },
                    { camp: "Lookalike_1%_Purchasers", spend: "$650.25", ctr: "3.1%", pur: "28" },
                  ].map((row, i) => (
                    <div key={i} className="flex border-b border-slate-100 dark:border-slate-700/50 px-3 py-3 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="w-1/3 font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{row.camp}</div>
                      <div className="w-1/4">{row.spend}</div>
                      <div className="w-1/6 text-emerald-500">{row.ctr}</div>
                      <div className="w-1/4">{row.pur}</div>
                    </div>
                  ))}
                </div>
                {/* Sync popover mockup */}
                <div className="absolute bottom-8 right-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-700">
                  <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Sync Complete</h5>
                    <p className="text-[10px] text-slate-500">24 campaigns updated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Automation */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Mockup 2 (Left on Desktop) */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none order-2 lg:order-1">
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-100 to-emerald-50 dark:from-cyan-900/20 dark:to-emerald-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden h-full min-h-[300px] flex flex-col justify-center">
                <div className="space-y-6">
                  {/* Cron setup mockup */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daily Sync</div>
                        <div className="text-xs text-slate-500">Every morning at 08:00 AM</div>
                      </div>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-cyan-500 relative transition-colors duration-200">
                      <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>

                  {/* Job List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Run ID: #4829</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Run ID: #4828</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0">Success</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 opacity-60">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Run ID: #4827</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-2 py-0">Success</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wider text-sm uppercase block">AUTOMATION</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "จัดการให้ทุกวัน ไม่ต้องตื่นมาทำเอง" : "Set it and forget it"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "ตั้งเวลาการดึงข้อมูลรายวันไว้ล่วงหน้า ระบบจะทำงานให้คุณตอนเช้าตรู่ พอคุณเปิดคอมทำงาน ข้อมูลพร้อมวิเคราะห์ใน Sheet เรียบร้อยแล้ว"
                  : "Schedule daily syncs in advance. By the time you start your workday, all your ad performance data is already waiting for you in your spreadsheet."}
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-cyan-50 text-cyan-600 shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "อัปเดตอัตโนมัติ" : "Automatic Updates"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "ตั้งค่าได้ว่าให้ระบบทำงานดึงล่าสุดไปอัปเดตเองทุกวัน" : "Configure the system to automatically update your sheets daily."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Dashboard */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <span className="text-purple-600 font-bold tracking-wider text-sm uppercase block">PERFORMANCE</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isThai ? "แผงควบคุมและประวัติ" : "Centralized Dashboard"}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                {isThai
                  ? "บริหารบัญชีโฆษณาต่างๆ ของคุณได้ในที่เดียว ดูประวัติการ Export ตรวจเช็กข้อผิดพลาด และสรุปยอดที่ใช้งบไปแล้วได้อย่างโปร่งใส"
                  : "Manage all your ad accounts from one powerful dashboard. Review export history, check for errors, and summarize ad spend transparently."}
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex gap-4 items-start">
                  <div className="rounded-full p-2 bg-purple-50 text-purple-600 shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{isThai ? "จัดการง่าย" : "Easy Management"}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{isThai ? "มองเห็นบัญชีและสถานะการ Exports ภาพรวม" : "See accounts and overall export statuses at a glance."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup 3 */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-tr from-purple-100 to-pink-50 dark:from-purple-900/20 dark:to-pink-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden h-full">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4">
                    <div className="text-xs font-medium text-slate-500 mb-1">Total Spend Sync</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">$14,230</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4">
                    <div className="text-xs font-medium text-slate-500 mb-1">Rows Exported</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">12,492</div>
                  </div>
                </div>
                {/* Fake Chart bars */}
                <div className="flex items-end gap-2 h-32 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {[40, 70, 45, 90, 65, 80, 55].map((height, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-purple-100 dark:bg-purple-900/40 relative group">
                      <div
                        className="absolute bottom-0 w-full rounded-t-sm bg-purple-500 dark:bg-purple-400 transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
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
