"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, Sparkles, Shield, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/providers/ThemeProvider";
import { toast } from "sonner";

interface Plan {
  id: string;
  nameTh: string;
  nameEn: string;
  priceLabelTh: string;
  priceLabelEn: string;
  descriptionTh: string;
  descriptionEn: string;
  priceIdEnvKey: string; // STRIPE_PRICE_PRO, STRIPE_PRICE_BUSINESS, ...
  featuresTh: string[];
  featuresEn: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "pro",
    nameTh: "Pro",
    nameEn: "Pro",
    priceLabelTh: "฿499 / เดือน",
    priceLabelEn: "฿499 / month",
    descriptionTh: "เหมาะสำหรับผู้ยิงโฆษณาหลายบัญชีที่ต้องส่งออกรายงานประจำ",
    descriptionEn: "Perfect for freelancers or small teams that export reports regularly.",
    priceIdEnvKey: "STRIPE_PRICE_PRO",
    featuresTh: [
      "ส่งออกไม่จำกัดต่อเดือน",
      "รองรับ 10 บัญชีโฆษณา",
      "ตั้งส่งออกอัตโนมัติ (Auto-export)",
      "การสนับสนุนแบบ Priority",
    ],
    featuresEn: [
      "Unlimited exports per month",
      "Up to 10 ad accounts",
      "Auto-export schedules",
      "Priority support",
    ],
    highlight: false,
  },
  {
    id: "business",
    nameTh: "Business",
    nameEn: "Business",
    priceLabelTh: "฿1,299 / เดือน",
    priceLabelEn: "฿1,299 / month",
    descriptionTh: "สำหรับเอเจนซีหรือทีมขนาดใหญ่ที่ต้องการความยืดหยุ่นสูงสุด",
    descriptionEn: "For agencies and larger teams that need maximum flexibility.",
    priceIdEnvKey: "STRIPE_PRICE_BUSINESS",
    featuresTh: [
      "ทุกอย่างในแผน Pro",
      "จำนวนบัญชีโฆษณาไม่จำกัด",
      "Priority queue ในการประมวลผล Export",
      "ที่ปรึกษาด้านการตั้งค่าฟรีเดือนละ 1 ครั้ง",
    ],
    featuresEn: [
      "Everything in Pro",
      "Unlimited ad accounts",
      "Priority export queue",
      "Monthly configuration review call",
    ],
    highlight: true,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { language } = useTheme();
  const isThai = language === "th";
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    if (loadingPlanId) return;
    setLoadingPlanId(plan.id);
    try {
      // allow overriding price per plan via env, else fall back to STRIPE_DEFAULT_PRICE_ID
      const envPriceId =
        (process.env[plan.priceIdEnvKey as keyof NodeJS.ProcessEnv] as string | undefined) ??
        process.env.STRIPE_DEFAULT_PRICE_ID;

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: envPriceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to start checkout");
      }
      window.location.href = data.url as string;
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : isThai
            ? "ไม่สามารถเริ่มการอัปเกรดแพ็กเกจได้"
            : "Unable to start upgrade checkout",
      );
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-1"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            {isThai ? "กลับไปยังการตั้งค่า" : "Back to settings"}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isThai ? "อัปเกรดแพ็กเกจ Centxo" : "Upgrade your Centxo plan"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isThai
              ? "เลือกแพ็กเกจที่เหมาะกับปริมาณงานและจำนวนบัญชีโฆษณาของคุณ สามารถยกเลิกหรือปรับเปลี่ยนได้ทุกเมื่อ"
              : "Choose the plan that fits your export volume and number of ad accounts. You can change or cancel at any time."}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>{isThai ? "ชำระเงินปลอดภัยด้วย Stripe" : "Secure billing via Stripe"}</span>
          </div>
          <span>{isThai ? "รองรับบัตรเครดิต / เดบิต หลัก ๆ" : "All major credit / debit cards"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        {PLANS.map((plan) => {
          const features = isThai ? plan.featuresTh : plan.featuresEn;
          const name = isThai ? plan.nameTh : plan.nameEn;
          const priceLabel = isThai ? plan.priceLabelTh : plan.priceLabelEn;
          const description = isThai ? plan.descriptionTh : plan.descriptionEn;

          return (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? "border-primary shadow-md shadow-primary/10 relative overflow-hidden"
                  : "border-gray-200 dark:border-gray-700"
              }
            >
              {plan.highlight && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-indigo-500" />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {name}
                      {plan.highlight && (
                        <Badge className="text-[10px] px-2 py-0.5" variant="secondary">
                          {isThai ? "ยอดนิยม" : "Most popular"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
                      {description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {priceLabel}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {isThai ? "ตัดบัตรรายเดือน ยกเลิกได้ทุกเมื่อ" : "Billed monthly, cancel anytime"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between items-center">
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    {isThai
                      ? "เรียกเก็บผ่าน Stripe สามารถออกใบเสร็จภาษีได้ตามข้อมูลบัญชีของคุณ"
                      : "Charged via Stripe, receipts available in your billing history."}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="px-4"
                  onClick={() => handleUpgrade(plan)}
                  disabled={!!loadingPlanId}
                >
                  {loadingPlanId === plan.id
                    ? isThai
                      ? "กำลังไปหน้า Stripe..."
                      : "Redirecting to Stripe..."
                    : isThai
                      ? "เลือกแพ็กเกจนี้"
                      : "Choose this plan"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

