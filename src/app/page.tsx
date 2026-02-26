import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: FileSpreadsheet,
    title: "ส่งออกไป Google Sheets",
    description: "ส่งข้อมูลโฆษณา Facebook ไปยัง Google Sheets ได้ทันที รองรับหลายบัญชีพร้อมกัน",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: RefreshCw,
    title: "อัปเดตอัตโนมัติ",
    description: "ตั้งค่าการส่งออกอัตโนมัติทุกวัน ไม่ต้องทำซ้ำด้วยตัวเอง",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart3,
    title: "แผงควบคุม",
    description: "ดูสถิติและสถานะการส่งออกทั้งหมดได้ในหน้าเดียว",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Shield,
    title: "ปลอดภัย",
    description: "เข้าสู่ระบบด้วย Google หรือ Facebook OAuth ที่ปลอดภัย",
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: Clock,
    title: "ประวัติการส่งออก",
    description: "ตรวจสอบประวัติการส่งออกทุกครั้ง พร้อมรายละเอียดครบถ้วน",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Zap,
    title: "แมพคอลัมน์อิสระ",
    description: "กำหนดเองได้ว่าข้อมูลไหนจะไปอยู่คอลัมน์ไหนใน Sheet",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const benefits = [
  "รองรับหลายบัญชีโฆษณาพร้อมกัน",
  "เลือกช่วงวันที่ข้อมูลได้เอง",
  "แมพคอลัมน์ตามต้องการ",
  "ส่งออกแบบอัตโนมัติหรือแมนวล",
  "ประวัติการส่งออกครบถ้วน",
  "รองรับ Dark Mode",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-xl">AdSync</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">เข้าสู่ระบบ</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">เริ่มต้นฟรี</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          ส่งข้อมูลโฆษณาไป Google Sheets อัตโนมัติ
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
          จัดการข้อมูล{" "}
          <span className="text-blue-600">Facebook Ads</span>
          <br />
          ง่ายขึ้นกว่าเดิม
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          ส่งออกข้อมูลโฆษณา Facebook ไปยัง Google Sheets โดยอัตโนมัติ
          รองรับหลายบัญชี แมพคอลัมน์ได้เอง และตั้งเวลาส่งออกได้ตามต้องการ
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="gap-2 px-8">
              เริ่มใช้งานฟรี <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="px-8">
              ดูฟีเจอร์
            </Button>
          </Link>
        </div>
        {/* Preview image placeholder */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden shadow-2xl">
          <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mx-auto" />
            </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-xl p-4 space-y-3">
              {["แดชบอร์ด", "ส่งออกข้อมูล", "ประวัติ", "ตั้งค่า"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item}</div>
                </div>
              ))}
            </div>
            <div className="col-span-3 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {["บัญชีโฆษณา", "ส่งออกวันนี้", "แถวทั้งหมด"].map((stat) => (
                  <div key={stat} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">{stat}</div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16" />
                  </div>
                ))}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm h-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">ฟีเจอร์ทั้งหมด</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            ทุกสิ่งที่คุณต้องการสำหรับจัดการข้อมูลโฆษณา
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => (
            <div key={feat.title} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}>
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{feat.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl bg-blue-600 p-10 md:p-16 text-white">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">ทำไมต้องเลือก AdSync?</h2>
              <p className="text-blue-100 text-lg mb-8">
                ประหยัดเวลาการทำรายงานด้วยการส่งออกข้อมูลอัตโนมัติ
              </p>
              <Link href="/login">
                <Button variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-blue-50 border-white gap-2">
                  เริ่มต้นเลย <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <ul className="space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-200 shrink-0" />
                  <span className="text-blue-100">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">AdSync</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 AdSync. สงวนลิขสิทธิ์ทั้งหมด
          </p>
        </div>
      </footer>
    </div>
  );
}
