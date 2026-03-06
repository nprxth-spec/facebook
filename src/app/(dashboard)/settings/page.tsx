"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Link2,
  Users,
  CreditCard,
  Palette,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  Shield,
  Globe,
  Clock,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  Check,
  Loader2,
  ReceiptText,
  Sparkles,
  Download,
} from "lucide-react";
import { AddCardDialog } from "@/components/billing/AddCardDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Language } from "@/lib/translations";

interface ManagerAccount { id: string; accountId: string; name: string; platform: string; isActive: boolean }
interface FacebookPage { id: string; pageId: string; name: string; username?: string | null; pageStatus?: string | null; pictureUrl?: string | null; isActive: boolean }
interface FbConnection { id: string; providerAccountId: string; name: string | null; email: string | null; picture: string | null; }

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const ACCENT_COLORS = [
  { id: "blue", label: "น้ำเงิน", cls: "bg-blue-600" },
  { id: "purple", label: "ม่วง", cls: "bg-purple-600" },
  { id: "green", label: "เขียว", cls: "bg-green-600" },
  { id: "orange", label: "ส้ม", cls: "bg-orange-500" },
  { id: "red", label: "แดง", cls: "bg-red-600" },
  { id: "pink", label: "ชมพู", cls: "bg-pink-600" },
];

const getTimezoneLabel = (tz: string) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
    const offsetString = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value;
    if (!offsetString || offsetString === 'GMT') return `${tz.replace(/_/g, ' ')} (UTC)`;

    const offset = offsetString.replace('GMT', ''); // e.g. "+8", "-5", "+05:30"
    const sign = offset[0]; // "+" or "-"
    const rest = offset.substring(1);
    const parts = rest.split(':');
    let hours = parts[0];
    if (hours.length === 1) hours = "0" + hours;
    const minutes = parts.length > 1 ? `:${parts[1]}` : "";

    return `${tz.replace(/_/g, ' ')} (UTC${sign}${hours}${minutes})`;
  } catch {
    return tz.replace(/_/g, ' ');
  }
};

