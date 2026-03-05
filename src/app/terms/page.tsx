"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function TermsPage() {
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
            {isThai ? "เงื่อนไขการใช้งาน" : "Terms of Service"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">Last updated: March 2, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "1. ข้อตกลงในการใช้งาน" : "1. Agreement to Terms"}
            </h2>
            <p>
              {isThai
                ? "เมื่อคุณเข้าถึงหรือใช้งานแพลตฟอร์ม Centxo (\"บริการ\") ถือว่าคุณยอมรับและตกลงปฏิบัติตามเงื่อนไขการใช้งานฉบับนี้ หากคุณไม่ยอมรับเงื่อนไขใด ๆ กรุณาหยุดใช้งานบริการทันที"
                : "By accessing or using the Centxo platform (\"Service\"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "2. คำอธิบายบริการ" : "2. Service Description"}
            </h2>
            <p>
              {isThai
                ? "Centxo เป็นเครื่องมือช่วยจัดการโฆษณา Facebook Ads และการส่งออกข้อมูลไปยัง Google Sheets โดยอาจประกอบด้วยฟีเจอร์ เช่น:"
                : "Centxo provides Facebook advertisement management tools and export to Google Sheets, including but not limited to:"}
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>{isThai ? "สร้างและจัดการแคมเปญโฆษณา" : "Campaign creation and management"}</li>
              <li>{isThai ? "ช่วยปรับแต่งโฆษณาโดยอัตโนมัติ" : "Automated ad optimization"}</li>
              <li>{isThai ? "รายงานผลและวิเคราะห์ข้อมูล" : "Analytics and reporting"}</li>
              <li>{isThai ? "รองรับหลายบัญชีโฆษณา" : "Multi-account management"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "3. บัญชีผู้ใช้และความปลอดภัย" : "3. Account & Security"}
            </h2>
            <p>
              {isThai
                ? "คุณมีหน้าที่รับผิดชอบในการเก็บรักษาข้อมูลบัญชีของคุณ (รวมถึงโทเคนที่ใช้เชื่อมต่อกับ Facebook / Google) ให้ปลอดภัย และรับผิดชอบต่อทุกการใช้งานที่เกิดขึ้นภายใต้บัญชีของคุณ หากพบความผิดปกติ คุณควรแจ้งเราโดยทันที"
                : "You are responsible for maintaining the confidentiality of your account credentials (including Facebook and Google tokens) and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "4. นโยบายแพลตฟอร์มของ Facebook" : "4. Facebook Platform Policies"}
            </h2>
            <p>
              {isThai
                ? "บริการของเราทำงานร่วมกับแพลตฟอร์มโฆษณา Meta/Facebook คุณตกลงที่จะปฏิบัติตามข้อกำหนดและนโยบายทั้งหมดของ Facebook รวมถึง Facebook Advertising Policies และ Centxo ไม่รับผิดชอบต่อการระงับหรือแบนบัญชีโฆษณาใด ๆ จากทาง Meta"
                : "Our Service interacts with the Meta/Facebook Advertising Platform. You agree to comply with all applicable Facebook Terms and Policies, including the Facebook Advertising Policies. We are not responsible for any ad account bans or restrictions imposed by Meta."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "5. เงื่อนไขของ Google" : "5. Google Terms"}
            </h2>
            <p>
              {isThai
                ? "บริการของเราเชื่อมต่อกับ Google API Services (เช่น Google Sheets API) การใช้งาน Centxo ถือว่าคุณยอมรับเงื่อนไขการให้บริการของ Google ด้วย"
                : "Our Service interacts with Google API Services. By using the Service, you imply agreement to be bound by Google's Terms of Service."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "6. การสมัครใช้งานแบบชำระเงิน" : "6. Subscription & Payments"}
            </h2>
            <p>
              {isThai
                ? "บางฟีเจอร์ของบริการอาจต้องสมัครแพ็กเกจแบบชำระเงิน คุณตกลงที่จะกรอกข้อมูลการชำระเงินที่ถูกต้อง และยินยอมให้มีการตัดบัตรตามรอบบิล เงื่อนไขการคืนเงิน (ถ้ามี) จะแจ้งไว้แยกต่างหาก"
                : "Some features of the Service may require a paid subscription. You agree to provide accurate billing information and authorize us to charge your chosen payment method. Refunds, if any, are subject to our Refund Policy."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "7. การใช้ข้อมูล" : "7. Data Usage"}
            </h2>
            <p>
              {isThai
                ? "เราจะเก็บและใช้ข้อมูลตามที่ระบุไว้ในนโยบายความเป็นส่วนตัวของเรา การใช้งานบริการถือว่าคุณยินยอมตามนโยบายดังกล่าว"
                : "We collect and use data as described in our Privacy Policy. By using the Service, you consent to such collection and usage."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "8. การจำกัดความรับผิด" : "8. Limitation of Liability"}
            </h2>
            <p>
              {isThai
                ? "Centxo จะไม่รับผิดชอบต่อความเสียหายทางอ้อม ทางพิเศษ หรือผลสืบเนื่องใด ๆ เช่น การสูญเสียกำไร ข้อมูล หรือโอกาสทางธุรกิจที่เกิดจากการใช้งานบริการของเรา"
                : "Centxo shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service."}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mt-8 mb-3">
              {isThai ? "9. การติดต่อเรา" : "9. Contact Us"}
            </h2>
            <p>
              {isThai
                ? "หากคุณมีคำถามเกี่ยวกับเงื่อนไขการใช้งาน สามารถติดต่อเราได้ที่ support@centxo.com"
                : "If you have any questions about these Terms, please contact us at support@centxo.com."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
