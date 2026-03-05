"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function DataPolicyPage() {
  const { language } = useTheme();
  const isThai = language === "th";

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:bg-slate-950 dark:text-slate-50 px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isThai ? "กลับไปหน้าแรก" : "Back to Home"}
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isThai ? "การเก็บและการลบข้อมูล" : "Data retention & deletion"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isThai
                ? "หน้านี้อธิบายวิธีที่ Centxo เก็บ ใช้งาน และลบข้อมูลของคุณ รวมถึงวิธีที่คุณสามารถจัดการหรือขอลบข้อมูลได้ด้วยตัวเอง"
                : "This page explains how Centxo stores, uses, and deletes your data, and how you can manage or request deletion of your data yourself."}
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {isThai ? "เราเก็บข้อมูลอะไรบ้าง" : "What data we store"}
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <li>
              {isThai
                ? "ข้อมูลบัญชีพื้นฐาน เช่น ชื่อ อีเมล และรูปโปรไฟล์จากผู้ให้บริการล็อกอิน (Google / Facebook)"
                : "Basic account information such as name, email address, and profile picture from your login provider (Google / Facebook)."}
            </li>
            <li>
              {isThai
                ? "โทเคนเชื่อมต่อที่จำเป็นต่อการดึงข้อมูลโฆษณาและเขียนข้อมูลลง Google Sheets (ไม่เก็บรหัสผ่านของคุณ)"
                : "Connection tokens required to read your ad data and write to Google Sheets (we never store your passwords)."}
            </li>
            <li>
              {isThai
                ? "การตั้งค่าที่คุณสร้าง เช่น โปรไฟล์การส่งออก ตารางที่ใช้ และช่วงวันที่"
                : "Configuration you create, such as export profiles, target spreadsheets, and date ranges."}
            </li>
            <li>
              {isThai
                ? "ประวัติการส่งออกและล็อกที่เกี่ยวข้อง เพื่อใช้ตรวจสอบปัญหาและแสดงสถิติย้อนหลัง"
                : "Export history and related logs so we can show you past activity and help debug issues."}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {isThai ? "เราใช้ข้อมูลอย่างไร" : "How we use your data"}
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {isThai
              ? "เราใช้ข้อมูลของคุณโดยตรงเพื่อช่วยให้คุณดึงข้อมูลโฆษณาเข้าสู่ Google Sheets และสร้างรายงานเท่านั้น เราไม่ขายข้อมูลของคุณให้บุคคลที่สาม และไม่ใช้ข้อมูลโฆษณาของคุณเพื่อโฆษณาในระบบอื่น"
              : "We use your data solely to help you sync Facebook Ads data into Google Sheets and build your reports. We do not sell your data to third parties and we do not use your ad data to run advertising in other systems."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {isThai ? "ระยะเวลาการเก็บข้อมูล" : "How long we retain data"}
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <li>
              {isThai
                ? "ข้อมูลบัญชี (ชื่อ อีเมล รูปโปรไฟล์) จะถูกเก็บไว้ตราบเท่าที่บัญชีของคุณยังคงใช้งานอยู่"
                : "Account data (name, email, profile picture) is stored as long as your account remains active."}
            </li>
            <li>
              {isThai
                ? "โทเคนการเชื่อมต่อ (Google / Facebook) จะถูกเก็บไว้ตราบเท่าที่คุณยังเชื่อมต่อบัญชีนั้นอยู่ และอาจถูกต่ออายุเป็นระยะตามข้อกำหนดของผู้ให้บริการ"
                : "Connection tokens (Google / Facebook) are stored as long as the connection is active, and may be refreshed periodically according to provider requirements."}
            </li>
            <li>
              {isThai
                ? "ประวัติการส่งออกและล็อกอาจถูกเก็บไว้ในระยะเวลาที่เหมาะสมเพื่อการตรวจสอบย้อนหลัง จากนั้นอาจถูกลบหรือทำให้ไม่สามารถระบุตัวตนได้"
                : "Export history and logs are retained for a reasonable period for troubleshooting and analytics, and may be removed or anonymized over time."}
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {isThai ? "การลบข้อมูลและการยกเลิกบัญชี" : "Deleting your data & account"}
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {isThai ? (
              <>
                คุณสามารถลบบัญชีและข้อมูลทั้งหมดของคุณได้ตลอดเวลา จากหน้า{" "}
                <Link
                  href="/settings?tab=delete"
                  className="underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  การตั้งค่าบัญชี
                </Link>{" "}
                เมื่อยืนยันการลบ เราจะ:
              </>
            ) : (
              <>
                You can delete your account and all associated data at any time from{" "}
                <Link
                  href="/settings?tab=delete"
                  className="underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Account settings
                </Link>
                . Once confirmed, we will:
              </>
            )}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <li>
              {isThai
                ? "ลบข้อมูลบัญชีของคุณออกจากฐานข้อมูล Centxo"
                : "Remove your account record from the Centxo database."}
            </li>
            <li>
              {isThai
                ? "ลบการตั้งค่า การตั้งค่าส่งออก และบันทึกการส่งออกที่ผูกกับบัญชีของคุณ"
                : "Delete configurations, export profiles, and export logs associated with your account."}
            </li>
            <li>
              {isThai
                ? "ยกเลิกโทเคนการเชื่อมต่อ (เช่น Google / Facebook) ที่เราเก็บไว้ในระบบ"
                : "Invalidate and remove any connection tokens (such as Google or Facebook) stored in our systems."}
            </li>
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isThai
              ? "หมายเหตุ: ข้อมูลที่ถูกส่งออกไปแล้วใน Google Sheets ของคุณจะไม่ถูกลบออกโดยอัตโนมัติ เนื่องจากเป็นข้อมูลที่อยู่ในบัญชี Google ของคุณเอง"
              : "Note: Data you have already exported into your own Google Sheets will not be automatically removed, as it lives in your own Google account."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {isThai ? "คำถามเพิ่มเติม" : "Questions"}
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {isThai
              ? "หากคุณมีคำถามเพิ่มเติมเกี่ยวกับการเก็บหรือลบข้อมูล สามารถติดต่อเราได้ผ่านอีเมลที่ระบุในหน้าเงื่อนไขการใช้งานหรือนโยบายความเป็นส่วนตัว"
              : "If you have more questions about how we store or delete data, please contact us via the email listed in our Terms of Service or Privacy Policy."}
          </p>
        </section>
      </div>
    </div>
  );
}

