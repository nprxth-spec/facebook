export type PlanId = "free" | "pro" | "business";

export interface PlanLimits {
  maxAccounts: number | null; // null = ไม่จำกัด
  maxPages: number | null;
  maxExportRows: number | null; // /export manual
  maxExportAdsRows: number | null; // /export-ads
  allowAutoExport: boolean;
  maxCreateAds: number | null;
  aiCreditsPerMonth: number; // สำหรับ Pro/Business
  aiCreditsTrialTotal: number; // สำหรับ Free trial เท่านั้น
}

export interface BillingPlanConfig extends PlanLimits {
  id: PlanId;
  nameTh: string;
  nameEn: string;
  priceUsd: number;
}

export const BILLING_PLANS: Record<PlanId, BillingPlanConfig> = {
  free: {
    id: "free",
    nameTh: "ฟรี",
    nameEn: "Free",
    priceUsd: 0,
    maxAccounts: 5,
    maxPages: 10,
    maxExportRows: 100,
    maxExportAdsRows: 50,
    allowAutoExport: false,
    maxCreateAds: 20,
    // เครดิต AI รวมในช่วงทดลอง 14 วัน
    aiCreditsPerMonth: 0,
    aiCreditsTrialTotal: 10,
  },
  pro: {
    id: "pro",
    nameTh: "Pro",
    nameEn: "Pro",
    priceUsd: 19,
    maxAccounts: 10,
    maxPages: 20,
    maxExportRows: 500,
    maxExportAdsRows: 200,
    allowAutoExport: true,
    maxCreateAds: 50,
    aiCreditsPerMonth: 100,
    aiCreditsTrialTotal: 0,
  },
  business: {
    id: "business",
    nameTh: "Business",
    nameEn: "Business",
    priceUsd: 39,
    maxAccounts: null,
    maxPages: null,
    maxExportRows: null,
    maxExportAdsRows: null,
    allowAutoExport: true,
    maxCreateAds: null,
    aiCreditsPerMonth: 300,
    aiCreditsTrialTotal: 0,
  },
};

export function getPlanConfig(planId: string | null | undefined): BillingPlanConfig {
  if (planId === "pro" || planId === "business" || planId === "free") {
    return BILLING_PLANS[planId];
  }
  return BILLING_PLANS.free;
}

