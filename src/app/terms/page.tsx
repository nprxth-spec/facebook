"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5ff] via-[#f8f9ff] to-[#fef9ff] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl bg-white/95 dark:bg-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.16)] border border-slate-100/90 dark:border-slate-800 px-6 sm:px-10 py-8 space-y-6">
        <header className="space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
            Centxo
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            เงื่อนไขการใช้งาน (Terms of Service)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            สรุปข้อกำหนดหลักในการใช้งานระบบ Centxo
          </p>
        </header>

        <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            การใช้งานบริการ Centxo ถือว่าคุณยอมรับเงื่อนไขการใช้งานนี้ โดยคุณตกลงว่าจะ
            ใช้งานระบบตามกฎหมายที่เกี่ยวข้อง และไม่ทำการใช้งานที่อาจสร้างความเสียหาย
            ต่อระบบหรือบุคคลอื่น
          </p>
          <p>
            ระบบนี้ให้บริการในลักษณะ &quot;ตามสภาพที่เป็นอยู่&quot; (as‑is) โดยไม่มีการรับประกัน
            ใด ๆ ทั้งสิ้น ผู้ใช้งานควรตรวจสอบความถูกต้องของข้อมูลก่อนนำไปใช้ประกอบการตัดสินใจ
          </p>
          <p>
            เราอาจปรับปรุง แก้ไข หรือระงับการให้บริการบางส่วนได้ตามความเหมาะสม
            โดยจะแจ้งให้ทราบล่วงหน้าหากเป็นการเปลี่ยนแปลงที่มีนัยสำคัญ
          </p>
        </div>

        <footer className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-200">
            ← กลับหน้าหลัก
          </Link>
          <span>© {new Date().getFullYear()} Centxo</span>
        </footer>
      </div>
    </div>
  );
}