function SettingsContent() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const VALID_TABS = ["account", "connections", "manager-accounts", "facebook-pages", "billing", "preferences", "sessions", "delete"];
  const activeTab = VALID_TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "account";
  const setActiveTab = useCallback((tab: string) => {
    router.push(`/settings?tab=${tab}`, { scroll: false });
  }, [router]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionInfoLoading, setSessionInfoLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ ip: string; userAgent: string } | null>(null);
  const [hasAutoSyncedManagerAccounts, setHasAutoSyncedManagerAccounts] = useState(false);
  const [hasAutoSyncedFacebookPages, setHasAutoSyncedFacebookPages] = useState(false);
  const [justLinkedFacebook, setJustLinkedFacebook] = useState(false);

  // Handle success/error from custom Facebook link OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "linked") {
      toast.success(isThai ? "เชื่อมต่อ Facebook ใหม่เรียบร้อย" : "Facebook account linked successfully");
      setJustLinkedFacebook(true);
      updateSession?.().then(() => {
        router.replace("/settings?tab=manager-accounts");
      }).catch(() => {
        router.replace("/settings?tab=manager-accounts");
      });
    } else if (success === "reconnected") {
      toast.success(isThai ? "อัปเดต Token Facebook เรียบร้อย" : "Facebook token refreshed");
      setJustLinkedFacebook(true);
      updateSession?.().then(() => {
        router.replace("/settings?tab=manager-accounts");
      }).catch(() => {
        router.replace("/settings?tab=manager-accounts");
      });
    } else if (error === "already_linked_to_another_user") {
      toast.error(isThai ? "บัญชี Facebook นี้ถูกเชื่อมต่อกับ User อื่นแล้ว" : "This Facebook account is already linked to another user");
      router.replace("/settings?tab=connections");
    } else if (error) {
      toast.error(isThai ? "ไม่สามารถเชื่อมต่อ Facebook ได้" : "Failed to link Facebook account");
      router.replace("/settings?tab=connections");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasGoogle = connectedProviders.includes("google");
  const hasFacebook = connectedProviders.includes("facebook");

  const {
    theme: globalTheme,
    accentColor: globalAccent,
    language: globalLanguage,
    timezone: globalTimezone,
    setTheme: setGlobalTheme,
    setAccentColor: setGlobalAccent,
    setLanguage: setGlobalLanguage,
    setTimezone: setGlobalTimezone,
  } = useTheme();

  // Preferences (Local state for editing before save)
  const [theme, setTheme] = useState(globalTheme);
  const [accentColor, setAccent] = useState(globalAccent);
  const [language, setLanguage] = useState(globalLanguage);
  const [timezone, setTimezone] = useState(globalTimezone);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Billing overview (Stripe)
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingOverview, setBillingOverview] = useState<{
    customer: { id: string; email: string | null; defaultPaymentMethodId: string | null };
    paymentMethods: { id: string; brand: string | null; last4: string | null; expMonth: number | null; expYear: number | null; name: string | null }[];
    invoices: { id: string; number: string | null; status: string | null; created: number; total: number; currency: string | null; hostedInvoiceUrl: string | null; invoicePdf: string | null }[];
    subscriptions: {
      id: string;
      status: string | null;
      currentPeriodEnd: number;
      cancelAtPeriodEnd: boolean;
      planId: string | null;
      items: {
        id: string;
        priceId: string;
        productId: string | null;
        unitAmount: number | null;
        currency: string | null;
        nickname: string | null;
      }[];
    }[];
  } | null>(null);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("business");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [cancelPlanOpen, setCancelPlanOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const isThai = language === "th";

  useEffect(() => {
    if (activeTab !== "sessions") return;
    setSessionInfoLoading(true);
    fetch("/api/user/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSessionInfo({ ip: data.ip, userAgent: data.userAgent });
        }
      })
      .finally(() => setSessionInfoLoading(false));
  }, [activeTab]);

  const handleSignOutAllSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/user/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed");
      }
      toast.success(
        isThai
          ? "ออกจากระบบจากทุกอุปกรณ์แล้ว"
          : "Signed out from all devices.",
      );
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error(
        isThai
          ? "ออกจากระบบจากทุกอุปกรณ์ไม่สำเร็จ"
          : "Could not sign out from all devices.",
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const billingPlans = [
    {
      id: "free",
      nameTh: "ฟรี",
      nameEn: "Free",
      priceLabelTh: "$0 / 14 วันแรก",
      priceLabelEn: "$0 / first 14 days",
      descriptionTh: "ทดลองใช้งาน Centxo ฟรี 14 วัน พร้อมข้อจำกัดที่เหมาะสำหรับเริ่มต้น",
      descriptionEn: "Try Centxo free for 14 days with starter limits.",
      priceIdEnvKey: null,
      featuresTh: [
        "ทดลองใช้ฟรี 14 วัน",
        "เชื่อมได้ 5 บัญชีโฆษณา · 10 เพจ",
        "ส่งออก /export ได้สูงสุด 100 แถวต่อครั้ง (ไม่มี Auto export)",
        "ส่งออก /export-ads ได้ 50 แถวต่อครั้ง",
        "ใช้ Tools ได้ทุกฟีเจอร์ ยกเว้น AI หาไอเดียกลุ่มเป้าหมาย (มีเครดิต AI จำกัด)",
        "สร้างโฆษณาอัตโนมัติได้ 20 ครั้ง",
      ],
      featuresEn: [
        "Free 14-day trial",
        "Up to 5 ad accounts · 10 pages",
        "Manual /export up to 100 rows per run (no Auto export)",
        "/export-ads up to 50 rows per run",
        "Access all Tools except AI audience ideas (with limited AI credits)",
        "Create auto campaigns up to 20 times",
      ],
      highlight: false,
    },
    {
      id: "pro",
      nameTh: "Pro",
      nameEn: "Pro",
      priceLabelTh: "$19 / เดือน",
      priceLabelEn: "$19 / month",
      descriptionTh: "เหมาะสำหรับฟรีแลนซ์หรือธุรกิจขนาดเล็กที่ต้องส่งออกรายงานเป็นประจำ",
      descriptionEn: "Perfect for freelancers or small teams exporting reports regularly.",
      priceIdEnvKey: "STRIPE_PRICE_PRO",
      featuresTh: [
        "เชื่อมได้ 10 บัญชีโฆษณา · 20 เพจ",
        "ส่งออก /export ได้สูงสุด 500 แถวต่อครั้ง และใช้ Auto export ได้",
        "ส่งออก /export-ads ได้ 200 แถวต่อครั้ง",
        "ใช้ Tools ได้ทุกฟีเจอร์ (ยกเว้น AI หาไอเดียกลุ่มเป้าหมายมีเครดิต AI ต่อเดือน)",
        "สร้างโฆษณาอัตโนมัติได้ 50 ครั้งต่อเดือน",
      ],
      featuresEn: [
        "Up to 10 ad accounts · 20 pages",
        "Manual /export up to 500 rows per run + Auto export enabled",
        "/export-ads up to 200 rows per run",
        "All Tools enabled (AI audience ideas with monthly AI credits)",
        "Create auto campaigns up to 50 times per month",
      ],
      highlight: false,
    },
    {
      id: "business",
      nameTh: "Business",
      nameEn: "Business",
      priceLabelTh: "$39 / เดือน",
      priceLabelEn: "$39 / month",
      descriptionTh: "สำหรับเอเจนซีหรือทีมที่ต้องการใช้ทุกฟีเจอร์แบบจัดเต็ม",
      descriptionEn: "For agencies and teams that need full, high-volume access.",
      priceIdEnvKey: "STRIPE_PRICE_BUSINESS",
      featuresTh: [
        "บัญชีโฆษณา · เพจ · การส่งออก ไม่จำกัดตามการใช้งานปกติ",
        "ส่งออก /export และ /export-ads ได้ไม่จำกัดตามการใช้งานจริง",
        "ใช้ Auto export และทุก Tools รวมถึง AI หาไอเดียกลุ่มเป้าหมาย (เครดิตสูงต่อเดือน)",
        "สร้างโฆษณาอัตโนมัติได้ไม่จำกัดตามการใช้งานปกติ",
      ],
      featuresEn: [
        "Ad accounts, pages, and exports effectively unlimited for normal use",
        "No practical limit on /export and /export-ads for real-world workloads",
        "Full access to Auto export and all Tools including AI audience ideas (high monthly credits)",
        "Create auto campaigns without practical limits for normal use",
      ],
      highlight: true,
    },
  ];

  const formatDate = useCallback(
    (seconds?: number | null) => {
      if (!seconds) return "–";
      try {
        return new Intl.DateTimeFormat(isThai ? "th-TH" : "en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "Asia/Bangkok",
        }).format(new Date(seconds * 1000));
      } catch {
        return new Date(seconds * 1000).toISOString().slice(0, 10);
      }
    },
    [isThai],
  );

  const currentPlan = useMemo(() => {
    if (!billingOverview || !billingOverview.subscriptions?.length) return null;
    const active = billingOverview.subscriptions.find((sub) =>
      ["active", "trialing", "past_due"].includes((sub.status ?? "").toLowerCase()),
    );
    if (!active) return null;
    const firstItem = active.items[0];
    if (!firstItem) return null;
    return {
      status: active.status,
      nickname: firstItem.nickname,
      amount: firstItem.unitAmount,
      currency: firstItem.currency,
      currentPeriodEnd: active.currentPeriodEnd,
      cancelAtPeriodEnd: active.cancelAtPeriodEnd,
      planId: active.planId,
    };
  }, [billingOverview]);

  const currentPlanDisplayName = useMemo(() => {
    if (!currentPlan) return isThai ? "ฟรี" : "Free";
    const planDef = currentPlan.planId
      ? billingPlans.find((p) => p.id === currentPlan.planId)
      : undefined;
    if (planDef) {
      return isThai ? planDef.nameTh : planDef.nameEn;
    }
    if (currentPlan.nickname) return currentPlan.nickname;
    return isThai ? "แพ็กเกจแบบชำระเงิน" : "Paid plan";
  }, [currentPlan, isThai]);

  // Sync with global state when it changes (e.g. on initial load)
  useEffect(() => {
    setTheme(globalTheme);
    setAccent(globalAccent);
    setLanguage(globalLanguage);

    // Auto-detect timezone if not set
    if (!globalTimezone || globalTimezone === "Asia/Bangkok") {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected && detected !== globalTimezone) {
          setTimezone(detected);
          // We don't auto-save to DB here to avoid unprompted saves, but we set it locally
        } else {
          setTimezone(globalTimezone);
        }
      } catch {
        setTimezone(globalTimezone);
      }
    } else {
      setTimezone(globalTimezone);
    }
  }, [globalTheme, globalAccent, globalLanguage, globalTimezone]);

  // helper to load billing overview
  const loadBillingOverview = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/overview");
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to load billing overview");
      }
      setBillingOverview(data);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error
          ? e.message
          : isThai
            ? "โหลดข้อมูล Billing ไม่สำเร็จ"
            : "Failed to load billing overview",
      );
    } finally {
      setBillingLoading(false);
    }
  }, [isThai]);

  // Load billing overview when billing tab is active
  useEffect(() => {
    if (activeTab !== "billing") return;
    loadBillingOverview();
  }, [activeTab, loadBillingOverview]);

  // Load billing overview when billing tab is active
  useEffect(() => {
    if (activeTab !== "billing") return;

    (async () => {
      setBillingLoading(true);
      try {
        const res = await fetch("/api/billing/overview");
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to load billing overview");
        }
        setBillingOverview(data);
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error
            ? e.message
            : isThai
              ? "โหลดข้อมูล Billing ไม่สำเร็จ"
              : "Failed to load billing overview",
        );
      } finally {
        setBillingLoading(false);
      }
    })();
  }, [activeTab, isThai]);

  // Manager accounts
  const [accounts, setAccounts] = useState<ManagerAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsSearch, setAccountsSearch] = useState("");
  const [syncingFbAccounts, setSyncingFbAccounts] = useState(false);
  const [fbStatuses, setFbStatuses] = useState<Record<string, number>>({});
  const [newAccountId, setNewAccountId] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);
  const ACCOUNTS_PER_PAGE = 10;

  // Facebook pages
  const [fbPages, setFbPages] = useState<FacebookPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesSearch, setPagesSearch] = useState("");
  const [syncingPages, setSyncingPages] = useState(false);
  const [pagesPage, setPagesPage] = useState(1);
  const PAGES_PER_PAGE = 10;

  // Facebook connections (Connections tab)
  const [fbConnections, setFbConnections] = useState<FbConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);


  const initials = useMemo(() => {
    if (!session?.user?.name) return "U";
    return session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }, [session?.user?.name]);



  // ดึงบัญชีโฆษณาจาก Facebook แล้ว sync เข้า ManagerAccount (ไม่มีคูลดาวน์ฝั่ง client)
  const syncManagerAccountsFromFacebook = async () => {
    setSyncingFbAccounts(true);
    try {
      const res = await fetch("/api/facebook/ad-accounts?sync=true");
      const data = await res.json();

      // Handle server-side rate limiting (เช่น Facebook API จำกัดเอง)
      if (res.status === 429) {
        const secs = data.secondsLeft ?? 600;
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        toast.info(
          isThai
            ? `ใช้ข้อมูลล่าสุด (ซิงค์ใหม่ได้อีกครั้งใน ${minutes} นาที ${seconds} วินาที)`
            : `Cached data used (Sync again in ${minutes}m ${seconds}s)`
        );
        // reloadManagerAccounts(false); // don't call status check if we are 429ed
        return;
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || "ไม่สามารถดึงบัญชีจาก Facebook ได้");
      }

      const accountsFromFb: { id: string; accountId: string; name: string; status?: number }[] =
        data.accounts ?? [];
      if (!accountsFromFb.length) {
        toast.info("ไม่พบบัญชีโฆษณาใน Facebook");
        return;
      }

      // เก็บสถานะจาก Facebook ไว้ในแผนที่
      const statusMap: Record<string, number> = {};
      for (const acc of accountsFromFb) {
        if (typeof acc.status === "number") {
          statusMap[acc.id] = acc.status;
          statusMap[acc.accountId] = acc.status;
        }
      }
      setFbStatuses(statusMap);

      // สร้าง / อัปเดต ManagerAccount สำหรับทุก account
      await Promise.all(
        accountsFromFb.map((acc) =>
          fetch("/api/manager-accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountId: acc.id,
              name: acc.name,
              platform: "facebook",
            }),
          }).catch(() => null)
        )
      );

      // โหลดรายการที่ sync แล้วกลับมาแสดง
      const after = await fetch("/api/manager-accounts");
      const afterData = await after.json();
      if (Array.isArray(afterData)) {
        setAccounts(afterData);
        setAccountsPage(1);
      }

      localStorage.setItem("lastFbSyncTime", Date.now().toString());
      toast.success("ดึงบัญชีจาก Facebook และอัปเดตเรียบร้อย");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ไม่สามารถดึงบัญชีจาก Facebook ได้");
    } finally {
      setSyncingFbAccounts(false);
      setAccountsLoading(false);
    }
  };

  // Load manager accounts (ดึงจาก DB เท่านั้นตอนเริ่ม)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/manager-accounts");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAccounts(data);
          // ดึงสถานะจาก Facebook มาประกอบการแสดงผล (แบบ Light ไม่ sync)
          if (data.length > 0) {
            try {
              const fbRes = await fetch("/api/facebook/ad-accounts");
              const fbData = await fbRes.json();
              if (fbRes.ok && Array.isArray(fbData.accounts)) {
                const map: Record<string, number> = {};
                fbData.accounts.forEach(
                  (acc: { id: string; accountId: string; status?: number }) => {
                    if (typeof acc.status === "number") {
                      map[acc.id] = acc.status;
                      map[acc.accountId] = acc.status;
                    }
                  }
                );
                setFbStatuses(map);
              }
            } catch { /* ignore */ }
          }
        }
      } catch {
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadManagerAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch("/api/manager-accounts");
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);

      // Check Facebook ad account status
      try {
        const fbRes = await fetch("/api/facebook/ad-accounts");
        const fbData = await fbRes.json();
        if (!fbData.error && Array.isArray(fbData.accounts)) {
          const map: Record<string, number> = {};
          for (const acc of fbData.accounts) {
            if (typeof acc.status === "number") {
              map[acc.id] = acc.status;
              map[acc.accountId] = acc.status;
            }
          }
          setFbStatuses(map);
        }
      } catch {/* ignore */ }
    } catch {
      toast.error("โหลดบัญชีไม่สำเร็จ");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const reloadFacebookPages = useCallback(async () => {
    setPagesLoading(true);
    try {
      const res = await fetch("/api/facebook-pages");
      const data = await res.json();
      if (Array.isArray(data)) setFbPages(data);
    } catch {
      toast.error(isThai ? "โหลดเพจไม่สำเร็จ" : "Failed to load pages");
    } finally {
      setPagesLoading(false);
    }
  }, [isThai]);

  const reloadFbConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await fetch("/api/facebook-connections");
      const data = await res.json();
      if (Array.isArray(data)) setFbConnections(data);
    } catch {
      toast.error(isThai ? "โหลดการเชื่อมต่อ Facebook ไม่สำเร็จ" : "Failed to load Facebook connections");
    } finally {
      setConnectionsLoading(false);
    }
  }, [isThai]);

  const disconnectFacebook = async (id: string) => {
    setDisconnecting(id);
    try {
      const res = await fetch("/api/facebook-connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      setFbConnections((prev) => prev.filter((c) => c.id !== id));
      toast.success(isThai ? "ยกเลิกการเชื่อมต่อ Facebook แล้ว" : "Facebook disconnected");
    } catch {
      toast.error(isThai ? "เกิดข้อผิดพลาด" : "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return; // Wait for session to load

    // Reload data when tab changes
    if (activeTab === "manager-accounts") reloadManagerAccounts();
    if (activeTab === "facebook-pages") reloadFacebookPages();
    if (activeTab === "connections") reloadFbConnections();
  }, [reloadManagerAccounts, reloadFacebookPages, reloadFbConnections, activeTab, session?.user?.id]);
  // Auto-sync Facebook ad accounts once when opening the Manager Accounts tab (หรือเมื่อเพิ่งเชื่อม Facebook จาก OAuth)
  useEffect(() => {
    if (activeTab !== "manager-accounts") return;
    if (hasAutoSyncedManagerAccounts && !justLinkedFacebook) return;
    if (!hasFacebook && !justLinkedFacebook) return;

    setHasAutoSyncedManagerAccounts(true);
    if (justLinkedFacebook) setJustLinkedFacebook(false);
    syncManagerAccountsFromFacebook();
  }, [activeTab, hasFacebook, hasAutoSyncedManagerAccounts, justLinkedFacebook, syncManagerAccountsFromFacebook]);

  // Auto-sync Facebook pages once when opening the Facebook Pages tab
  useEffect(() => {
    if (activeTab !== "facebook-pages") return;
    if (hasAutoSyncedFacebookPages) return;
    if (!hasFacebook) return;

    setHasAutoSyncedFacebookPages(true);
    syncFacebookPages();
  }, [activeTab, hasFacebook, hasAutoSyncedFacebookPages, syncFacebookPages]);

  useEffect(() => {
    setAccountsPage(1);
  }, [accountsSearch]);

  useEffect(() => {
    setPagesPage(1);
  }, [pagesSearch]);

  // Use a generic function to save specific setting types while updating local & global state
  const handlePreferenceChange = async (key: "theme" | "accentColor" | "language" | "timezone", val: string) => {
    // Optimistic UI updates
    if (key === "theme") { setTheme(val as "light" | "dark" | "system"); setGlobalTheme(val as "light" | "dark" | "system"); }
    if (key === "accentColor") { setAccent(val); setGlobalAccent(val); }
    if (key === "language") { setLanguage(val as Language); setGlobalLanguage(val as Language); }
    if (key === "timezone") { setTimezone(val); setGlobalTimezone(val); }

    setPrefsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, accentColor, language, timezone, [key]: val }),
      });
      toast.success(isThai ? "บันทึกการตั้งค่าแล้ว" : "Preferences saved");
    } catch {
      toast.error(isThai ? "เกิดข้อผิดพลาด" : "Error saving preferences");
    } finally {
      setPrefsSaving(false);
    }
  };

  const addManagerAccount = async () => {
    if (!newAccountId.trim() || !newAccountName.trim()) {
      toast.error("กรุณากรอก Account ID และชื่อบัญชี");
      return;
    }
    setAddingAccount(true);
    try {
      const res = await fetch("/api/manager-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: newAccountId, name: newAccountName, platform: "facebook" }),
      });
      const acc = await res.json();
      setAccounts((p) => [acc, ...p]);
      setNewAccountId("");
      setNewAccountName("");
      toast.success("เพิ่มบัญชีโฆษณาแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setAddingAccount(false);
    }
  };

  const toggleAccount = async (acc: ManagerAccount) => {
    const originalState = acc.isActive;
    const newState = !originalState;

    // Optimistic Update
    setAccounts((p) =>
      p.map((a) => (a.id === acc.id ? { ...a, isActive: newState } : a))
    );

    try {
      const res = await fetch("/api/manager-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: acc.id, isActive: newState }),
      });

      if (!res.ok) {
        throw new Error("Failed to update account");
      }

      const updated = await res.json();
      // Ensure local state is in sync with server response
      setAccounts((p) =>
        p.map((a) => (a.id === acc.id ? updated : a))
      );
    } catch (error) {
      // Revert if failed
      setAccounts((p) =>
        p.map((a) => (a.id === acc.id ? { ...a, isActive: originalState } : a))
      );
      toast.error(isThai ? "บันทึกการตั้งค่าไม่สำเร็จ" : "Failed to toggle account");
    }
  };

  const toggleFacebookPage = async (page: FacebookPage) => {
    const originalState = page.isActive;
    const newState = !originalState;

    setFbPages((p) => p.map((a) => (a.id === page.id ? { ...a, isActive: newState } : a)));

    try {
      const res = await fetch("/api/facebook-pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: page.id, isActive: newState }),
      });
      if (!res.ok) throw new Error("Failed to update page");
      const updated = await res.json();
      setFbPages((p) => p.map((a) => (a.id === page.id ? updated : a)));
    } catch (error) {
      setFbPages((p) => p.map((a) => (a.id === page.id ? { ...a, isActive: originalState } : a)));
      toast.error(isThai ? "บันทึกการตั้งค่าไม่สำเร็จ" : "Failed to toggle page");
    }
  };

  async function syncFacebookPages() {
    setSyncingPages(true);
    try {
      const res = await fetch("/api/facebook/pages?sync=true");
      const data = await res.json();

      // Handle server-side rate limiting
      if (res.status === 429) {
        const secs = data.secondsLeft ?? 600;
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        toast.info(
          isThai
            ? `ใช้ข้อมูลล่าสุด (ซิงค์ใหม่ได้อีกครั้งใน ${minutes} นาที ${seconds} วินาที)`
            : `Cached data used (Sync again in ${minutes}m ${seconds}s)`
        );
        reloadFacebookPages();
        return;
      }

      if (!res.ok || data.error) throw new Error(data.error || "Failed to fetch pages");

      const pagesFromFb: { id: string; name: string; username?: string | null; pageStatus?: string | null; pictureUrl?: string | null }[] = data.pages ?? [];
      if (!pagesFromFb.length) {
        toast.info(isThai ? "ไม่พบเพจใน Facebook" : "No pages found on Facebook");
        return;
      }

      await Promise.all(
        pagesFromFb.map((page) =>
          fetch("/api/facebook-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageId: page.id, name: page.name, username: page.username, pageStatus: page.pageStatus, pictureUrl: page.pictureUrl }),
          }).catch(() => null)
        )
      );

      await reloadFacebookPages();
      toast.success(isThai ? "ดึงเพจจาก Facebook เรียบร้อย" : "Pages synced successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to sync pages");
    } finally {
      setSyncingPages(false);
    }
  }

  const deleteAccount = async (id: string) => {
    await fetch("/api/manager-accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAccounts((p) => p.filter((a) => a.id !== id));
    toast.success("ลบบัญชีแล้ว");
  };

  const handleDeleteUser = async () => {
    if (deleteConfirm !== "ลบบัญชี") { toast.error("กรุณาพิมพ์ 'ลบบัญชี' เพื่อยืนยัน"); return; }
    try {
      await fetch("/api/user/delete", { method: "DELETE" });
      signOut({ callbackUrl: "/" });
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const tabs = [
    { id: "account", label: isThai ? "บัญชี" : "Account", icon: User },
    { id: "connections", label: isThai ? "การเชื่อมต่อ" : "Connections", icon: Link2 },
    { id: "manager-accounts", label: isThai ? "บัญชีโฆษณา" : "Ad accounts", icon: Users },
    { id: "facebook-pages", label: isThai ? "เพจเฟซบุ๊ก" : "Facebook Pages", icon: Globe },
    { id: "billing", label: isThai ? "การชำระเงิน" : "Billing", icon: CreditCard },
    { id: "preferences", label: isThai ? "การแสดงผล" : "Display", icon: Palette },
    { id: "sessions", label: isThai ? "เซสชัน" : "Sessions", icon: Clock },
  ];

  const themeOptions = [
    { id: "light", labelTh: "สว่าง", labelEn: "Light", icon: Sun },
    { id: "dark", labelTh: "มืด", labelEn: "Dark", icon: Moon },
    { id: "system", labelTh: "ตามระบบ", labelEn: "System", icon: Monitor },
  ] as const;

  const filteredAccounts = useMemo(() => {
    if (!accountsSearch.trim()) return accounts;
    const q = accountsSearch.toLowerCase();
    return accounts.filter((acc) =>
      acc.name.toLowerCase().includes(q) ||
      acc.accountId.toLowerCase().includes(q)
    );
  }, [accounts, accountsSearch]);

  const getAccountStatusLabel = (acc: ManagerAccount) => {
    const code = fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
    switch (code) {
      case 1:
        return isThai ? "ใช้งานได้" : "Active";
      case 2:
        return isThai ? "ถูกปิดใช้งาน" : "Disabled";
      case 3:
        return isThai ? "มีปัญหาการชำระเงิน" : "Unsettled";
      case 7:
        return isThai ? "กำลังจะปิด" : "Pending closure";
      case 9:
        return isThai ? "ช่วงผ่อนผัน" : "In grace period";
      default:
        return isThai ? "ไม่ทราบสถานะ" : "Unknown";
    }
  };

  const getAccountStatusVariant = (acc: ManagerAccount): "success" | "secondary" | "destructive" => {
    const code = fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
    if (code === 1) return "success";
    if (code === 2 || code === 7 || code === 3) return "destructive";
    // code 9 (In grace period) and others use secondary, but we'll tint it blue via className
    return "secondary";
  };

  return (
    <div className="mx-auto max-w-[1200px] flex flex-col gap-6 py-8 px-4 sm:px-6 lg:px-10">
      <Card className="shadow-sm min-h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
        <CardHeader className="pb-4 shrink-0">
          <CardTitle className="text-2xl">
            {isThai ? "ตั้งค่า" : "Settings"}
          </CardTitle>
          <CardDescription className="text-sm">
            {isThai
              ? "จัดการบัญชีและการตั้งค่าทั้งหมด"
              : "Manage your account and all preferences."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex-1 overflow-hidden">
          <div className="flex h-full flex-col lg:flex-row gap-6 overflow-hidden">
            {/* Sidebar (menu) */}
            <div className="lg:w-52 shrink-0 lg:pr-4 lg:border-r lg:border-gray-200 dark:lg:border-gray-800">
              <nav className="space-y-1">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer",
                      activeTab === t.id
                        ? "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    )}
                  >
                    <t.icon className="w-4 h-4 shrink-0" />
                    {t.label}
                  </button>
                ))}
                <Separator className="my-1 mx-2 bg-gray-100 dark:bg-gray-700" />
                <button
                  onClick={() => setActiveTab("delete")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer",
                    activeTab === "delete"
                      ? "bg-primary/5 text-primary dark:bg-primary/20 dark:text-primary"
                      : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  )}
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  {isThai ? "ลบบัญชี" : "Delete Account"}
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-6 overflow-y-auto pr-1 pb-2 lg:pl-2">
              {/* Account */}
              {activeTab === "account" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai ? "ตั้งค่าบัญชี" : "Account settings"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai ? "ข้อมูลโปรไฟล์ของคุณ" : "Your profile information."}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={session?.user?.image ?? ""} />
                      <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {session?.user?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session?.user?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isThai
                          ? "รูปโปรไฟล์จากบัญชีที่เชื่อมต่อ"
                          : "Profile picture comes from your connected account."}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>ชื่อ</Label>
                      <Input defaultValue={session?.user?.name ?? ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>อีเมล</Label>
                      <Input
                        defaultValue={session?.user?.email ?? ""}
                        disabled
                        className="opacity-60"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      toast.success(isThai ? "อัปเดตข้อมูลแล้ว" : "Profile updated")
                    }
                  >
                    {isThai ? "บันทึก" : "Save"}
                  </Button>
                </section>
              )}

              {/* Sessions */}
              {activeTab === "sessions" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai ? "จัดการเซสชัน" : "Session management"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai
                        ? "ออกจากระบบจากอุปกรณ์อื่นทั้งหมด หากสงสัยว่าบัญชีอาจถูกใช้งานโดยไม่ได้รับอนุญาต"
                        : "Sign out from all other devices if you suspect unauthorized access."}
                    </p>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {isThai ? "เซสชันปัจจุบัน" : "Current session"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {isThai
                          ? "ข้อมูลนี้อ้างอิงจาก IP และเบราว์เซอร์ที่คุณใช้งานอยู่ตอนนี้"
                          : "Based on the IP and browser of your current request."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {sessionInfoLoading ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isThai ? "กำลังโหลดรายละเอียดเซสชัน..." : "Loading session details..."}
                        </div>
                      ) : sessionInfo ? (
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                          <p>
                            <span className="font-medium">
                              {isThai ? "ที่อยู่ IP:" : "IP address:"}
                            </span>{" "}
                            <span className="font-mono">{sessionInfo.ip}</span>
                          </p>
                          <p className="break-all">
                            <span className="font-medium">
                              {isThai ? "เบราว์เซอร์ / อุปกรณ์:" : "Browser / device:"}
                            </span>{" "}
                            <span>{sessionInfo.userAgent}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isThai
                            ? "ไม่พบข้อมูลเซสชันปัจจุบัน"
                            : "No current session information available."}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-amber-200/70 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30">
                    <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {isThai
                              ? "ออกจากระบบจากทุกอุปกรณ์"
                              : "Sign out from all devices"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {isThai
                              ? "คำสั่งนี้จะลบเซสชันทั้งหมดของคุณออกจากเซิร์ฟเวอร์ จากนั้นระบบจะพาคุณไปหน้าเข้าสู่ระบบใหม่"
                              : "This will remove all of your active sessions on the server and then return you to the login page."}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={handleSignOutAllSessions}
                        disabled={sessionsLoading}
                      >
                        {sessionsLoading && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {isThai
                          ? "ออกจากระบบจากทุกอุปกรณ์"
                          : "Sign out everywhere"}
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Connections */}
              {activeTab === "connections" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai ? "ตั้งค่าการเชื่อมต่อ" : "Connection settings"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai
                        ? "จัดการบัญชี Google และ Facebook ที่เชื่อมต่อ"
                        : "Manage your connected Google and Facebook accounts."}
                    </p>
                  </div>

                  {/* Google Row */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                        <GoogleIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Google</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {hasGoogle
                            ? isThai ? "เชื่อมต่อแล้ว — ใช้สำหรับ Google Sheets" : "Connected — used for Google Sheets"
                            : isThai ? "ยังไม่ได้เชื่อมต่อ" : "Not connected yet"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasGoogle ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isThai ? "เชื่อมต่อแล้ว" : "Connected"}
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => signIn("google", { callbackUrl: "/settings?tab=connections" })}>
                          {isThai ? "เชื่อมต่อ" : "Connect"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Facebook Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                          <FacebookIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Facebook</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isThai
                              ? `เชื่อมต่ออยู่ ${fbConnections.length} บัญชี`
                              : `${fbConnections.length} account${fbConnections.length !== 1 ? 's' : ''} connected`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs gap-1.5 bg-white text-[#1877F2] border-blue-200 hover:bg-blue-50 dark:bg-transparent dark:text-[#9ec5ff] dark:border-blue-800 dark:hover:bg-blue-950/40"
                        onClick={() => { window.location.href = "/api/auth/link-facebook"; }}
                      >
                        <Plus className="w-3 h-3" />
                        {isThai ? "เพิ่มบัญชี Facebook" : "Add Facebook Account"}
                      </Button>
                    </div>

                    {/* Connected Facebook Accounts Table */}
                    {connectionsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      </div>
                    ) : fbConnections.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <FacebookIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isThai ? "ยังไม่ได้เชื่อมต่อ Facebook" : "No Facebook accounts connected"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {isThai ? "กดปุ่ม \"เพิ่มบัญชี Facebook\" เพื่อเริ่มต้น" : "Click \"Add Facebook Account\" to get started"}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "บัญชี Facebook" : "Facebook Account"}
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "อีเมล" : "Email"}
                              </th>

                              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "จัดการ" : "Actions"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {fbConnections.map((conn) => (
                              <tr key={conn.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="relative w-8 h-8 shrink-0">
                                      {conn.picture ? (
                                        <img src={conn.picture} alt={conn.name ?? ""} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center text-[#1877F2] text-xs font-bold">
                                          {(conn.name ?? "F").charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1877F2] flex items-center justify-center border border-white dark:border-gray-900">
                                        <FacebookIcon className="w-2 h-2 text-white" />
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{conn.name ?? "—"}</p>
                                      <p className="text-xs text-gray-400 font-mono">{conn.providerAccountId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                  {conn.email ?? "—"}
                                </td>

                                <td className="px-4 py-2 text-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    disabled={disconnecting === conn.id}
                                    onClick={() => disconnectFacebook(conn.id)}
                                  >
                                    {disconnecting === conn.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <X className="w-3 h-3" />
                                    )}
                                    <span className="ml-1">{isThai ? "ยกเลิก" : "Disconnect"}</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20 dark:border-primary/30">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-primary dark:text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-primary dark:text-primary">
                        {isThai
                          ? "Token ถูกเก็บอย่างปลอดภัยในฐานข้อมูล ใช้เพื่อดึงข้อมูลโฆษณาและส่งออกเท่านั้น"
                          : "Tokens are securely stored in the database and used only to fetch and export ad data."}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Manager Accounts */}
              {activeTab === "manager-accounts" && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai
                        ? "บัญชีโฆษณา (Manager Accounts)"
                        : "Ad accounts (Manager Accounts)"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai
                        ? "เลือกบัญชีโฆษณา Facebook ที่ต้องการใช้ในระบบ"
                        : "Select which Facebook ad accounts to use in the system."}
                    </p>
                  </div>
                  {/* Toolbar: search + actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="w-full sm:max-w-xs">
                      <Input
                        placeholder={isThai ? "ค้นหาตามชื่อหรือ Account ID..." : "Search by name or Account ID..."}
                        value={accountsSearch}
                        onChange={(e) => setAccountsSearch(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={reloadManagerAccounts}
                        disabled={accountsLoading}
                      >
                        <Loader2
                          className={cn(
                            "w-3 h-3 mr-1 text-gray-500",
                            accountsLoading && "animate-spin"
                          )}
                        />
                        {isThai ? "รีเฟรช" : "Refresh"}
                      </Button>
                    </div>
                  </div>

                  {accountsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {accountsSearch.trim()
                          ? isThai
                            ? "ไม่พบบัญชีที่ตรงกับคำค้นหา"
                            : "No accounts match your search."
                          : isThai
                            ? "ยังไม่มีบัญชีโฆษณา"
                            : "No ad accounts yet."}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isThai
                          ? "กำลังดึงบัญชีโฆษณาจาก Facebook อัตโนมัติ หากไม่มีบัญชี แสดงว่าไม่มีสิทธิ์ในบัญชีโฆษณาใด ๆ"
                          : "Ad accounts are fetched automatically from Facebook. If nothing appears, this user may not have access to any ad accounts."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "บัญชี" : "Account"}
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "บัญชีโฆษณา" : "Account ID"}
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "สถานะ" : "Status"}
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {isThai ? "การใช้งาน" : "Active"}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAccounts
                              .slice(
                                (accountsPage - 1) * ACCOUNTS_PER_PAGE,
                                accountsPage * ACCOUNTS_PER_PAGE
                              )
                              .map((acc) => (
                                <tr
                                  key={acc.id}
                                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                                >
                                  <td className="px-4 py-1.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                        <FacebookIcon className="w-4 h-4 text-[#1877F2]" />
                                      </div>
                                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {acc.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-1.5">
                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                      {acc.accountId}
                                    </span>
                                  </td>
                                  <td className="px-4 py-1.5 text-center">
                                    {(() => {
                                      const code = fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
                                      const label = getAccountStatusLabel(acc);

                                      if (code === 1) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 font-medium mx-auto">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                            {label}
                                          </span>
                                        );
                                      }
                                      if (code === 2 || code === 7 || code === 3) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 font-medium mx-auto">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            {label}
                                          </span>
                                        );
                                      }
                                      if (code === 9) {
                                        return (
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs px-2 py-0.5 font-medium mx-auto">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                            {label}
                                          </span>
                                        );
                                      }
                                      return (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 font-medium mx-auto border border-gray-100 dark:border-gray-700">
                                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                          {label}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-4 py-1.5 text-center">
                                    <Switch
                                      className="scale-75 data-[state=checked]:bg-green-500"
                                      checked={acc.isActive}
                                      onCheckedChange={() => toggleAccount(acc)}
                                    />
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {filteredAccounts.length > ACCOUNTS_PER_PAGE && (
                        <div className="flex items-center justify-between pt-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isThai ? "แสดง" : "Showing"}{" "}
                            {(accountsPage - 1) * ACCOUNTS_PER_PAGE + 1}–
                            {Math.min(accountsPage * ACCOUNTS_PER_PAGE, filteredAccounts.length)}{" "}
                            {isThai ? "จาก" : "of"} {filteredAccounts.length}{" "}
                            {isThai ? "บัญชี" : "accounts"}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={accountsPage === 1}
                              onClick={() => setAccountsPage((p) => Math.max(1, p - 1))}
                            >
                              {isThai ? "ก่อนหน้า" : "Previous"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={accountsPage * ACCOUNTS_PER_PAGE >= filteredAccounts.length}
                              onClick={() =>
                                setAccountsPage((p) =>
                                  p * ACCOUNTS_PER_PAGE >= filteredAccounts.length ? p : p + 1
                                )
                              }
                            >
                              {isThai ? "ถัดไป" : "Next"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              {/* Billing */}
              {activeTab === "billing" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai ? "ตั้งค่าการชำระเงิน" : "Billing settings"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai
                        ? "จัดการแพ็กเกจ ระบบตัดบัตร และดูประวัติบิลผ่าน Stripe"
                        : "Manage your plan, cards and invoices via Stripe."}
                    </p>
                  </div>

                  <Tabs defaultValue="plan" className="mt-4">
                    <TabsList className="flex gap-4 w-auto h-auto bg-transparent p-0 rounded-none justify-start border-b border-gray-200 dark:border-gray-800">
                      <TabsTrigger
                        value="plan"
                        className="w-28 text-sm px-0 pb-1 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-medium justify-center"
                      >
                        {isThai ? "แผนปัจจุบัน" : "Current plan"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="methods"
                        className="w-28 text-sm px-0 pb-1 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-medium justify-center"
                      >
                        {isThai ? "วิธีการชำระเงิน" : "Payment methods"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="invoices"
                        className="w-28 text-sm px-0 pb-1 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-medium justify-center"
                      >
                        {isThai ? "ประวัติการชำระเงิน" : "Payment history"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="auto-renew"
                        className="w-32 text-sm px-0 pb-1 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary font-medium justify-center"
                      >
                        {isThai ? "การต่ออายุอัตโนมัติ" : "Auto-renew"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="cancel"
                        className="w-32 text-sm px-0 pb-1 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 font-medium justify-center"
                      >
                        {isThai ? "ยกเลิกแพ็กเกจ" : "Cancel plan"}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="plan" className="mt-3 space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm opacity-80">
                            {isThai ? "แผนปัจจุบัน" : "Current plan"}
                          </p>
                          <p className="text-xl font-bold mt-0.5">
                            {currentPlan ? currentPlanDisplayName : isThai ? "ฟรี" : "Free"}
                          </p>
                          <p className="text-sm opacity-80 mt-1">
                            {currentPlan ? (
                              isThai ? (
                                <>ตัดบัตรอัตโนมัติทุกเดือนผ่าน Stripe</>
                              ) : (
                                <>Billed automatically every month via Stripe.</>
                              )
                            ) : isThai ? (
                              <>ส่งออกได้ 100 แถว/เดือน — อัปเกรดเป็น Pro เพื่อปลดล็อกไม่จำกัด</>
                            ) : (
                              <>Export up to 100 rows/month — upgrade to Pro for unlimited usage.</>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <CreditCard className="w-10 h-10 opacity-40" />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white text-primary hover:bg-slate-100"
                            onClick={() => setUpgradeOpen(true)}
                          >
                            {isThai ? "อัปเกรดแพ็กเกจ" : "Upgrade plan"}
                          </Button>
                        </div>
                      </div>

                      {currentPlan && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/40">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {isThai ? "สถานะแพ็กเกจ" : "Plan status"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {isThai
                                ? currentPlan.status === "active"
                                  ? "ใช้งานอยู่"
                                  : currentPlan.status === "trialing"
                                    ? "กำลังทดลองใช้"
                                    : "สถานะอื่นๆ"
                                : currentPlan.status}
                            </p>
                          </div>
                          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/40">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {isThai ? "ต่ออายุรอบถัดไป" : "Renews on"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatDate(currentPlan.currentPeriodEnd)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/40">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {isThai ? "ราคา/เดือน" : "Price / month"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {currentPlan.amount
                                ? `${(currentPlan.amount / 100).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} ${currentPlan.currency?.toUpperCase() ?? ""}`
                                : isThai
                                  ? "–"
                                  : "–"}
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="methods" className="mt-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            {isThai ? "วิธีการชำระเงิน" : "Payment methods"}
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-3 text-sm"
                            onClick={() => setAddCardOpen(true)}
                          >
                            {isThai ? "เพิ่มบัตร" : "Add card"}
                          </Button>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          {billingLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                          ) : !billingOverview || billingOverview.paymentMethods.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              {isThai
                                ? "ยังไม่มีบัตรที่บันทึกไว้"
                                : "No saved payment methods yet."}
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                                <tr>
                                  <th className="px-4 py-2 text-left">{isThai ? "บัตร" : "Card"}</th>
                                  <th className="pl-2 pr-4 py-2 text-left">{isThai ? "หมดอายุ" : "Expires"}</th>
                                  <th className="px-4 py-2 text-center">{isThai ? "ค่าเริ่มต้น" : "Default"}</th>
                                  <th className="px-4 py-2 text-center">{isThai ? "จัดการ" : "Actions"}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {billingOverview.paymentMethods.map((pm) => {
                                  const isDefault =
                                    billingOverview.customer.defaultPaymentMethodId === pm.id;
                                  const brand = (pm.brand ?? "card").toLowerCase();
                                  const isVisa = brand === "visa";
                                  const isMastercard =
                                    brand === "mastercard" || brand === "master card" || brand === "mc";
                                  const displayBrand = isVisa
                                    ? "Visa"
                                    : isMastercard
                                      ? "Mastercard"
                                      : (pm.brand ?? "Card");
                                  const masked =
                                    pm.last4 && pm.last4.length === 4
                                      ? `•••• •••• •••• ${pm.last4}`
                                      : "•••• •••• •••• ••••";

                                  return (
                                    <tr
                                      key={pm.id}
                                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                                    >
                                      <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center justify-center w-9 h-5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden">
                                            {isVisa ? (
                                              <Image
                                                src="/visa.svg"
                                                alt="Visa"
                                                width={32}
                                                height={20}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : isMastercard ? (
                                              <Image
                                                src="/mastercard.svg"
                                                alt="Mastercard"
                                                width={32}
                                                height={20}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-[8px] font-semibold text-gray-700 dark:text-gray-100">
                                                {displayBrand[0]}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                              {displayBrand}
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-mono tracking-wide">
                                              {masked}
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="pl-2 pr-4 py-2 text-xs text-gray-600 dark:text-gray-300">
                                        {pm.expMonth && pm.expYear
                                          ? `${pm.expMonth.toString().padStart(2, "0")}/${pm.expYear
                                              .toString()
                                              .slice(-2)}`
                                          : "—"}
                                      </td>
                                      <td className="px-4 py-2 text-center text-sm">
                                        {isDefault ? (
                                          <Badge variant="success" className="text-[12px] px-2 py-0 font-normal">
                                            {isThai ? "ใช้งานอยู่" : "Default"}
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="secondary"
                                            className="text-[12px] px-2 py-0 font-normal"
                                          >
                                            {isThai ? "สำรอง" : "Secondary"}
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              className="h-7 w-7 text-xs"
                                            >
                                              ...
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-40 text-xs">
                                            <DropdownMenuItem
                                              disabled={isDefault}
                                              onClick={async () => {
                                                try {
                                                  const res = await fetch(
                                                    "/api/billing/payment-methods/default",
                                                    {
                                                      method: "POST",
                                                      headers: {
                                                        "Content-Type": "application/json",
                                                      },
                                                      body: JSON.stringify({
                                                        paymentMethodId: pm.id,
                                                      }),
                                                    },
                                                  );
                                                  const data = await res.json();
                                                  if (!res.ok || data.error) {
                                                    throw new Error(
                                                      data.error ||
                                                        "Failed to update default payment method",
                                                    );
                                                  }
                                                  toast.success(
                                                    isThai
                                                      ? "ตั้งเป็นบัตรหลักเรียบร้อย"
                                                      : "Default card updated",
                                                  );
                                                  await loadBillingOverview();
                                                } catch (e) {
                                                  toast.error(
                                                    e instanceof Error
                                                      ? e.message
                                                      : isThai
                                                        ? "ตั้งบัตรหลักไม่สำเร็จ"
                                                        : "Failed to update default card",
                                                  );
                                                }
                                              }}
                                            >
                                              {isThai ? "ตั้งเป็นบัตรหลัก" : "Set as default"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              disabled={isDefault}
                                              onClick={async () => {
                                                if (
                                                  !window.confirm(
                                                    isThai
                                                      ? "ต้องการลบบัตรใบนี้หรือไม่?"
                                                      : "Remove this card?",
                                                  )
                                                ) {
                                                  return;
                                                }
                                                try {
                                                  const res = await fetch(
                                                    `/api/billing/payment-methods/${pm.id}`,
                                                    { method: "DELETE" },
                                                  );
                                                  const data = await res.json();
                                                  if (!res.ok || data.error) {
                                                    throw new Error(
                                                      data.error ||
                                                        "Failed to remove payment method",
                                                    );
                                                  }
                                                  toast.success(
                                                    isThai
                                                      ? "ลบบัตรเรียบร้อย"
                                                      : "Card removed successfully",
                                                  );
                                                  await loadBillingOverview();
                                                } catch (e) {
                                                  toast.error(
                                                    e instanceof Error
                                                      ? e.message
                                                      : isThai
                                                        ? "ลบบัตรไม่สำเร็จ"
                                                        : "Failed to remove card",
                                                  );
                                                }
                                              }}
                                            >
                                              {isThai ? "ลบบัตรนี้" : "Remove card"}
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="invoices" className="mt-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ReceiptText className="w-4 h-4 text-primary" />
                            {isThai ? "ประวัติการชำระเงิน" : "Payment history"}
                          </h3>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          {billingLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                          ) : !billingOverview || billingOverview.invoices.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              {isThai ? "ยังไม่มีบิล" : "No invoices yet."}
                            </div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
                                <tr>
                                  <th className="px-3 py-2 text-left">
                                    {isThai ? "เลขบิล" : "Invoice"}
                                  </th>
                                  <th className="px-3 py-2 text-left">
                                    {isThai ? "วันที่" : "Date"}
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    {isThai ? "ยอดรวม" : "Total"}
                                  </th>
                                  <th className="px-3 py-2 text-center">
                                    {isThai ? "สถานะ" : "Status"}
                                  </th>
                                  <th className="px-3 py-2 text-center">
                                    {isThai ? "ดาวน์โหลด" : "Download"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {billingOverview.invoices.map((inv) => {
                                  const amount = (inv.total ?? 0) / 100;
                                  return (
                                    <tr
                                      key={inv.id}
                                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                                    >
                                      <td className="px-3 py-1.5 font-mono text-sm text-gray-700 dark:text-gray-200">
                                        {inv.number ?? inv.id}
                                      </td>
                                  <td className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300">
                                        {formatDate(inv.created)}
                                      </td>
                                      <td className="px-3 py-1.5 text-sm text-right text-gray-900 dark:text-gray-100">
                                        {amount.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        {inv.currency?.toUpperCase() ?? ""}
                                      </td>
                                      <td className="px-3 py-1.5 text-center text-sm">
                                        {inv.status === "paid" ? (
                                          <Badge
                                            variant="success"
                                            className="text-[12px] px-2 py-0 align-middle font-normal"
                                          >
                                            {isThai ? "ชำระแล้ว" : "Paid"}
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="secondary"
                                            className="text-[12px] px-2 py-0 align-middle font-normal"
                                          >
                                            {inv.status ?? "open"}
                                          </Badge>
                                        )}
                                      </td>
                                      <td className="px-3 py-1.5 text-center">
                                        {inv.invoicePdf || inv.hostedInvoiceUrl ? (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => {
                                              const url = inv.invoicePdf ?? inv.hostedInvoiceUrl!;
                                              window.open(url, "_blank");
                                            }}
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </Button>
                                        ) : (
                                          <span className="text-[11px] text-gray-400">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="auto-renew" className="mt-3">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              {isThai ? "การต่ออายุอัตโนมัติของแพ็กเกจ" : "Plan auto-renew settings"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {isThai
                                ? "เลือกว่าจะให้ระบบตัดบัตรต่ออายุแพ็กเกจให้อัตโนมัติเมื่อถึงรอบถัดไปหรือไม่"
                                : "Choose whether your plan should auto-renew at the end of each billing period."}
                            </p>
                          </div>
                        </div>
                        {!currentPlan ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isThai
                              ? "ขณะนี้คุณยังไม่มีแพ็กเกจแบบชำระเงิน แผนปัจจุบันคือแผนฟรี"
                              : "You don't have an active paid subscription; you're currently on the free plan."}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {currentPlan.nickname ??
                                    (isThai ? "แพ็กเกจแบบชำระเงิน" : "Paid plan")}
                                </p>
                                {currentPlan.currentPeriodEnd != null && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {isThai
                                      ? `รอบปัจจุบันสิ้นสุดวันที่ ${formatDate(
                                          currentPlan.currentPeriodEnd,
                                        )}`
                                      : `Current period ends on ${formatDate(
                                          currentPlan.currentPeriodEnd,
                                        )}`}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                  {isThai ? "ต่ออายุอัตโนมัติ" : "Auto-renew"}
                                </span>
                                <Switch
                                  checked={!currentPlan.cancelAtPeriodEnd}
                                  disabled={billingLoading}
                                  onCheckedChange={async (value) => {
                                    try {
                                      const res = await fetch("/api/billing/auto-renew", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ enabled: value }),
                                      });
                                      const data = await res.json();
                                      if (!res.ok || data.error) {
                                        throw new Error(
                                          data.error || "Failed to update auto-renew",
                                        );
                                      }
                                      toast.success(
                                        value
                                          ? isThai
                                            ? "เปิดการต่ออายุอัตโนมัติแล้ว"
                                            : "Auto-renew enabled"
                                          : isThai
                                          ? "ปิดการต่ออายุอัตโนมัติแล้ว"
                                          : "Auto-renew disabled",
                                      );
                                      await loadBillingOverview();
                                    } catch (e) {
                                      toast.error(
                                        e instanceof Error
                                          ? e.message
                                          : isThai
                                            ? "อัปเดตการต่ออายุอัตโนมัติไม่สำเร็จ"
                                            : "Failed to update auto-renew",
                                      );
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {(!currentPlan.cancelAtPeriodEnd
                                ? isThai
                                  ? "เมื่อเปิดไว้ ระบบจะตัดบัตรหลักของคุณโดยอัตโนมัติเมื่อถึงรอบถัดไป"
                                  : "When enabled, your default card will be charged automatically on each renewal."
                                : isThai
                                  ? "เมื่อปิดไว้ แพ็กเกจจะไม่ต่ออายุอัตโนมัติ และจะหมดอายุเมื่อสิ้นสุดรอบปัจจุบัน"
                                  : "When disabled, your plan will not renew and will end at the end of the current period."
                              )}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {isThai
                                ? "หมายเหตุ: การตั้งค่านี้มีผลกับ subscription ปัจจุบันทั้งหมดของคุณ"
                                : "Note: This setting applies to all of your current subscriptions."}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="cancel" className="mt-3">
                      <div className="border border-red-200 dark:border-red-900/60 rounded-xl p-4 bg-red-50/60 dark:bg-red-900/20 space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {isThai ? "ยกเลิกแพ็กเกจแบบชำระเงิน" : "Cancel paid plan"}
                          </h3>
                          <p className="mt-1 text-xs text-red-700/80 dark:text-red-200/80">
                            {isThai
                              ? "ระบบจะยกเลิกการต่ออายุอัตโนมัติของทุกแพ็กเกจ และคุณจะยังใช้งานได้จนจบรอบบิลปัจจุบัน"
                              : "We’ll turn off auto-renew for all subscriptions. You can keep using your plan until the end of the current billing period."}
                          </p>
                        </div>

                        {!currentPlan ? (
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {isThai
                              ? "ขณะนี้คุณยังไม่มีแพ็กเกจแบบชำระเงิน แผนปัจจุบันคือแผนฟรี จึงไม่มีอะไรให้ยกเลิก"
                              : "You don't have an active paid subscription; you're currently on the free plan, so there's nothing to cancel."}
                          </p>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1">
                              <p>
                                {isThai
                                  ? "แพ็กเกจปัจจุบัน:"
                                  : "Current plan:"}{" "}
                                <span className="font-semibold">
                                  {currentPlanDisplayName}
                                </span>
                              </p>
                              <p>
                                {isThai
                                  ? "วันหมดอายุรอบบิลปัจจุบัน:"
                                  : "Current period ends on:"}{" "}
                                <span className="font-semibold">
                                  {formatDate(currentPlan.currentPeriodEnd)}
                                </span>
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
                              onClick={() => setCancelPlanOpen(true)}
                              disabled={billingLoading}
                            >
                              {isThai ? "ยืนยันการยกเลิกแพ็กเกจ" : "Confirm cancel plan"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <AddCardDialog
                    open={addCardOpen}
                    onOpenChange={setAddCardOpen}
                    isThai={isThai}
                    onCardAdded={loadBillingOverview}
                  />

                  {/* Cancel plan dialog */}
                  <Dialog open={cancelPlanOpen} onOpenChange={setCancelPlanOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600 dark:text-red-400">
                          {isThai ? "ยืนยันการยกเลิกแพ็กเกจ" : "Confirm plan cancellation"}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                          {isThai ? (
                            <>
                              ระบบจะ{" "}
                              <span className="font-semibold text-red-600 dark:text-red-300">
                                ยกเลิกแพ็กเกจแบบชำระเงินทั้งหมดทันที
                              </span>{" "}
                              และจะไม่ตัดบัตรอีกต่อไป หากต้องการใช้งานต่อ คุณสามารถสมัครแพ็กเกจใหม่ได้ทุกเมื่อ
                            </>
                          ) : (
                            <>
                              We will{" "}
                              <span className="font-semibold text-red-600 dark:text-red-300">
                                immediately cancel all paid subscriptions
                              </span>{" "}
                              and stop all future charges. You can subscribe again at any time
                              if you want to resume.
                            </>
                          )}
                        </DialogDescription>
                      </DialogHeader>

                      <DialogFooter className="gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setCancelPlanOpen(false)}
                          disabled={cancelSubmitting}
                        >
                          {isThai ? "ย้อนกลับ" : "Back"}
                        </Button>
                        <Button
                          variant="destructive"
                          type="button"
                          disabled={cancelSubmitting}
                          onClick={async () => {
                            setCancelSubmitting(true);
                            try {
                              const res = await fetch("/api/billing/cancel", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                              });
                              const data = await res.json();
                              if (!res.ok || data.error) {
                                throw new Error(
                                  data.error || "Failed to cancel subscription",
                                );
                              }
                              toast.success(
                                isThai
                                  ? "ยกเลิกแพ็กเกจแบบชำระเงินเรียบร้อยแล้ว"
                                  : "Paid plan cancelled successfully.",
                              );
                              setCancelPlanOpen(false);
                              await loadBillingOverview();
                            } catch (e) {
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : isThai
                                    ? "ยกเลิกแพ็กเกจไม่สำเร็จ"
                                    : "Failed to cancel plan",
                              );
                            } finally {
                              setCancelSubmitting(false);
                            }
                          }}
                        >
                          {cancelSubmitting
                            ? isThai
                              ? "กำลังยกเลิก..."
                              : "Cancelling..."
                            : isThai
                              ? "ยืนยันการยกเลิกแพ็กเกจ"
                              : "Confirm cancel plan"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Upgrade dialog: เลือกแพ็กเกจ + บัตรที่ใช้ตัดเงิน */}
                  <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          {isThai ? "อัปเกรดแพ็กเกจ" : "Upgrade your plan"}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                          {isThai
                            ? "เลือกแพ็กเกจที่ต้องการ และเลือกบัตรที่ใช้ตัดเงิน ระบบจะชำระผ่าน Stripe โดยอัตโนมัติ"
                            : "Choose a plan and a saved card. We’ll charge it securely via Stripe."}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* Plan selection */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {isThai ? "เลือกแพ็กเกจ" : "Choose a plan"}
                          </p>
                          <div className="space-y-3">
                            {billingPlans.map((plan) => {
                              const name = isThai ? plan.nameTh : plan.nameEn;
                              const price = isThai ? plan.priceLabelTh : plan.priceLabelEn;
                              const desc = isThai ? plan.descriptionTh : plan.descriptionEn;
                              const features = isThai ? plan.featuresTh : plan.featuresEn;
                              const selected = selectedPlanId === plan.id;
                              return (
                                <button
                                  key={plan.id}
                                  type="button"
                                  onClick={() => setSelectedPlanId(plan.id)}
                                  className={cn(
                                    "w-full text-left border rounded-xl px-3 py-3 text-sm transition-all",
                                    selected
                                      ? "border-primary bg-primary/5 dark:bg-primary/20"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500",
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        {name}
                                      </span>
                                      {plan.highlight && (
                                        <Badge className="text-[10px] px-2 py-0">
                                          {isThai ? "ยอดนิยม" : "Popular"}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      {price}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {desc}
                                  </p>
                                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                    {features.slice(0, 3).map((f) => (
                                      <li key={f} className="flex items-center gap-1.5">
                                        <Check className="w-3 h-3 text-green-500" />
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Payment method selection */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {isThai ? "เลือกบัตรที่ใช้ชำระ" : "Choose payment method"}
                          </p>
                          {billingLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            </div>
                          ) : !billingOverview || billingOverview.paymentMethods.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {isThai
                                ? "ยังไม่มีบัตรในระบบ กรุณาเพิ่มบัตรก่อน"
                                : "No cards available. Please add a card first."}
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                              {billingOverview.paymentMethods.map((pm) => {
                                const label = `${(pm.brand ?? "card").toUpperCase()} •••• ${
                                  pm.last4 ?? "----"
                                }`;
                                const displayId = pm.id;
                                const isSelected = selectedPaymentMethodId
                                  ? selectedPaymentMethodId === displayId
                                  : billingOverview.customer.defaultPaymentMethodId === displayId;
                                return (
                                  <button
                                    key={pm.id}
                                    type="button"
                                    onClick={() => setSelectedPaymentMethodId(displayId)}
                                    className={cn(
                                      "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] sm:text-xs transition-colors",
                                      isSelected
                                        ? "border-primary bg-primary/5 dark:bg-primary/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500",
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "flex items-center justify-center w-4 h-4 rounded-full border",
                                          isSelected
                                            ? "border-primary bg-primary/10"
                                            : "border-gray-300 bg-transparent",
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "w-2 h-2 rounded-full",
                                            isSelected ? "bg-primary" : "bg-transparent",
                                          )}
                                        />
                                      </span>
                                      <span className="text-gray-800 dark:text-gray-100">
                                        {label}
                                      </span>
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-300">
                                      {pm.expMonth && pm.expYear
                                        ? `${pm.expMonth.toString().padStart(2, "0")}/${pm.expYear
                                            .toString()
                                            .slice(-2)}`
                                        : ""}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setUpgradeOpen(false)}
                          disabled={upgradeSubmitting}
                        >
                          {isThai ? "ปิด" : "Close"}
                        </Button>
                        <Button
                          disabled={
                            upgradeSubmitting ||
                            !billingOverview ||
                            billingOverview.paymentMethods.length === 0 ||
                            !selectedPlanId
                          }
                          onClick={async () => {
                            if (!billingOverview) return;
                            const plan = billingPlans.find((p) => p.id === selectedPlanId);
                            if (!plan) return;

                            const pmId =
                              selectedPaymentMethodId ||
                              billingOverview.customer.defaultPaymentMethodId ||
                              billingOverview.paymentMethods[0]?.id;
                            if (!pmId) {
                              toast.error(
                                isThai
                                  ? "ยังไม่มีบัตรสำหรับตัดเงิน"
                                  : "No payment method available",
                              );
                              return;
                            }

                            setUpgradeSubmitting(true);
                            try {
                              const res = await fetch("/api/billing/subscribe", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ planId: plan.id, paymentMethodId: pmId }),
                              });
                              const data = await res.json();
                              if (!res.ok || data.error) {
                                throw new Error(data.error || "Failed to create subscription");
                              }
                              toast.success(
                                isThai
                                  ? "อัปเกรดแพ็กเกจสำเร็จ"
                                  : "Subscription created successfully",
                              );
                              await loadBillingOverview();
                              setUpgradeOpen(false);
                            } catch (e) {
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : isThai
                                    ? "อัปเกรดไม่สำเร็จ"
                                    : "Failed to upgrade subscription",
                              );
                            } finally {
                              setUpgradeSubmitting(false);
                            }
                          }}
                        >
                          {upgradeSubmitting
                            ? isThai
                              ? "กำลังยืนยัน..."
                              : "Confirming..."
                            : isThai
                              ? "ยืนยันการอัปเกรด"
                              : "Confirm upgrade"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </section>
              )}

              {/* Facebook Pages */}
              {activeTab === "facebook-pages" && (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai
                        ? "เพจเฟซบุ๊ก (Facebook Pages)"
                        : "Facebook Pages"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai
                        ? "เลือกเพจ Facebook ที่จะนำมาดึง Engagement สร้าง Audience"
                        : "Select which Facebook pages to use for Custom Audiences."}
                    </p>
                    {syncingPages && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {isThai
                          ? "กำลังดึงข้อมูลล่าสุดจาก Facebook..."
                          : "Syncing latest data from Facebook..."}
                      </p>
                    )}
                  </div>
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="w-full sm:max-w-xs">
                      <Input
                        placeholder={isThai ? "ค้นหาชื่อเพจ หรือ Page ID..." : "Search by name or Page ID..."}
                        value={pagesSearch}
                        onChange={(e) => setPagesSearch(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={reloadFacebookPages}
                        disabled={pagesLoading}
                      >
                        <Loader2 className={cn("w-3 h-3 mr-1 text-gray-500", pagesLoading && "animate-spin")} />
                        {isThai ? "รีเฟรช" : "Refresh"}
                      </Button>
                    </div>
                  </div>

                  {pagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : fbPages.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isThai ? "ยังไม่มีเพจในระบบ" : "No pages yet."}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isThai
                          ? "กำลังดึงเพจจาก Facebook อัตโนมัติ หากไม่มีเพจ แสดงว่าไม่มีสิทธิ์ในเพจใด ๆ"
                          : "Pages are fetched automatically from Facebook. If nothing appears, this user may not have access to any pages."}
                      </p>
                    </div>
                  ) : (() => {
                    const filteredPages = fbPages.filter(
                      p => p.name.toLowerCase().includes(pagesSearch.toLowerCase()) || p.pageId.includes(pagesSearch) || (p.username ?? "").toLowerCase().includes(pagesSearch.toLowerCase())
                    );
                    const totalPagePages = Math.ceil(filteredPages.length / PAGES_PER_PAGE);
                    const pagedPages = filteredPages.slice((pagesPage - 1) * PAGES_PER_PAGE, pagesPage * PAGES_PER_PAGE);
                    return (
                      <>
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/60">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {isThai ? "ชื่อเพจ" : "Page"}
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  Username
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {isThai ? "เพจ ID" : "Page ID"}
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {isThai ? "สถานะ" : "Status"}
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                  {isThai ? "การใช้งาน" : "Active"}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagedPages.map((page) => (
                                <tr
                                  key={page.id}
                                  className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                                >
                                  {/* Page Name + Profile Pic */}
                                  <td className="px-4 py-1.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative w-8 h-8 shrink-0">
                                        <img
                                          src={page.pictureUrl || `https://graph.facebook.com/${page.pageId}/picture?type=square`}
                                          alt={page.name}
                                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-gray-100"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = "none";
                                            const fallback = img.nextElementSibling as HTMLElement | null;
                                            if (fallback) fallback.style.display = "flex";
                                          }}
                                        />
                                        <div
                                          className="w-8 h-8 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/30 items-center justify-center text-[#1877F2] text-xs font-bold hidden"
                                          aria-hidden
                                        >
                                          {page.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1877F2] flex items-center justify-center border border-white dark:border-gray-900">
                                          <FacebookIcon className="w-2 h-2 text-white" />
                                        </span>
                                      </div>
                                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">{page.name}</span>
                                    </div>
                                  </td>
                                  {/* Username */}
                                  <td className="px-4 py-1.5 text-gray-500 dark:text-gray-400 text-xs">
                                    {page.username ? (
                                      <span className="font-mono">@{page.username}</span>
                                    ) : (
                                      <span className="text-gray-300 dark:text-gray-600">—</span>
                                    )}
                                  </td>
                                  {/* Page ID */}
                                  <td className="px-4 py-1.5 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                    {page.pageId}
                                  </td>
                                  {/* Status */}
                                  <td className="px-4 py-1.5">
                                    {page.pageStatus === "PUBLISHED" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                        {isThai ? "เผยแพร่" : "Published"}
                                      </span>
                                    ) : page.pageStatus === "UNPUBLISHED" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-0.5 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                                        {isThai ? "ไม่ได้เผยแพร่" : "Unpublished"}
                                      </span>
                                    ) : page.pageStatus ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5">
                                        {page.pageStatus}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                                    )}
                                  </td>
                                  {/* Toggle */}
                                  <td className="px-4 py-1.5 text-center">
                                    <Switch className="scale-75 data-[state=checked]:bg-green-500" checked={page.isActive} onCheckedChange={() => toggleFacebookPage(page)} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Pagination */}
                        {filteredPages.length > PAGES_PER_PAGE && (
                          <div className="flex items-center justify-between pt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {isThai ? "แสดง" : "Showing"}{" "}
                              {(pagesPage - 1) * PAGES_PER_PAGE + 1}–
                              {Math.min(pagesPage * PAGES_PER_PAGE, filteredPages.length)}{" "}
                              {isThai ? "จาก" : "of"} {filteredPages.length}{" "}
                              {isThai ? "เพจ" : "pages"}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline" size="sm" className="h-7 px-2 text-xs"
                                disabled={pagesPage === 1}
                                onClick={() => setPagesPage(p => Math.max(1, p - 1))}
                              >
                                {isThai ? "ก่อนหน้า" : "Previous"}
                              </Button>
                              <span className="text-xs text-gray-500 px-1">{pagesPage} / {totalPagePages}</span>
                              <Button
                                variant="outline" size="sm" className="h-7 px-2 text-xs"
                                disabled={pagesPage >= totalPagePages}
                                onClick={() => setPagesPage(p => Math.min(totalPagePages, p + 1))}
                              >
                                {isThai ? "ถัดไป" : "Next"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>
              )}

              {/* Preferences */}
              {activeTab === "preferences" && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {isThai ? "การแสดงผลและภาษา" : "Display & language"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isThai
                        ? "ปรับธีม สี ภาษา และไทม์โซน"
                        : "Adjust theme, accent color, language and timezone."}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label>{isThai ? "ธีม" : "Theme"}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {themeOptions.map((t) => (
                        <button
                          key={t.id}
                          disabled={prefsSaving}
                          onClick={() => handlePreferenceChange("theme", t.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                            theme === t.id
                              ? "border-primary bg-primary/5 dark:bg-primary/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          )}
                        >
                          <t.icon
                            className={cn(
                              "w-5 h-5",
                              theme === t.id ? "text-primary" : "text-gray-500"
                            )}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {isThai ? t.labelTh : t.labelEn}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>{isThai ? "สีธีมหลัก" : "Accent color"}</Label>
                    <div className="flex gap-2 flex-wrap pt-2">
                      {ACCENT_COLORS.map((c) => (
                        <button key={c.id} disabled={prefsSaving} onClick={() => handlePreferenceChange("accentColor", c.id)} title={c.label}
                          className={cn("w-8 h-8 rounded-full relative transition-all", c.cls, accentColor === c.id && "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 shadow-lg scale-110")}>
                          {accentColor === c.id && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <Label className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        {isThai ? "ภาษา" : "Language"}
                      </Label>
                      <Select
                        value={language}
                        disabled={prefsSaving}
                        onValueChange={(val) => handlePreferenceChange("language", val)}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          side="bottom"
                          className="max-h-[300px]"
                        >
                          <SelectItem value="th">
                            <div className="flex items-center gap-2">
                              <img
                                src="https://flagcdn.com/w20/th.png"
                                srcSet="https://flagcdn.com/w40/th.png 2x"
                                width="20"
                                alt="TH"
                                className="rounded-sm"
                              />
                              ภาษาไทย
                            </div>
                          </SelectItem>
                          <SelectItem value="en">
                            <div className="flex items-center gap-2">
                              <img
                                src="https://flagcdn.com/w20/us.png"
                                srcSet="https://flagcdn.com/w40/us.png 2x"
                                width="20"
                                alt="US"
                                className="rounded-sm"
                              />
                              English
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <Label className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {isThai ? "ไทม์โซน" : "Timezone"}
                      </Label>
                      <Select
                        value={timezone}
                        disabled={prefsSaving}
                        onValueChange={(val) => handlePreferenceChange("timezone", val)}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                          <SelectValue placeholder="Select Timezone" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          side="bottom"
                          className="max-h-[300px]"
                        >
                          {Intl.supportedValuesOf("timeZone").map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {getTimezoneLabel(tz)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              )
              }

              {/* Delete */}
              {
                activeTab === "delete" && (
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {isThai ? "ลบบัญชี" : "Delete account"}
                      </h2>
                      <p className="text-sm text-red-500 dark:text-red-300">
                        {isThai
                          ? "การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                          : "This action cannot be undone."}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                          {isThai ? (
                            <>
                              <li>• ข้อมูลทั้งหมดจะถูกลบถาวร</li>
                              <li>• การตั้งค่าการส่งออกทั้งหมดจะหายไป</li>
                              <li>• ประวัติการส่งออกจะหายไป</li>
                              <li>• การเชื่อมต่อ Google และ Facebook จะถูกยกเลิก</li>
                            </>
                          ) : (
                            <>
                              <li>• All of your data will be permanently deleted.</li>
                              <li>• All export settings will be lost.</li>
                              <li>• Export history will be removed.</li>
                              <li>• Google and Facebook connections will be revoked.</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isThai ? "ลบบัญชีทั้งหมด" : "Delete entire account"}
                    </Button>
                  </section>
                )}
            </div>
          </div>
        </CardContent>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">
                {isThai ? "ยืนยันการลบบัญชี" : "Confirm account deletion"}
              </DialogTitle>
              <DialogDescription>
                {isThai ? (
                  <>
                    พิมพ์{" "}
                    <strong className="text-gray-900 dark:text-gray-100">
                      ลบบัญชี
                    </strong>{" "}
                    เพื่อยืนยัน
                  </>
                ) : (
                  "Type ลบบัญชี to confirm."
                )}
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder={
                isThai ? "พิมพ์ 'ลบบัญชี' เพื่อยืนยัน" : "Type 'ลบบัญชี' to confirm"
              }
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                {isThai ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleteConfirm !== "ลบบัญชี"}
              >
                {isThai ? "ลบบัญชีถาวร" : "Delete permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div >
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">กำลังโหลด...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
