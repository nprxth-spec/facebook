"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function PrivacyPage() {
  const { language } = useTheme();
  const isThai = language === "th";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isThai ? "กลับไปหน้าแรก" : "Back to Home"}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {isThai ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">Last updated: March 2, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "1. บทนำ" : "1. Introduction"}
            </h2>
            <p>
              {isThai
                ? "Centxo (\"เรา\", \"ของเรา\") ให้ความสำคัญกับความเป็นส่วนตัวของคุณ และมุ่งมั่นที่จะปกป้องข้อมูลส่วนบุคคลของคุณ นโยบายฉบับนี้อธิบายว่าข้อมูลใดที่เราเก็บ และเราใช้ ปกป้อง และแบ่งปันข้อมูลเหล่านั้นอย่างไรเมื่อคุณใช้แพลตฟอร์ม Centxo"
                : "Centxo (\"we\", \"us\", or \"our\") respects your privacy and is committed to protecting your personal data. This Privacy Policy tells you how we look after your personal data when you use the Centxo platform and tells you about your privacy rights and how the law protects you."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "2. ข้อมูลที่เราเก็บ" : "2. The Data We Collect"}
            </h2>
            <p>
              {isThai
                ? "เราอาจเก็บ ใช้ และจัดเก็บข้อมูลส่วนบุคคลของคุณประเภทต่าง ๆ เช่น"
                : "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:"}
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>{isThai ? "ข้อมูลระบุตัวตน:" : "Identity Data:"}</strong>{" "}
                {isThai
                  ? "เช่น ชื่อ นามสกุล หรือชื่อที่ใช้ในระบบ"
                  : "includes first name, last name, username or similar identifier."}
              </li>
              <li>
                <strong>{isThai ? "ข้อมูลติดต่อ:" : "Contact Data:"}</strong>{" "}
                {isThai
                  ? "เช่น ที่อยู่อีเมล ข้อมูลโปรไฟล์ Facebook และ Google (ชื่อ รูปโปรไฟล์)"
                  : "includes email address, Facebook profile information, and Google profile (name, picture)."}
              </li>
              <li>
                <strong>{isThai ? "ข้อมูลทางเทคนิค:" : "Technical Data:"}</strong>{" "}
                {isThai
                  ? "เช่น ที่อยู่ IP ข้อมูลการเข้าสู่ระบบ ประเภทและเวอร์ชันของเบราว์เซอร์"
                  : "includes internet protocol (IP) address, your login data, browser type and version."}
              </li>
              <li>
                <strong>{isThai ? "ข้อมูลการใช้งาน:" : "Usage Data:"}</strong>{" "}
                {isThai
                  ? "ข้อมูลเกี่ยวกับวิธีที่คุณใช้เว็บไซต์และบริการของเรา"
                  : "includes information about how you use our website and services."}
              </li>
              <li>
                <strong>{isThai ? "ข้อมูลโฆษณา:" : "Ad Data:"}</strong>{" "}
                {isThai
                  ? "เช่น ข้อมูลเกี่ยวกับแคมเปญ กลุ่มโฆษณา และโฆษณาที่นำเข้าผ่าน Facebook API"
                  : "information about your Facebook Ad Campaigns, Ad Sets, and Ads imported via API."}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "3. วิธีที่เราใช้ข้อมูลของคุณ" : "3. How We Use Your Data"}
            </h2>
            <p>
              {isThai
                ? "เราจะใช้ข้อมูลส่วนบุคคลของคุณเท่าที่กฎหมายอนุญาต โดยหลักแล้วเพื่อ:"
                : "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:"}
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                {isThai
                  ? "ให้บริการและดูแลระบบ (เช่น การจัดการการส่งออกและรายงานโฆษณา)"
                  : "To provide and maintain the Service (managing your ads)."}
              </li>
              <li>
                {isThai
                  ? "ยืนยันตัวตนผ่าน Facebook Login และ Google Sign-In"
                  : "To authenticate you via Facebook Login and Google Sign-In."}
              </li>
              <li>
                {isThai
                  ? "ปรับปรุงบริการและพัฒนาฟีเจอร์ใหม่ ๆ"
                  : "To improve the Service and develop new features."}
              </li>
              <li>
                {isThai
                  ? "ให้การสนับสนุนและตอบคำถามลูกค้า"
                  : "To provide customer support."}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "4. ข้อมูลจาก Facebook" : "4. Facebook Data"}
            </h2>
            <p>
              {isThai ? (
                <>
                  แอปของเราใช้ Facebook Login, Marketing API และ Pages API โดยอาจร้องขอสิทธิ์ต่าง ๆ เช่น{" "}
                  <code>email</code>, <code>public_profile</code>, <code>ads_read</code>, <code>ads_management</code>,{" "}
                  <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_messaging</code>,{" "}
                  <code>pages_manage_metadata</code>, <code>pages_manage_ads</code>, <code>business_management</code> เพื่อให้สามารถจัดการโฆษณา
                  กล่องข้อความ (Messenger) และวิเคราะห์ข้อมูลได้ เราไม่ขายข้อมูลนี้ให้บุคคลที่สาม
                </>
              ) : (
                <>
                  Our App uses Facebook Login, the Marketing API, and Pages API. We request the following
                  permissions: <code>email</code>, <code>public_profile</code>, <code>ads_read</code>,{" "}
                  <code>ads_management</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>,{" "}
                  <code>pages_messaging</code>, <code>pages_manage_metadata</code>, <code>pages_manage_ads</code>,{" "}
                  <code>business_management</code>. We use these to provide ad management, Inbox (Messenger
                  conversations), and analytics. We do not sell this data to third parties.
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "5. ข้อมูลจาก Google" : "5. Google Data"}
            </h2>
            <p>
              {isThai ? (
                <>
                  แอปของเราใช้ Google Sign-In เพื่อยืนยันตัวตน และ Google Sheets API สำหรับฟีเจอร์ส่งออกข้อมูล เราเก็บ
                  อีเมล ชื่อ และรูปโปรไฟล์จาก Google User Data ของคุณ โดยจะขอสิทธิ์ <code>drive.file</code> ด้วยความยินยอมจากคุณ
                  เพื่อเขียนข้อมูลโฆษณา (campaigns, ads, insights) ลงใน Google Sheets คุณเป็นผู้เลือกสเปรดชีตผ่าน
                  Google Picker และเราจะเข้าถึงเฉพาะไฟล์ที่คุณเลือกเท่านั้น การใช้และการส่งต่อข้อมูลจาก Google APIs ของ
                  Centxo ปฏิบัติตาม <strong>Google API Services User Data Policy</strong> รวมถึงข้อกำหนด Limited Use
                </>
              ) : (
                <>
                  Our App uses Google Sign-In for authentication and Google Sheets API for the Export feature. We
                  collect email address, name, and profile picture from your Google User Data. With your consent, we
                  request the <code>drive.file</code> scope to export your ad data (campaigns, ads, insights) to Google
                  Sheets. You select the spreadsheet via Google Picker; we access only the files you explicitly choose.
                  Centxo&apos;s use and transfer of information received from Google APIs adheres to the{" "}
                  <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "6. ความปลอดภัยของข้อมูล" : "6. Data Security"}
            </h2>
            <p>
              {isThai
                ? "เราใช้มาตรการด้านความปลอดภัยที่เหมาะสมเพื่อป้องกันไม่ให้ข้อมูลส่วนบุคคลของคุณสูญหาย ถูกเข้าถึง แก้ไข หรือเปิดเผยโดยไม่ได้รับอนุญาต"
                : "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "7. การติดต่อเรา" : "7. Contact Us"}
            </h2>
            <p>
              {isThai
                ? "หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว หรือสิทธิของคุณเกี่ยวกับข้อมูลส่วนบุคคล สามารถติดต่อเราได้ที่ support@centxo.com"
                : "If you have any questions about this Privacy Policy, including any requests to exercise your legal rights, please contact us at support@centxo.com."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
