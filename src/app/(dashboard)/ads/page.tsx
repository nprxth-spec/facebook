"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { th, enUS } from "date-fns/locale";

const DAYS = [
  { id: 0, labelTh: "อา", labelEn: "Su" },
  { id: 1, labelTh: "จ", labelEn: "Mo" },
  { id: 2, labelTh: "อ", labelEn: "Tu" },
  { id: 3, labelTh: "พ", labelEn: "We" },
  { id: 4, labelTh: "พฤ", labelEn: "Th" },
  { id: 5, labelTh: "ศ", labelEn: "Fr" },
  { id: 6, labelTh: "ส", labelEn: "Sa" },
];

function MiniCalendar({
  start,
  end,
  onConfirm,
  onCancel,
  locale,
  isThai,
}: {
  start: Date | null;
  end: Date | null;
  onConfirm: (from: Date | null, to: Date | null) => void;
  onCancel: () => void;
  locale: typeof th;
  isThai: boolean;
}) {
  const [cur, setCur] = useState(new Date());
  const [draftStart, setDraftStart] = useState<Date | null>(start);
  const [draftEnd, setDraftEnd] = useState<Date | null>(end);

  const handleQuickRange = (type: "today" | "yesterday" | "last7" | "last14" | "thisMonth" | "lastMonth") => {
    const now = new Date();
    let from: Date;
    let to: Date;

    if (type === "today") {
      from = now;
      to = now;
    } else if (type === "yesterday") {
      from = subDays(now, 1);
      to = subDays(now, 1);
    } else if (type === "last7") {
      to = now;
      from = subDays(to, 6);
    } else if (type === "last14") {
      to = now;
      from = subDays(to, 13);
    } else if (type === "thisMonth") {
      from = startOfMonth(now);
      to = now;
    } else {
      const lastMonth = subMonths(now, 1);
      from = startOfMonth(lastMonth);
      to = endOfMonth(lastMonth);
    }

    onConfirm(from, to);
  };

  const isQuickActive = (type: "today" | "yesterday" | "last7" | "last14" | "thisMonth" | "lastMonth") => {
    if (!start || !end) return false;
    const now = new Date();

    const same = (d1: Date, d2: Date) => isSameDay(d1, d2);

    if (type === "today") {
      return same(start, now) && same(end, now);
    }
    if (type === "yesterday") {
      const y = subDays(now, 1);
      return same(start, y) && same(end, y);
    }
    if (type === "last7") {
      const to = now;
      const from = subDays(to, 6);
      return same(start, from) && same(end, to);
    }
    if (type === "last14") {
      const to = now;
      const from = subDays(to, 13);
      return same(start, from) && same(end, to);
    }
    if (type === "thisMonth") {
      const from = startOfMonth(now);
      const to = now;
      return same(start, from) && same(end, to);
    }
    // lastMonth
    const lastMonth = subMonths(now, 1);
    const from = startOfMonth(lastMonth);
    const to = endOfMonth(lastMonth);
    return same(start, from) && same(end, to);
  };

  const renderMonth = (monthDate: Date, position: "left" | "right") => {
    const days = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    });
    const firstDay = startOfMonth(monthDate).getDay();

    return (
      <div className="w-72">
        <div className="flex items-center justify-center gap-2 mb-2">
          {position === "left" && (
            <button
              type="button"
              onClick={() => setCur(subMonths(cur, 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {format(monthDate, "MMMM yyyy", { locale })}
          </span>
          {position === "right" && (
            <button
              type="button"
              onClick={() => setCur(addMonths(cur, 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-7 mb-0.5">
          {DAYS.map((d) => (
            <div
              key={d.id}
              className="text-center text-xs text-gray-400 py-1"
            >
              {isThai ? d.labelTh : d.labelEn}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {days.map((day) => {
            const isStart = draftStart ? isSameDay(day, draftStart) : false;
            const isEnd = draftEnd ? isSameDay(day, draftEnd) : false;
            const inRange =
              draftStart && draftEnd && day > draftStart && day < draftEnd
                ? true
                : false;
            const today = isSameDay(day, new Date());

            let cls =
              "h-8 w-8 mx-auto flex items-center justify-center text-xs rounded-md transition-colors ";
            if (isStart || isEnd) {
              cls += "bg-primary text-white ring-1 ring-primary/70";
            } else if (inRange) {
              cls +=
                "bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary";
            } else if (today) {
              cls +=
                "bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-medium";
            } else {
              cls +=
                "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300";
            }

            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  if (!draftStart || (draftStart && draftEnd)) {
                    setDraftStart(day);
                    setDraftEnd(null);
                  } else if (day < draftStart) {
                    setDraftStart(day);
                    setDraftEnd(draftStart);
                  } else {
                    setDraftEnd(day);
                  }
                }}
                className={cls}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
      <div className="flex gap-3">
        <div className="w-32 pr-3 mr-1 border-r border-gray-200 dark:border-gray-700 flex flex-col gap-1.5">
          <button
            type="button"
            className="w-full px-2 py-1 text-xs rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            onClick={() => handleQuickRange("today")}
          >
            <span
              className={`w-3 h-3 rounded-full border ${isQuickActive("today")
                ? "border-primary"
                : "border-gray-300 dark:border-gray-500"
                } flex items-center justify-center`}
            >
              {isQuickActive("today") && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            {isThai ? "วันนี้" : "Today"}
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-xs rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            onClick={() => handleQuickRange("yesterday")}
          >
            <span
              className={`w-3 h-3 rounded-full border ${isQuickActive("yesterday")
                ? "border-primary"
                : "border-gray-300 dark:border-gray-500"
                } flex items-center justify-center`}
            >
              {isQuickActive("yesterday") && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            {isThai ? "เมื่อวาน" : "Yesterday"}
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-xs rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            onClick={() => handleQuickRange("last7")}
          >
            <span
              className={`w-3 h-3 rounded-full border ${isQuickActive("last7")
                ? "border-primary"
                : "border-gray-300 dark:border-gray-500"
                } flex items-center justify-center`}
            >
              {isQuickActive("last7") && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            {isThai ? "7 วันที่ผ่านมา" : "Last 7 days"}
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-xs rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            onClick={() => handleQuickRange("last14")}
          >
            <span
              className={`w-3 h-3 rounded-full border ${isQuickActive("last14")
                ? "border-primary"
                : "border-gray-300 dark:border-gray-500"
                } flex items-center justify-center`}
            >
              {isQuickActive("last14") && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            {isThai ? "14 วันที่ผ่านมา" : "Last 14 days"}
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-xs rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            onClick={() => handleQuickRange("thisMonth")}
          >
            <span
              className={`w-3 h-3 rounded-full border ${isQuickActive("thisMonth")
                ? "border-primary"
                : "border-gray-300 dark:border-gray-500"
                } flex items-center justify-center`}
            >
              {isQuickActive("thisMonth") && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            {isThai ? "เดือนนี้" : "This month"}
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-xs rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
            onClick={() => handleQuickRange("lastMonth")}
          >
            <span
              className={`w-3 h-3 rounded-full border ${isQuickActive("lastMonth")
                ? "border-primary"
                : "border-gray-300 dark:border-gray-500"
                } flex items-center justify-center`}
            >
              {isQuickActive("lastMonth") && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </span>
            {isThai ? "เดือนที่ผ่านมา" : "Last month"}
          </button>
        </div>
        <div className="flex gap-4">
          {renderMonth(cur, "left")}
          {renderMonth(addMonths(cur, 1), "right")}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3 px-1">
        <button
          type="button"
          className="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          onClick={onCancel}
        >
          {isThai ? "ยกเลิก" : "Cancel"}
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          onClick={() => onConfirm(draftStart, draftEnd ?? draftStart)}
          disabled={!draftStart}
        >
          {isThai ? "ยืนยันช่วงวันที่" : "Apply range"}
        </button>
      </div>
    </div>
  );
}

interface AdTargeting {
  countries: string[];
  ageMin: number | null;
  ageMax: number | null;
  interests: string[];
}

interface AdRow {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  pageId: string | null;
  pageName: string | null;
  pageUsername: string | null;
  image: string;
  targeting: AdTargeting;
  objective: string | null;
  result: number;
  spend: number;
  costPerResult: number;
  status: string;
  adsManagerUrl: string;
  adPostUrl: string | null;
}

export default function AdsPage() {
  const { language } = useTheme();
  const isThai = language === "th";
  const locale = isThai ? th : enUS;

  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDateCustom, setFromDateCustom] = useState<Date | null>(null);
  const [toDateCustom, setToDateCustom] = useState<Date | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState({
    account: true,
    adName: true,
    page: true,
    targeting: true,
    status: true,
    result: true,
    spend: true,
    cpr: true,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSearch = localStorage.getItem("ads_search");
      if (savedSearch) {
        setSearch(savedSearch);
        setDebouncedSearch(savedSearch);
      }

      const savedFrom = localStorage.getItem("ads_fromDate");
      const savedTo = localStorage.getItem("ads_toDate");

      const initialFrom = savedFrom ? new Date(savedFrom) : subDays(new Date(), 6);
      const initialTo = savedTo ? new Date(savedTo) : new Date();

      setFromDateCustom(initialFrom);
      setToDateCustom(initialTo);

      const savedAccount = localStorage.getItem("ads_selectedAccount");
      if (savedAccount) setSelectedAccount(savedAccount);

      const savedCols = localStorage.getItem("ads_visibleColumns");
      if (savedCols) {
        try {
          setVisibleColumns(prev => ({ ...prev, ...JSON.parse(savedCols) }));
        } catch (e) { }
      }

      setIsHydrated(true);
      fetchAds(initialFrom, initialTo, false, savedSearch || "");
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Refetch when filters change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    fetchAds();
  }, [debouncedSearch, selectedAccount, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (fromDateCustom) {
      localStorage.setItem("ads_fromDate", fromDateCustom.toISOString());
    } else {
      localStorage.removeItem("ads_fromDate");
    }
  }, [fromDateCustom, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (toDateCustom) {
      localStorage.setItem("ads_toDate", toDateCustom.toISOString());
    } else {
      localStorage.removeItem("toDateCustom");
    }
  }, [toDateCustom, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("ads_search", search);
  }, [search, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("ads_selectedAccount", selectedAccount);
  }, [selectedAccount, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("ads_visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns, isHydrated]);

  const [showCal, setShowCal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({ key: "status", direction: "asc" });

  const hasMounted = useRef(false);
  const calRef = useRef<HTMLDivElement | null>(null);

  const [managerAccounts, setManagerAccounts] = useState<{ id: string; name: string }[]>([]);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => selectedAccount === "all" || ad.accountId === selectedAccount);
  }, [ads, selectedAccount]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key, direction });
  };

  const handleRefresh = () => {
    if (loading) return;
    fetchAds(undefined, undefined, true);
  };

  const fetchAds = async (
    overrideFrom?: Date | null,
    overrideTo?: Date | null,
    forceRefresh: boolean = false,
    overrideSearch?: string
  ) => {
    setLoading(true);
    try {
      let fromDate: Date;
      let toDate: Date;

      const effFrom = overrideFrom ?? fromDateCustom;
      const effTo = overrideTo ?? toDateCustom;
      const effSearch = overrideSearch ?? debouncedSearch;

      if (effFrom && effTo) {
        fromDate = effFrom;
        toDate = effTo;
      } else if (effFrom && !effTo) {
        fromDate = effFrom;
        toDate = effFrom;
      } else {
        toDate = new Date();
        fromDate = subDays(toDate, 6);
      }

      const from = format(fromDate, "yyyy-MM-dd");
      const to = format(toDate, "yyyy-MM-dd");

      const params = new URLSearchParams({
        from,
        to,
      });
      if (effSearch.trim()) params.set("search", effSearch.trim());
      if (forceRefresh) params.set("refresh", "true");

      const res = await fetch(`/api/ads/insights?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        const list: AdRow[] = Array.isArray(data.ads) ? data.ads : [];
        setAds(list);
      } else {
        console.error(data.error || "Failed to load ads");
        setAds([]);
      }
    } catch (err) {
      console.error(err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      // fetchAds is now handled by the [debouncedSearch, selectedAccount, isHydrated] effect
    }

    fetch("/api/manager-accounts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setManagerAccounts(
            data
              .filter((a: any) => a.isActive)
              .map((a: any) => ({ id: a.accountId, name: a.name }))
          );
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCal(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const formatCurrency = (v: number | null | undefined) =>
    (Number(v) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const formatStatus = (s: string, spend: number) => {
    const k = s.toUpperCase();
    const hasStats = spend > 0;

    if (["ACTIVE"].includes(k) || k === "ACTIVE") return isThai ? "กำลังใช้งาน" : "Active";
    if (["PENDING_REVIEW", "IN_PROCESS", "PREAPPROVED"].includes(k)) return isThai ? "กำลังตรวจสอบ" : "Review";
    if (["PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED"].includes(k)) return isThai ? "ปิดโฆษณา/หยุดชั่วคราว" : "Ads off";
    if (["DISAPPROVED"].includes(k)) {
      return hasStats
        ? (isThai ? "ถูกปฏิเสธ (Inactive)" : "Inactive(Content)")
        : (isThai ? "ถูกปฏิเสธ" : "Fail(Content)");
    }
    if (["WITH_ISSUES", "ADACCOUNT_DISABLED", "CAMPAIGN_GROUP_DISABLED", "NO_CREDIT_CARD_ERROR"].includes(k)) {
      return hasStats
        ? (isThai ? "เกิดข้อผิดพลาดในการแสดงโฆษณา (Inactive)" : "Inactive(Acc/Page)")
        : (isThai ? "เกิดข้อผิดพลาดในการแสดงโฆษณา" : "Fail(Acc/Page)");
    }
    if (["DELETED", "ARCHIVED"].includes(k)) return isThai ? "ลบแล้ว" : "Deleted";

    // Fallback original parsing just in case
    const low = s.toLowerCase();
    if (low.includes("active")) return isThai ? "กำลังใช้งาน" : "Active";
    if (low.includes("paused")) return isThai ? "ปิดโฆษณา/หยุดชั่วคราว" : "Ads off";
    if (low.includes("deleted")) return isThai ? "ลบแล้ว" : "Deleted";

    return s || "Review";
  };

  const getStatusColor = (s: string, spend: number) => {
    const formatted = formatStatus(s, spend);
    if (formatted.includes("กำลังใช้งาน") || formatted === "Active") return "bg-green-500";
    if (formatted.includes("กำลังตรวจสอบ") || formatted === "Review") return "bg-blue-500";
    if (formatted.includes("ปิดโฆษณา") || formatted === "Ads off") return "bg-gray-400";
    if (formatted.includes("ถูกปฏิเสธ") || formatted.includes("Fail(Content)")) return "bg-red-500";
    if (formatted.includes("เกิดข้อผิดพลาด") || formatted.includes("Fail(Acc/Page)")) return "bg-red-500";
    if (formatted.includes("Inactive")) return "bg-orange-500";
    if (formatted.includes("ลบแล้ว") || formatted === "Deleted") return "bg-red-700";
    return "bg-slate-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isThai ? "ภาพรวมโฆษณา" : "Ads overview"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {isThai
            ? "ดึงข้อมูลโฆษณาจากบัญชีที่เลือกใช้งานใน Manager Accounts"
            : "View ads from active ad accounts in Manager Accounts."}
        </p>
      </div>

      <Card>
        {/* ── Filter section ── */}
        <div className="px-6 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1 relative z-20">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {isThai ? "ค้นหา" : "Search"}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-7 h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  placeholder={
                    isThai
                      ? "ชื่อโฆษณา, บัญชี หรือ ID..."
                      : "Ad name, account or ID..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-56 space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {isThai ? "บัญชีโฆษณา" : "Ad account"}
              </label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder={isThai ? "ทั้งหมด" : "All Accounts"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isThai ? "ทุกบัญชีโฆษณา" : "All Accounts"}</SelectItem>
                  {managerAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-64 space-y-1" ref={calRef}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {isThai ? "ช่วงวันที่ข้อมูล" : "Data date range"}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCal((v) => !v)}
                  className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 transition-colors hover:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="w-full text-center">
                    {fromDateCustom && toDateCustom
                      ? `${format(fromDateCustom, "d MMM", {
                        locale,
                      })} - ${format(toDateCustom, "d MMM yyyy", { locale })}`
                      : fromDateCustom
                        ? format(fromDateCustom, "d MMM yyyy", { locale })
                        : isThai
                          ? "เลือกช่วงวันที่ (ค่าเริ่มต้น: 7 วันล่าสุด)"
                          : "Choose date range (default: last 7 days)"}
                  </span>
                </button>
                {showCal && (
                  <div className="absolute right-0 top-full z-50 mt-1">
                    <MiniCalendar
                      start={fromDateCustom}
                      end={toDateCustom}
                      locale={locale}
                      isThai={isThai}
                      onConfirm={(from, to) => {
                        setFromDateCustom(from);
                        setToDateCustom(to);
                        fetchAds(from, to);
                        setShowCal(false);
                      }}
                      onCancel={() => {
                        setShowCal(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-normal">
                  <Settings2 className="w-4 h-4 mr-2" />
                  {isThai ? "คอลัมน์" : "Columns"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem checked={visibleColumns.account} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, account: !!v }))}>
                  {isThai ? "บัญชีโฆษณา" : "Ad account"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.adName} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, adName: !!v }))}>
                  {isThai ? "ชื่อโฆษณา" : "Ad name"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.page} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, page: !!v }))}>
                  {isThai ? "เพจ" : "Page"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.targeting} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, targeting: !!v }))}>
                  {isThai ? "กลุ่มเป้าหมาย" : "Targeting"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, status: !!v }))}>
                  {isThai ? "สถานะ" : "Status"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.result} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, result: !!v }))}>
                  {isThai ? "ผลลัพธ์" : "Results"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.spend} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, spend: !!v }))}>
                  {isThai ? "ยอดใช้จ่าย" : "Spend"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.cpr} onCheckedChange={(v) => setVisibleColumns((prev: any) => ({ ...prev, cpr: !!v }))}>
                  {isThai ? "ต้นทุนต่อผลลัพธ์" : "CPR"}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
              {isThai ? "รีเฟรช" : "Refresh"}
            </button>
          </div>
        </div>

        {/* ── Results section ── */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isThai ? "ผลลัพธ์โฆษณา" : "Ads results"}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isThai ? `${filteredAds.length.toLocaleString()} รายการ` : `${filteredAds.length.toLocaleString()} ads`}
          </span>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : !filteredAds.length ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {isThai
                ? "ไม่พบโฆษณาตามเงื่อนไขที่เลือก"
                : "No ads found for the selected filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      #
                    </th>
                    {visibleColumns.account && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {isThai ? "บัญชีโฆษณา" : "Ad account"}
                      </th>
                    )}
                    {visibleColumns.adName && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {isThai ? "ชื่อโฆษณา" : "Ad"}
                      </th>
                    )}
                    {visibleColumns.page && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {isThai ? "เพจ" : "Page"}
                      </th>
                    )}
                    {visibleColumns.targeting && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[180px]">
                        {isThai ? "กลุ่มเป้าหมาย" : "Targeting"}
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th
                        className="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none group"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isThai ? "สถานะ" : "Status"}
                          {sortConfig?.key === "status" ? (
                            sortConfig.direction === "desc" ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.result && (
                      <th
                        className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none group"
                        onClick={() => handleSort("result")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isThai ? "ผลลัพธ์" : "Results"}
                          {sortConfig?.key === "result" ? (
                            sortConfig.direction === "desc" ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.spend && (
                      <th
                        className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none group"
                        onClick={() => handleSort("spend")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isThai ? "ค่าใช้จ่าย" : "Spend"}
                          {sortConfig?.key === "spend" ? (
                            sortConfig.direction === "desc" ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </th>
                    )}
                    {visibleColumns.cpr && (
                      <th
                        className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none group"
                        onClick={() => handleSort("cpr")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isThai ? "ต้นทุนต่อผลลัพธ์" : "Cost / result"}
                          {sortConfig?.key === "cpr" ? (
                            sortConfig.direction === "desc" ? <ArrowDown className="w-3 h-3 text-primary" /> : <ArrowUp className="w-3 h-3 text-primary" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredAds].sort((a, b) => {
                    if (!sortConfig) return 0;
                    const { key, direction } = sortConfig;
                    const mod = direction === "desc" ? -1 : 1;
                    if (key === "result") return (a.result - b.result) * mod;
                    if (key === "spend") return (a.spend - b.spend) * mod;
                    if (key === "cpr") return (a.costPerResult - b.costPerResult) * mod;
                    if (key === "status") {
                      const statA = formatStatus(a.status, a.spend);
                      const statB = formatStatus(b.status, b.spend);
                      return statA.localeCompare(statB) * mod;
                    }
                    return 0;
                  }).map((ad, idx) => (
                    <tr
                      key={ad.id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {idx + 1}
                      </td>
                      {visibleColumns.account && (
                        <td className="px-3 py-2 text-left">
                          <a
                            href={ad.adsManagerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary hover:underline transition-colors block truncate"
                          >
                            {ad.accountName}
                          </a>
                          <div
                            className="text-xs text-gray-500 cursor-pointer hover:text-primary transition-colors w-fit mt-0.5"
                            onClick={() => {
                              navigator.clipboard.writeText(ad.accountId);
                              toast.success(isThai ? "คัดลอกแล้ว" : "Copied to clipboard");
                            }}
                          >
                            {ad.accountId}
                          </div>
                        </td>
                      )}
                      {visibleColumns.adName && (
                        <td className="p-[1px]">
                          <div className="flex items-center gap-2">
                            <div className="w-11 h-11 rounded-sm overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={ad.image}
                                alt={ad.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 py-1 pr-2">
                              {ad.adPostUrl ? (
                                <a
                                  href={ad.adPostUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-normal text-gray-900 dark:text-gray-100 hover:text-primary hover:underline transition-colors block truncate"
                                >
                                  {ad.name}
                                </a>
                              ) : (
                                <div className="text-sm font-normal text-gray-900 dark:text-gray-100 truncate">
                                  {ad.name}
                                </div>
                              )}
                              <div
                                className="text-xs text-gray-500 cursor-pointer hover:text-primary transition-colors w-fit"
                                onClick={() => {
                                  navigator.clipboard.writeText(ad.id);
                                  toast.success(isThai ? "คัดลอกแล้ว" : "Copied to clipboard");
                                }}
                              >
                                ID: {ad.id}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.page && (
                        <td className="p-[1px]">
                          <div className="flex flex-col justify-center h-full min-w-0 py-1 pl-2">
                            <div className="text-sm font-normal text-gray-900 dark:text-gray-100 truncate">
                              {ad.pageName ?? (ad.pageId ? `Page ${ad.pageId}` : "—")}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {ad.pageUsername ? `@${ad.pageUsername}` : "—"}
                            </div>
                            {ad.pageId && (
                              <div
                                className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary transition-colors w-fit mt-0.5"
                                onClick={() => {
                                  navigator.clipboard.writeText(ad.pageId!);
                                  toast.success(isThai ? "คัดลอกแล้ว" : "Copied to clipboard");
                                }}
                              >
                                ID: {ad.pageId}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.targeting && (
                        <td className="px-3 py-2">
                          <div className="text-[11px] leading-snug text-gray-700 dark:text-gray-300 space-y-0.5">
                            {ad.targeting.countries.length > 0 && (
                              <div>
                                <span className="font-medium text-gray-500">
                                  {isThai ? "ประเทศ:" : "Countries:"}{" "}
                                </span>
                                {ad.targeting.countries.join(", ")}
                              </div>
                            )}
                            {(ad.targeting.ageMin || ad.targeting.ageMax) && (
                              <div>
                                <span className="font-medium text-gray-500">
                                  {isThai ? "อายุ:" : "Age:"}{" "}
                                </span>
                                {ad.targeting.ageMin ?? "?"}–{ad.targeting.ageMax ?? "?"}
                              </div>
                            )}
                            {ad.targeting.interests.length > 0 && (
                              <div className="flex items-start flex-wrap">
                                <span className="font-medium text-gray-500 mr-1 whitespace-nowrap">
                                  {isThai ? "ความสนใจ:" : "Interests:"}{" "}
                                </span>
                                <span className="inline-block truncate max-w-[120px]" title={ad.targeting.interests[0]}>
                                  {ad.targeting.interests[0]}
                                </span>
                                {ad.targeting.interests.length > 1 && (
                                  <Popover>
                                    <PopoverTrigger className="ml-1 text-[10px] text-primary font-bold hover:underline whitespace-nowrap">
                                      +{ad.targeting.interests.length - 1} {isThai ? "เพิ่มเติม" : "more"}
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-4 z-[60] shadow-xl">
                                      <div className="font-semibold text-sm mb-3 border-b pb-2 flex justify-between items-center text-gray-900 dark:text-gray-100">
                                        <span>{isThai ? "ความสนใจทั้งหมด" : "All Interests"}</span>
                                        <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">{ad.targeting.interests.length}</Badge>
                                      </div>
                                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2">
                                        {ad.targeting.interests.map((int, i) => (
                                          <Badge key={i} variant="outline" className="text-xs font-medium px-2 py-0.5 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                                            {int}
                                          </Badge>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="px-3 py-2 text-left">
                          <div className="flex items-center justify-start gap-2 text-[13px] font-medium text-gray-800 dark:text-gray-200">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(ad.status, ad.spend)} shadow-sm`} />
                            {formatStatus(ad.status, ad.spend)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.result && (
                        <td className="px-3 py-2 text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(ad.result)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.spend && (
                        <td className="px-3 py-2 text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(ad.spend)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.cpr && (
                        <td className="px-3 py-2 text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(ad.costPerResult)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card >
    </div >
  );
}

