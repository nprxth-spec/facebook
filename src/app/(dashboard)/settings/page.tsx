"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Link2, Users, CreditCard, Palette, Trash2, CheckCircle2, Plus, X,
  Shield, Globe, Clock, Sun, Moon, Monitor, AlertTriangle, Check, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Language } from "@/lib/translations";

interface ManagerAccount { id: string; accountId: string; name: string; platform: string; isActive: boolean }
interface FacebookPage { id: string; pageId: string; name: string; username?: string | null; pageStatus?: string | null; pictureUrl?: string | null; isActive: boolean }

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
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const VALID_TABS = ["account", "connections", "manager-accounts", "facebook-pages", "billing", "preferences", "delete"];
  const activeTab = VALID_TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "account";
  const setActiveTab = useCallback((tab: string) => {
    router.push(`/settings?tab=${tab}`, { scroll: false });
  }, [router]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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

  const isThai = language === "th";

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


  const initials = useMemo(() => {
    if (!session?.user?.name) return "U";
    return session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }, [session?.user?.name]);



  // ดึงบัญชีโฆษณาจาก Facebook แล้ว sync เข้า ManagerAccount
  const syncManagerAccountsFromFacebook = async () => {
    // 10-minute rate limit (600,000 ms)
    const lastSyncStr = localStorage.getItem("lastFbSyncTime");
    if (lastSyncStr) {
      const lastSync = parseInt(lastSyncStr, 10);
      const now = Date.now();
      const timeElapsed = now - lastSync;
      const timeRemaining = 600000 - timeElapsed;

      if (timeRemaining > 0) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        toast.info(
          isThai
            ? `ใช้ข้อมูลล่าสุด (ซิงค์ใหม่ได้อีกครั้งใน ${minutes} นาที ${seconds} วินาที)`
            : `Cached data used (Can sync again in ${minutes}m ${seconds}s)`
        );
        reloadManagerAccounts();
        return;
      }
    }

    setSyncingFbAccounts(true);
    try {
      const res = await fetch("/api/facebook/ad-accounts");
      const data = await res.json();
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

  // Load manager accounts (และถ้าไม่มีเลย ให้ลอง sync จาก Facebook อัตโนมัติหนึ่งครั้ง)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/manager-accounts");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
          // ดึงสถานะจาก Facebook มาประกอบการแสดงผล
          try {
            const fbRes = await fetch("/api/facebook/ad-accounts");
            const fbData = await fbRes.json();
            if (!fbData.error && Array.isArray(fbData.accounts)) {
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
          } catch {
            // แค่ดึงสถานะไม่ได้ ไม่ต้องขว้าง error ต่อ
          }
        } else {
          // ถ้ายังไม่มีบัญชีเลย ลองดึงจาก Facebook มาเติมให้
          await syncManagerAccountsFromFacebook();
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

  useEffect(() => {
    if (!session?.user?.id) return; // Wait for session to load

    // Reload data when tab changes
    if (activeTab === "manager-accounts") reloadManagerAccounts();
    if (activeTab === "facebook-pages") reloadFacebookPages();
  }, [reloadManagerAccounts, reloadFacebookPages, activeTab, session?.user?.id]);

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

  const syncFacebookPages = async () => {
    // 10-minute rate limit (600,000 ms) — same as Manager Accounts
    const lastSyncStr = localStorage.getItem("lastFbPagesSyncTime");
    if (lastSyncStr) {
      const lastSync = parseInt(lastSyncStr, 10);
      const timeRemaining = 600000 - (Date.now() - lastSync);
      if (timeRemaining > 0) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        toast.info(
          isThai
            ? `ใช้ข้อมูลล่าสุด (ซิงค์ใหม่ได้อีกครั้งใน ${minutes} นาที ${seconds} วินาที)`
            : `Cached data used (Can sync again in ${minutes}m ${seconds}s)`
        );
        reloadFacebookPages();
        return;
      }
    }

    setSyncingPages(true);
    try {
      const res = await fetch("/api/facebook/pages");
      const data = await res.json();
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

      localStorage.setItem("lastFbPagesSyncTime", Date.now().toString());
      await reloadFacebookPages();
      toast.success(isThai ? "ดึงเพจจาก Facebook เรียบร้อย" : "Pages synced successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to sync pages");
    } finally {
      setSyncingPages(false);
    }
  };

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
  ];

  const billingPlans = [
    {
      name: "Pro",
      price: "฿499",
      features: isThai
        ? ["ส่งออกไม่จำกัด", "10 บัญชีโฆษณา", "ส่งออกอัตโนมัติ", "Priority Support"]
        : ["Unlimited exports", "10 ad accounts", "Automated exports", "Priority support"],
      highlight: false,
    },
    {
      name: "Business",
      price: "฿1,299",
      features: isThai
        ? ["ทุกอย่างใน Pro", "ไม่จำกัดบัญชีโฆษณา", "API Access", "Dedicated Support"]
        : ["Everything in Pro", "Unlimited ad accounts", "API access", "Dedicated support"],
      highlight: true,
    },
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
    <div className="max-w-5xl mx-auto px-4 lg:px-0">
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

              {/* Connections */}
              {activeTab === "connections" && (
                <section className="space-y-4">
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
                  {[
                    {
                      key: "google",
                      label: "Google",
                      desc: hasGoogle
                        ? isThai
                          ? "เชื่อมต่อแล้ว — ใช้สำหรับ Google Sheets"
                          : "Connected — used for Google Sheets"
                        : isThai
                          ? "ยังไม่ได้เชื่อมต่อ"
                          : "Not connected yet",
                      connected: hasGoogle, icon: <GoogleIcon className="w-5 h-5" />, bg: "bg-gray-50 dark:bg-gray-700",
                    },
                    {
                      key: "facebook",
                      label: "Facebook",
                      desc: hasFacebook
                        ? isThai
                          ? "เชื่อมต่อแล้ว — ใช้สำหรับดึงข้อมูลโฆษณา"
                          : "Connected — used to fetch ad data"
                        : isThai
                          ? "ยังไม่ได้เชื่อมต่อ"
                          : "Not connected yet",
                      connected: hasFacebook, icon: <FacebookIcon className="w-5 h-5" />, bg: "bg-primary/10 dark:bg-primary/20",
                    },
                  ].map((p) => (
                    <div key={p.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          p.key === "facebook" ? "bg-blue-50 dark:bg-blue-900/10" : p.bg
                        )}>{p.icon}</div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{p.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.connected
                          ? (
                            <div className="flex items-center gap-2">
                              {p.key === "facebook" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => signIn("facebook", { callbackUrl: "/settings?tab=connections" })}
                                >
                                  {isThai ? "เชื่อมต่ออีกครั้ง" : "Reconnect"}
                                </Button>
                              )}
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {isThai ? "เชื่อมต่อแล้ว" : "Connected"}
                              </Badge>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => signIn(p.key, { callbackUrl: "/settings" })}
                            >
                              {isThai ? "เชื่อมต่อ" : "Connect"}
                            </Button>
                          )
                        }
                      </div>
                    </div>
                  ))}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1.5 bg-white text-[#1877F2] border-blue-200 hover:bg-blue-50 dark:bg-transparent dark:text-[#9ec5ff] dark:border-blue-800 dark:hover:bg-blue-950/40"
                        onClick={syncManagerAccountsFromFacebook}
                        disabled={syncingFbAccounts}
                      >
                        {syncingFbAccounts ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {isThai ? "กำลังดึง..." : "Syncing..."}
                          </>
                        ) : (
                          <>
                            <span className="w-5 h-5 rounded-full border border-white/60 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center">
                              <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                            </span>
                            {isThai ? "ดึงจาก Facebook" : "Sync from Facebook"}
                          </>
                        )}
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
                          ? "กดปุ่ม “ดึงจาก Facebook” เพื่อโหลดบัญชีโฆษณา"
                          : "Click “Sync from Facebook” to load ad accounts."}
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
                                    <Badge
                                      variant={getAccountStatusVariant(acc)}
                                      className={cn(
                                        "text-xs px-3 py-0.5",
                                        (fbStatuses[acc.accountId] ?? fbStatuses[acc.id]) === 9 &&
                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                                      )}
                                    >
                                      {getAccountStatusLabel(acc)}
                                    </Badge>
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
                      {isThai ? "จัดการแผนบริการ" : "Manage your subscription plan."}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-80">
                          {isThai ? "แผนปัจจุบัน" : "Current plan"}
                        </p>
                        <p className="text-xl font-bold mt-0.5">
                          {isThai ? "ฟรี" : "Free"}
                        </p>
                        <p className="text-sm opacity-80 mt-1">
                          {isThai
                            ? "ส่งออกได้ 100 แถว/เดือน"
                            : "Export up to 100 rows per month"}
                        </p>
                      </div>
                      <CreditCard className="w-10 h-10 opacity-40" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {billingPlans.map((plan) => (
                      <div
                        key={plan.name}
                        className={cn(
                          "p-4 rounded-xl border-2 space-y-3",
                          plan.highlight
                            ? "border-primary bg-primary/10 dark:bg-primary/10"
                            : "border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {plan.name}
                            </span>
                            {plan.highlight && (
                              <Badge className="text-xs">
                                {isThai ? "แนะนำ" : "Recommended"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {plan.price}
                            <span className="text-sm font-normal text-gray-500">
                              {isThai ? "/เดือน" : "/month"}
                            </span>
                          </span>
                        </div>
                        <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1.5 bg-white text-[#1877F2] border-blue-200 hover:bg-blue-50 dark:bg-transparent dark:text-[#9ec5ff] dark:border-blue-800 dark:hover:bg-blue-950/40"
                        onClick={syncFacebookPages}
                        disabled={syncingPages}
                      >
                        {syncingPages ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {isThai ? "กำลังดึง..." : "Syncing..."}
                          </>
                        ) : (
                          <>
                            <span className="w-5 h-5 rounded-full border border-white/60 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center">
                              <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                            </span>
                            {isThai ? "ดึงเพจจาก Facebook" : "Sync Pages"}
                          </>
                        )}
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
                        {isThai ? "กดปุ่ม “ดึงเพจจาก Facebook” เพื่อโหลด" : "Click “Sync Pages” to load pages."}
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
