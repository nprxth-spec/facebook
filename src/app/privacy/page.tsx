"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5ff] via-[#f8f9ff] to-[#fef9ff] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl bg-white/95 dark:bg-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.16)] border border-slate-100/90 dark:border-slate-800 px-6 sm:px-10 py-8 space-y-6">
        <header className="space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
            AdSync
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            นโยบายความเป็นส่วนตัว (Privacy Policy)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            อธิบายการเก็บ ใช้ และปกป้องข้อมูลของคุณ
          </p>
        </header>

        <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            เราเก็บข้อมูลที่จำเป็นต่อการให้บริการ เช่น ข้อมูลบัญชีผู้ใช้ ข้อมูลการเชื่อมต่อ
            กับ Facebook และ Google และการตั้งค่าการส่งออก โดยจะไม่นำข้อมูลของคุณไปขาย
            หรือเปิดเผยต่อบุคคลที่สามที่ไม่เกี่ยวข้องกับการให้บริการ
          </p>
          <p>
            ข้อมูลที่ละเอียดอ่อน เช่น access token จะถูกจัดเก็บอย่างปลอดภัย และใช้
            เพื่อวัตถุประสงค์ในการดึงข้อมูลโฆษณาและส่งออกไปยัง Google Sheets เท่านั้น
          </p>
          <p>
            คุณสามารถติดต่อเราเพื่อขอแก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้ตามสิทธิ์ที่กฎหมาย
            คุ้มครองข้อมูลกำหนด และเราจะพยายามดำเนินการตามคำขอภายในระยะเวลาที่เหมาะสม
          </p>
        </div>

        <footer className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-200">
            ← กลับหน้าหลัก
          </Link>
          <span>© {new Date().getFullYear()} AdSync</span>
        </footer>
      </div>
    </div>
  );
}

