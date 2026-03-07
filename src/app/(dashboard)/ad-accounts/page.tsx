"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { PageShell } from "@/components/layout/PageShell";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Loader2, Search, ShieldAlert, ShieldCheck, Pencil, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ManagerAccount = {
  id: string;
  accountId: string;
  name: string;
  platform: string;
  isActive: boolean;
};

type FacebookAdAccount = {
  id: string;
  accountId: string;
  name: string;
  status?: number;
  isActive?: boolean;
  currency?: string;
  timezone?: string;
  spendCap?: string | null;
   amountSpent?: string | null;
  paymentMethods?: { brand: string; last4: string | null }[];
};

type CombinedRow = {
  id: string;
  accountId: string;
  name: string;
  isActive: boolean;
  fbStatus?: number;
  currency?: string;
  timezone?: string;
  spendCap?: string | null;
  amountSpent?: string | null;
  paymentMethods?: { brand: string; last4: string | null }[];
};

function getStatusLabel(code?: number, isThai?: boolean) {
  if (code === 1) return isThai ? "เปิดใช้งาน" : "Active";
  if (code === 2 || code === 7 || code === 3) return isThai ? "ปิดใช้งาน" : "Disabled";
  if (code === 9) return isThai ? "รอตรวจสอบ" : "Pending Review";
  return isThai ? "ไม่ทราบสถานะ" : "Unknown";
}

