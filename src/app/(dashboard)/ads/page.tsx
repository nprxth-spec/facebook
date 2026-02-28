"use client";

import { useEffect, useRef, useState } from "react";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
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
}

export default function AdsPage() {
  const { language } = useTheme();
  const isThai = language === "th";
  const locale = isThai ? th : enUS;

  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDateCustom, setFromDateCustom] = useState<Date | null>(new Date());
  const [toDateCustom, setToDateCustom] = useState<Date | null>(new Date());
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef<HTMLDivElement | null>(null);
  const handleRefresh = () => {
    if (loading) return;
    fetchAds(undefined, undefined, true);
  };

  const fetchAds = async (
    overrideFrom?: Date | null,
    overrideTo?: Date | null,
    forceRefresh: boolean = false
  ) => {
    setLoading(true);
    try {
      let fromDate: Date;
      let toDate: Date;

      const effFrom = overrideFrom ?? fromDateCustom;
      const effTo = overrideTo ?? toDateCustom;

      if (effFrom && effTo) {
        fromDate = effFrom;
        toDate = effTo;
      } else if (effFrom && !effTo) {
        fromDate = effFrom;
        toDate = effFrom;
      } else {
        toDate = new Date();
        fromDate = subDays(toDate, 6); // 7 วันรวมวันนี้
      }

      const from = format(fromDate, "yyyy-MM-dd");
      const to = format(toDate, "yyyy-MM-dd");

      const params = new URLSearchParams({
        from,
        to,
      });
      if (search.trim()) params.set("search", search.trim());
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
    fetchAds();
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

  const formatStatus = (s: string) => {
    const k = s.toLowerCase();
    if (k.includes("active")) return isThai ? "กำลังรัน" : "Active";
    if (k.includes("paused")) return isThai ? "หยุดชั่วคราว" : "Paused";
    if (k.includes("deleted")) return isThai ? "ลบแล้ว" : "Deleted";
    return s;
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isThai ? "ตัวกรอง" : "Filters"}
          </CardTitle>
          <CardDescription>
            {isThai
              ? "ค้นหาตามชื่อ/บัญชีโฆษณา/ID"
              : "Search by name/account/ID."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {isThai ? "ค้นหา" : "Search"}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-7"
                  placeholder={
                    isThai
                      ? "ชื่อโฆษณา, บัญชี หรือ ID..."
                      : "Ad name, account or ID..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchAds();
                    }
                  }}
                />
              </div>
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
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
              {isThai ? "รีเฟรชข้อมูล" : "Refresh"}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {isThai ? "ผลลัพธ์โฆษณา" : "Ads results"}
            </CardTitle>
            <CardDescription>
              {isThai
                ? `จำนวน ${ads.length.toLocaleString()} รายการ`
                : `${ads.length.toLocaleString()} ads`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : !ads.length ? (
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
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "บัญชีโฆษณา" : "Ad account"}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "ชื่อโฆษณา" : "Ad"}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "เพจ" : "Page"}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[180px]">
                      {isThai ? "กลุ่มเป้าหมาย" : "Targeting"}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "ผลลัพธ์" : "Results"}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "ค่าใช้จ่าย" : "Spend"}
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "ต้นทุนต่อผลลัพธ์" : "Cost / result"}
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {isThai ? "สถานะ" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad, idx) => (
                    <tr
                      key={ad.id}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {ad.accountName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                          {ad.accountId}
                        </div>
                      </td>
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
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {ad.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {ad.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-[1px]">
                        <div className="flex flex-col justify-center h-full min-w-0 py-1 pl-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {ad.pageName ?? (ad.pageId ? `Page ${ad.pageId}` : "—")}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {ad.pageUsername ? `@${ad.pageUsername}` : "—"}
                          </div>
                          {ad.pageId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                              ID: {ad.pageId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                          {ad.targeting.countries.length > 0 && (
                            <div>
                              <span className="font-medium">
                                {isThai ? "ประเทศ:" : "Countries:"}{" "}
                              </span>
                              {ad.targeting.countries.join(", ")}
                            </div>
                          )}
                          {(ad.targeting.ageMin || ad.targeting.ageMax) && (
                            <div>
                              <span className="font-medium">
                                {isThai ? "อายุ:" : "Age:"}{" "}
                              </span>
                              {ad.targeting.ageMin ?? "?"}–{ad.targeting.ageMax ?? "?"}
                            </div>
                          )}
                          {ad.targeting.interests.length > 0 && (
                            <div>
                              <span className="font-medium">
                                {isThai ? "ความสนใจ:" : "Interests:"}{" "}
                              </span>
                              {ad.targeting.interests.slice(0, 3).join(", ")}
                              {ad.targeting.interests.length > 3 && " ..."}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(ad.result)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(ad.spend)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(ad.costPerResult)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          {formatStatus(ad.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

