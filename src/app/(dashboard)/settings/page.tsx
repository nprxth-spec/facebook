"use client";

import { useState, useEffect } from "react";
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

interface ManagerAccount { id: string; accountId: string; name: string; platform: string; isActive: boolean }

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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("account");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasGoogle = connectedProviders.includes("google");
  const hasFacebook = connectedProviders.includes("facebook");

  // Preferences
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [accentColor, setAccent] = useState("blue");
  const [language, setLanguage] = useState("th");
  const [timezone, setTimezone] = useState("Asia/Bangkok");
  const [prefsSaving, setPrefsSaving] = useState(false);

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


  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  // Load preferences
  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.theme) setTheme(d.theme);
        if (d.accentColor) setAccent(d.accentColor);
        if (d.language) setLanguage(d.language);
        if (d.timezone) setTimezone(d.timezone);
      });
  }, []);

  // ดึงบัญชีโฆษณาจาก Facebook แล้ว sync เข้า ManagerAccount
  const syncManagerAccountsFromFacebook = async () => {
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

  const reloadManagerAccounts = async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch("/api/manager-accounts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
        setAccountsPage(1);
      }
      // โหลดสถานะจาก Facebook อีกครั้ง
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
        // ignore
      }
    } catch {
      toast.error("โหลดบัญชีไม่สำเร็จ");
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    setAccountsPage(1);
  }, [accountsSearch]);

  const savePreferences = async () => {
    setPrefsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, accentColor, language, timezone }),
      });
      toast.success("บันทึกการตั้งค่าแล้ว");
    } catch {
      toast.error("เกิดข้อผิดพลาด");
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
    const res = await fetch("/api/manager-accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: acc.id, isActive: !acc.isActive }),
    });
    const updated = await res.json();
    setAccounts((p) => p.map((a) => a.id === acc.id ? updated : a));
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
    { id: "account", label: "บัญชี", icon: User },
    { id: "connections", label: "การเชื่อมต่อ", icon: Link2 },
    { id: "manager-accounts", label: "บัญชีโฆษณา", icon: Users },
    { id: "billing", label: "การชำระเงิน", icon: CreditCard },
    { id: "preferences", label: "การแสดงผล", icon: Palette },
  ];

  const filteredAccounts = accounts.filter((acc) => {
    if (!accountsSearch.trim()) return true;
    const q = accountsSearch.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.accountId.toLowerCase().includes(q)
    );
  });

  const getAccountStatusLabel = (acc: ManagerAccount) => {
    const code = fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
    switch (code) {
      case 1:
        return "ใช้งานได้ (Active)";
      case 2:
        return "ถูกปิดใช้งาน (Disabled)";
      case 3:
        return "มีปัญหาการชำระเงิน (Unsettled)";
      case 7:
        return "กำลังจะปิด (Pending Closure)";
      case 9:
        return "ช่วงผ่อนผัน (In Grace Period)";
      default:
        return "ไม่ทราบสถานะ";
    }
  };

  const getAccountStatusVariant = (acc: ManagerAccount): "success" | "secondary" | "destructive" => {
    const code = fbStatuses[acc.accountId] ?? fbStatuses[acc.id];
    if (code === 1 || code === 9) return "success";
    if (code === 2 || code === 7 || code === 3) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ตั้งค่า</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">จัดการบัญชีและการตั้งค่าทั้งหมด</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-52 shrink-0">
          <nav className="space-y-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  activeTab === t.id ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                )}>
                <t.icon className="w-4 h-4 shrink-0" />{t.label}
              </button>
            ))}
            <Separator className="my-2" />
            <button onClick={() => setActiveTab("delete")}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === "delete" ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              )}>
              <Trash2 className="w-4 h-4 shrink-0" />ลบบัญชี
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Account */}
          {activeTab === "account" && (
            <Card>
              <CardHeader><CardTitle>ตั้งค่าบัญชี</CardTitle><CardDescription>ข้อมูลโปรไฟล์ของคุณ</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={session?.user?.image ?? ""} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{session?.user?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">รูปโปรไฟล์จากบัญชีที่เชื่อมต่อ</p>
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
                    <Input defaultValue={session?.user?.email ?? ""} disabled className="opacity-60" />
                  </div>
                </div>
                <Button onClick={() => toast.success("อัปเดตข้อมูลแล้ว")}>บันทึก</Button>
              </CardContent>
            </Card>
          )}

          {/* Connections */}
          {activeTab === "connections" && (
            <Card>
              <CardHeader><CardTitle>ตั้งค่าการเชื่อมต่อ</CardTitle><CardDescription>จัดการบัญชี Google และ Facebook ที่เชื่อมต่อ</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "google", label: "Google", desc: hasGoogle ? "เชื่อมต่อแล้ว — ใช้สำหรับ Google Sheets" : "ยังไม่ได้เชื่อมต่อ",
                    connected: hasGoogle, icon: <GoogleIcon className="w-5 h-5" />, bg: "bg-gray-50 dark:bg-gray-700",
                  },
                  {
                    key: "facebook", label: "Facebook", desc: hasFacebook ? "เชื่อมต่อแล้ว — ใช้สำหรับดึงข้อมูลโฆษณา" : "ยังไม่ได้เชื่อมต่อ",
                    connected: hasFacebook, icon: <FacebookIcon className="w-5 h-5" />, bg: "bg-blue-50 dark:bg-blue-900/20",
                  },
                ].map((p) => (
                  <div key={p.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>{p.icon}</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.connected
                        ? <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" />เชื่อมต่อแล้ว</Badge>
                        : <Button size="sm" variant="outline" onClick={() => signIn(p.key, { callbackUrl: "/settings" })}>เชื่อมต่อ</Button>
                      }
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Token ถูกเก็บอย่างปลอดภัยในฐานข้อมูล ใช้เพื่อดึงข้อมูลโฆษณาและส่งออกเท่านั้น
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manager Accounts */}
          {activeTab === "manager-accounts" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>บัญชีโฆษณา (Manager Accounts)</CardTitle>
                  <CardDescription>เลือกบัญชีโฆษณา Facebook ที่ต้องการใช้ในระบบ</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={syncManagerAccountsFromFacebook}
                  disabled={syncingFbAccounts}
                >
                  {syncingFbAccounts ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      กำลังดึงจาก Facebook...
                    </>
                  ) : (
                    <>
                      <FacebookIcon className="w-3.5 h-3.5" />
                      ดึงจาก Facebook
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toolbar: search + actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                  <div className="w-full sm:max-w-xs">
                    <Input
                      placeholder="ค้นหาตามชื่อหรือ Account ID..."
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
                    >
                      <Loader2 className="w-3 h-3 mr-1" />
                      รีเฟรช
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => toast.success("บันทึกการตั้งค่าบัญชีแล้ว")}
                    >
                      บันทึก
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
                        ? "ไม่พบบัญชีที่ตรงกับคำค้นหา"
                        : "ยังไม่มีบัญชีโฆษณา"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      กดปุ่ม “ดึงจาก Facebook” เพื่อโหลดบัญชีโฆษณา
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              บัญชี
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Account ID
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              สถานะ
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              การใช้งาน
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
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                      <FacebookIcon className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {acc.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                    {acc.accountId}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <Badge
                                    variant={getAccountStatusVariant(acc)}
                                    className="text-xs px-3 py-0.5"
                                  >
                                    {getAccountStatusLabel(acc)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <Switch
                                    className="scale-75"
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
                          แสดง {(accountsPage - 1) * ACCOUNTS_PER_PAGE + 1}–
                          {Math.min(accountsPage * ACCOUNTS_PER_PAGE, filteredAccounts.length)} จาก{" "}
                          {filteredAccounts.length} บัญชี
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={accountsPage === 1}
                            onClick={() => setAccountsPage((p) => Math.max(1, p - 1))}
                          >
                            ก่อนหน้า
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
                            ถัดไป
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing */}
          {activeTab === "billing" && (
            <Card>
              <CardHeader><CardTitle>ตั้งค่าการชำระเงิน</CardTitle><CardDescription>จัดการแผนบริการ</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">แผนปัจจุบัน</p>
                      <p className="text-xl font-bold mt-0.5">ฟรี</p>
                      <p className="text-sm opacity-80 mt-1">ส่งออกได้ 100 แถว/เดือน</p>
                    </div>
                    <CreditCard className="w-10 h-10 opacity-40" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "Pro", price: "฿499", features: ["ส่งออกไม่จำกัด", "10 บัญชีโฆษณา", "ส่งออกอัตโนมัติ", "Priority Support"], highlight: false },
                    { name: "Business", price: "฿1,299", features: ["ทุกอย่างใน Pro", "ไม่จำกัดบัญชีโฆษณา", "API Access", "Dedicated Support"], highlight: true },
                  ].map((plan) => (
                    <div key={plan.name} className={cn("p-4 rounded-xl border-2 space-y-3", plan.highlight ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</span>
                          {plan.highlight && <Badge className="text-xs">แนะนำ</Badge>}
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.price}<span className="text-sm font-normal text-gray-500">/เดือน</span></span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-500" />{f}</li>
                        ))}
                      </ul>
                      <Button className="w-full" size="sm">อัปเกรด</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences */}
          {activeTab === "preferences" && (
            <Card>
              <CardHeader><CardTitle>การแสดงผลและภาษา</CardTitle><CardDescription>ปรับธีม สี ภาษา และไทม์โซน</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>ธีม</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([{ id: "light", label: "สว่าง", icon: Sun }, { id: "dark", label: "มืด", icon: Moon }, { id: "system", label: "ตามระบบ", icon: Monitor }] as const).map((t) => (
                      <button key={t.id} onClick={() => setTheme(t.id)}
                        className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                          theme === t.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        )}>
                        <t.icon className={cn("w-5 h-5", theme === t.id ? "text-blue-600 dark:text-blue-400" : "text-gray-500")} />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>สีธีมหลัก</Label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button key={c.id} onClick={() => setAccent(c.id)} title={c.label}
                        className={cn("w-8 h-8 rounded-full relative transition-all", c.cls, accentColor === c.id && "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500")}>
                        {accentColor === c.id && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />ภาษา</Label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="th">ภาษาไทย</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />ไทม์โซน</Label>
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                      <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (UTC-5)</option>
                    </select>
                  </div>
                </div>
                <Button onClick={savePreferences} disabled={prefsSaving} className="gap-2">
                  {prefsSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  บันทึกการตั้งค่า
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delete */}
          {activeTab === "delete" && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader><CardTitle className="text-red-600 dark:text-red-400">ลบบัญชี</CardTitle><CardDescription>การดำเนินการนี้ไม่สามารถย้อนกลับได้</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                      <li>• ข้อมูลทั้งหมดจะถูกลบถาวร</li>
                      <li>• การตั้งค่าการส่งออกทั้งหมดจะหายไป</li>
                      <li>• ประวัติการส่งออกจะหายไป</li>
                      <li>• การเชื่อมต่อ Google และ Facebook จะถูกยกเลิก</li>
                    </ul>
                  </div>
                </div>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2">
                  <Trash2 className="w-4 h-4" />ลบบัญชีทั้งหมด
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">ยืนยันการลบบัญชี</DialogTitle>
            <DialogDescription>
              พิมพ์ <strong className="text-gray-900 dark:text-gray-100">ลบบัญชี</strong> เพื่อยืนยัน
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="พิมพ์ 'ลบบัญชี' เพื่อยืนยัน" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteConfirm !== "ลบบัญชี"}>ลบบัญชีถาวร</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