function formatSpendingCap(spendCap: string | null | undefined, currency?: string, isThai?: boolean) {
  if (!spendCap) return "-";
  const raw = Number(spendCap);
  if (!Number.isFinite(raw)) return spendCap;
  const value = raw / 100;
  try {
    return new Intl.NumberFormat(isThai ? "th-TH" : "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function formatCurrency(value: number | null | undefined, currency?: string, isThai?: boolean) {
  if (value == null || Number.isNaN(value)) return "-";
  try {
    return new Intl.NumberFormat(isThai ? "th-TH" : "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function hasSpendingCap(spendCap?: string | null) {
  if (spendCap == null) return false;
  const n = Number(spendCap);
  if (!Number.isFinite(n)) return false;
  // ใน Facebook ถ้าเป็น 0 แปลว่า "ไม่มีลิมิต"
  return n > 0;
}

function getCardIconPath(brand: string) {
  const b = brand.toLowerCase();
  if (b.includes("visa")) return "/visa.svg";
  if (b.includes("master")) return "/mastercard.svg";
  if (b.includes("union")) return "/unionpay.svg";
  return null;
}

function formatTimezoneDisplay(tz?: string | null) {
  if (!tz) return "-";
  let offsetLabel = "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = tzPart.match(/GMT([+-]\d{1,2})/);
    if (m) {
      offsetLabel = m[1];
    }
  } catch {
    // ignore
  }
  return offsetLabel ? `${tz} | ${offsetLabel}` : tz;
}

function getAdsManagerUrl(accountId: string) {
  const id = accountId.startsWith("act_") ? accountId.slice(4) : accountId;
  return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${encodeURIComponent(
    id
  )}`;
}

export default function AdAccountsTablePage() {
  const { data: session, status } = useSession();
  const { language } = useTheme();
  const isThai = language === "th";

  const [rows, setRows] = useState<CombinedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedRef = useRef(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CombinedRow | null>(null);
  const [mode, setMode] = useState<"change" | "reset" | "delete">("change");
  const [newLimit, setNewLimit] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") setLoading(false);
      hasLoadedRef.current = false;
      return;
    }
    if (hasLoadedRef.current && reloadKey === 0) return;
    if (reloadKey === 0) hasLoadedRef.current = true;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // โหลดจาก DB และดึงสถานะจาก Facebook (ไม่ใช้ sync= เพื่อไม่โดน cooldown และได้สถานะครบ)
        const [maRes, fbRes] = await Promise.all([
          fetch("/api/manager-accounts"),
          fetch("/api/facebook/ad-accounts"),
        ]);

        if (!maRes.ok) {
          throw new Error(isThai ? "โหลดบัญชีจากระบบไม่สำเร็จ" : "Failed to load manager accounts");
        }
        let maData: ManagerAccount[] = await maRes.json();
        if (!Array.isArray(maData)) {
          throw new Error("Invalid manager accounts response");
        }

        let fbAccounts: FacebookAdAccount[] = [];
        if (fbRes.ok) {
          const fbData: { accounts?: FacebookAdAccount[]; error?: string } = await fbRes.json();
          if (!fbData.error && Array.isArray(fbData.accounts)) {
            fbAccounts = fbData.accounts;
          }
        }

        // ถ้ายังไม่มีบัญชีใน DB แต่เชื่อม Facebook แล้ว → sync จาก Facebook เข้า DB ก่อน แล้วโหลดใหม่
        if (maData.length === 0 && fbRes.status !== 400) {
          const syncRes = await fetch("/api/facebook/sync/ad-accounts", { method: "POST" });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (Array.isArray(syncData.accounts) && syncData.accounts.length > 0) {
              maData = syncData.accounts;
            }
          }
          if (maData.length === 0 && fbAccounts.length > 0) {
            const syncRes2 = await fetch("/api/manager-accounts");
            if (syncRes2.ok) {
              const arr = await syncRes2.json();
              if (Array.isArray(arr)) maData = arr;
            }
          }
        }

        const fbMap = new Map<string, FacebookAdAccount>();
        fbAccounts.forEach((a) => {
          if (a.id) {
            fbMap.set(a.id, a);
            if (a.accountId) fbMap.set(a.accountId, a);
          }
        });

        const combined: CombinedRow[] = maData
          .filter((a) => a.platform === "facebook" && a.isActive)
          .map((ma) => {
            const fb = fbMap.get(ma.accountId) ?? fbMap.get(ma.accountId.replace(/^act_/, ""));
            const base: CombinedRow = {
              id: ma.id,
              accountId: ma.accountId,
              name: ma.name,
              isActive: ma.isActive,
              fbStatus: fb?.status,
              currency: fb?.currency,
              timezone: fb?.timezone,
              spendCap: fb?.spendCap ?? null,
              amountSpent: fb?.amountSpent ?? null,
              paymentMethods: fb?.paymentMethods ?? [],
            };
            return base;
          });

        if (!cancelled) {
          setRows(combined);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : isThai
              ? "ไม่สามารถโหลดข้อมูลบัญชีโฆษณาได้"
              : "Failed to load ad accounts"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [status, reloadKey]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.accountId.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const title = isThai ? "ตารางบัญชีโฆษณา" : "Ad Accounts Table";
  const description = isThai
    ? "ดูรายการบัญชีโฆษณาทั้งหมดในรูปแบบตารางละเอียด"
    : "View all ad accounts in a detailed table.";

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <PageShell title={title} description={description}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={isThai ? "ค้นหาชื่อบัญชี หรือ Account ID..." : "Search by name or Account ID..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500">
            {isThai ? "ยังไม่มีบัญชีโฆษณาในระบบ" : "No ad accounts found."}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
            <table className="w-full text-sm table-fixed border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-[13px] border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32 border border-gray-200 dark:border-gray-700">
                    {isThai ? "สถานะ" : "Status"}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-64 border border-gray-200 dark:border-gray-700">
                    {isThai ? "บัญชีโฆษณา" : "Ad Account"}
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-40 border border-gray-200 dark:border-gray-700">
                    {isThai ? "ยอดใช้จ่าย / ลิมิต" : "Spend / Limit"}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-40 border border-gray-200 dark:border-gray-700">
                    {isThai ? "วิธีชำระเงิน" : "Payment Method"}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-28 border border-gray-200 dark:border-gray-700">
                    {isThai ? "สกุลเงิน" : "Currency"}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-40 border border-gray-200 dark:border-gray-700">
                    {isThai ? "ไทม์โซน" : "Timezone"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => {
                  const label = getStatusLabel(row.fbStatus, isThai);
                  const isActiveStatus = row.fbStatus === 1;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-gray-100 dark:border-gray-800 transition-colors ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <td className="px-4 py-1.5 border border-gray-200 dark:border-gray-800">
                        {row.fbStatus != null ? (
                          isActiveStatus ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-0.5 font-medium">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {label}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-1.5 border border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col">
                          <a
                            href={getAdsManagerUrl(row.accountId)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary cursor-pointer"
                          >
                            {row.name}
                          </a>
                          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                            {row.accountId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 border border-gray-200 dark:border-gray-800">
                        {hasSpendingCap(row.spendCap) && row.amountSpent != null ? (() => {
                          const capRaw = Number(row.spendCap);
                          const spentRaw = Number(row.amountSpent);
                          // ทั้ง spend_cap และ amount_spent จาก Facebook อยู่ในหน่วยย่อย (เช่น เซ็นต์) เลยต้อง /100 ทั้งคู่
                          const cap = Number.isFinite(capRaw) && capRaw > 0 ? capRaw / 100 : null;
                          const spent = Number.isFinite(spentRaw) ? spentRaw / 100 : 0;
                          if (!cap) {
                            return (
                              <span className="text-xs text-gray-700 dark:text-gray-200">
                                {formatSpendingCap(row.spendCap, row.currency, isThai)}
                              </span>
                            );
                          }
                          const ratio = Math.max(0, Math.min(1, spent / cap));
                          const percent = Math.round(ratio * 100);
                          let barColor = "bg-emerald-500"; // <70% เขียว
                          if (percent >= 70 && percent < 80) {
                            barColor = "bg-yellow-400";
                          } else if (percent >= 80 && percent < 90) {
                            barColor = "bg-orange-400";
                          } else if (percent >= 90 && percent < 100) {
                            barColor = "bg-orange-500";
                          } else if (percent >= 100) {
                            barColor = "bg-red-500";
                          }
                          return (
                            <div className="space-y-1 group">
                              <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>
                                  {spent > 0
                                    ? formatCurrency(spent, row.currency, isThai)
                                    : isThai
                                      ? "ไม่มีการใช้จ่าย"
                                      : "No spend yet"}
                                </span>
                                <span>{formatSpendingCap(row.spendCap, row.currency, isThai)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-100"
                                  onClick={() => {
                                    setEditingRow(row);
                                    setMode("change");
                                    setNewLimit(cap.toString());
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <div className="h-1.5 w-32 sm:w-40 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className={`h-full ${barColor}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 min-w-[3ch] text-right">
                                  {percent}%
                                </span>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              onClick={() => {
                                setEditingRow(row);
                                setMode("change");
                                setNewLimit("");
                                setDialogOpen(true);
                              }}
                            >
                              <Plus className="w-3 h-3" />
                              {isThai ? "เพิ่มลิมิต" : "Add limit"}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-1.5 border border-gray-200 dark:border-gray-800 text-right">
                        {(() => {
                          const methods = row.paymentMethods ?? [];
                          if (!methods.length) {
                            return (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                —
                              </span>
                            );
                          }

                          const primary = methods[0];
                          const icon = getCardIconPath(primary.brand);
                          const moreCount = methods.length - 1;

                          return (
                            <div className="relative group inline-flex items-center justify-end gap-1.5">
                              {icon && (
                                <img
                                  src={icon}
                                  alt={primary.brand || "Card"}
                                  className="w-6 h-4 object-contain"
                                />
                              )}
                              {primary.last4 && (
                                <span className="text-xs text-gray-700 dark:text-gray-200">
                                  - {primary.last4}
                                </span>
                              )}
                              {moreCount > 0 && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  +{moreCount}
                                </span>
                              )}

                              {moreCount > 0 && (
                                <div className="absolute top-full right-0 mt-1 hidden group-hover:block z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg px-3 py-2 min-w-[160px]">
                                  <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {isThai ? "วิธีชำระเงินทั้งหมด" : "All payment methods"}
                                  </div>
                                  <div className="space-y-1">
                                    {methods.map((m, i) => {
                                      const ic = getCardIconPath(m.brand);
                                      return (
                                        <div key={`${m.brand}-${m.last4}-${i}`} className="flex items-center gap-1.5">
                                          {ic && (
                                            <img
                                              src={ic}
                                              alt={m.brand || "Card"}
                                              className="w-5 h-3.5 object-contain"
                                            />
                                          )}
                                          <span className="text-[11px] text-gray-700 dark:text-gray-200">
                                            {m.last4 ? `- ${m.last4}` : ""}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-1.5 border border-gray-200 dark:border-gray-800 text-right">
                        <span className="text-xs text-gray-700 dark:text-gray-200">
                          {row.currency ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 border border-gray-200 dark:border-gray-800 text-right">
                        <span className="text-xs text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          {formatTimezoneDisplay(row.timezone)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isThai ? "ตั้งค่า Spending Limit" : "Set Spending Limit"}
            </DialogTitle>
            <DialogDescription>
              {editingRow
                ? hasSpendingCap(editingRow.spendCap)
                  ? isThai
                    ? `ควบคุมค่าใช้จ่ายโฆษณารวมของบัญชีนี้ด้วย Spending Limit`
                    : `Control total ad spend for this account with a spending limit.`
                  : isThai
                    ? "ตั้งค่า Spending Limit ครั้งแรกสำหรับบัญชีนี้"
                    : "Create a new spending limit for this account."
                : ""}
            </DialogDescription>
          </DialogHeader>
          {editingRow && (
              <div className="space-y-4 mt-2">
              <div className="text-sm rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 border border-gray-100 dark:border-gray-800">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {editingRow.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {editingRow.accountId}
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {isThai ? "ยอดใช้ไป" : "Spent"}:{" "}
                  {formatCurrency(
                    editingRow.amountSpent ? Number(editingRow.amountSpent) / 100 : 0,
                    editingRow.currency,
                    isThai
                  )}{" "}
                  ·{" "}
                  {isThai ? "Limit ปัจจุบัน" : "Current limit"}:{" "}
                  {formatSpendingCap(editingRow.spendCap ?? null, editingRow.currency, isThai)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {isThai ? "เลือกการทำงาน" : "Choose an action"}
                </div>
                {hasSpendingCap(editingRow.spendCap) ? (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setMode("change")}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          mode === "change"
                            ? "border-primary"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            mode === "change" ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <span className="text-gray-700 dark:text-gray-200">
                        {isThai ? "เปลี่ยน Limit" : "Change limit"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setMode("reset")}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          mode === "reset"
                            ? "border-primary"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            mode === "reset" ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <span className="text-gray-700 dark:text-gray-200">
                        {isThai ? "รีเซ็ต Limit" : "Reset limit"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setMode("delete")}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          mode === "delete"
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            mode === "delete" ? "bg-red-500" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <span className="text-gray-700 dark:text-gray-200">
                        {isThai ? "ลบ Limit" : "Delete limit"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isThai
                      ? "บัญชีนี้ยังไม่มี Spending Limit เลือกจำนวน Limit ใหม่ด้านล่าง"
                      : "This account has no spending limit yet. Set a new limit below."}
                  </div>
                )}
              </div>

              {mode === "change" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {isThai ? "Limit ใหม่" : "New spending limit"}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {editingRow.currency || "USD"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant={mode === "delete" ? "destructive" : "default"}
              disabled={saving || !editingRow}
              onClick={async () => {
                if (!editingRow) return;
                setSaving(true);
                try {
                  let payload: any = { accountId: editingRow.accountId, action: mode };
                  if (mode === "change") {
                    const v = parseFloat(newLimit);
                    if (!Number.isFinite(v) || v <= 0) {
                      setSaving(false);
                      return;
                    }
                    payload.newLimit = v;
                  }
                  const res = await fetch("/api/facebook/ad-accounts/spend-cap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const data = await res.json();
                  if (!res.ok || data.error) {
                    // เงียบไว้ หรือคุณจะไปดู console เอง
                  } else {
                    setDialogOpen(false);
                    setReloadKey((k) => k + 1);
                  }
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving
                ? isThai
                  ? "กำลังบันทึก..."
                  : "Saving..."
                : mode === "change"
                  ? isThai
                    ? "เปลี่ยน Limit"
                    : "Change limit"
                  : mode === "reset"
                    ? isThai
                      ? "รีเซ็ต Limit"
                      : "Reset limit"
                    : isThai
                      ? "ลบ Limit"
                      : "Delete limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

