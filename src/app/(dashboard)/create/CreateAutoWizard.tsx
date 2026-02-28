"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
    Loader2, Upload, FileVideo, FileImage, AlertCircle,
    Target, Wallet, X, Rocket, User, Search, Check, ChevronsUpDown,
    MessageCircle, Play, Users, Plus, Trash2, Globe, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ──── Types ────────────────────────────────────────────────────────────────────
interface AdAccount { accountId: string; name: string; currency?: string; }
interface FbPage { pageId: string; name: string; username?: string | null; }
interface Beneficiary { id: string; name: string; }
interface LibraryVideo { id: string; title?: string | null; source?: string | null; thumbnail?: string | null; }
interface Interest { id: string; name: string; }
interface IceBreaker { question: string; payload: string; }
interface AiAnalysisResult {
    caption: string;
    headline: string;
    reasoning: string;
    audience: { ageMin: number; ageMax: number; interests: string[]; };
}

const OBJECTIVES = [
    { value: "OUTCOME_ENGAGEMENT", th: "Engagement (ปฏิสัมพันธ์)", en: "Engagement" },
    { value: "OUTCOME_TRAFFIC", th: "Traffic (เข้าชม)", en: "Traffic" },
    { value: "OUTCOME_LEADS", th: "Lead Generation", en: "Lead Generation" },
    { value: "OUTCOME_AWARENESS", th: "Awareness (การรับรู้)", en: "Awareness" },
    { value: "OUTCOME_SALES", th: "Sales (ยอดขาย)", en: "Sales" },
];

const COUNTRIES = [
    { code: "TH", name: "Thailand 🇹🇭" },
    { code: "US", name: "United States 🇺🇸" },
    { code: "GB", name: "United Kingdom 🇬🇧" },
    { code: "AU", name: "Australia 🇦🇺" },
    { code: "VN", name: "Vietnam 🇻🇳" },
    { code: "ID", name: "Indonesia 🇮🇩" },
    { code: "MY", name: "Malaysia 🇲🇾" },
    { code: "SG", name: "Singapore 🇸🇬" },
    { code: "JP", name: "Japan 🇯🇵" },
];

// ──── Component ────────────────────────────────────────────────────────────────
export default function CreateAutoWizard() {
    const { language } = useTheme();
    const isThai = language === "th";
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    // ── Data ────
    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [pages, setPages] = useState<FbPage[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // ── Form fields ────
    const [adAccountId, setAdAccountId] = useState("");
    const [pageId, setPageId] = useState("");
    const [beneficiaryId, setBeneficiaryId] = useState("");
    const [beneficiaryManualId, setBeneficiaryManualId] = useState("");
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);

    const [campaignObjective, setCampaignObjective] = useState("OUTCOME_ENGAGEMENT");
    const [targetCountry, setTargetCountry] = useState("TH");
    const [dailyBudget, setDailyBudget] = useState(20);
    const [campaignCount, setCampaignCount] = useState(1);
    const [adSetCount, setAdSetCount] = useState(1);
    const [adsCount, setAdsCount] = useState(1);
    const [placements, setPlacements] = useState(["facebook"]);
    const [ageMin, setAgeMin] = useState(20);
    const [ageMax, setAgeMax] = useState(50);
    const [manualInterests, setManualInterests] = useState<Interest[]>([]);
    const [exclusionAudienceIds, setExclusionAudienceIds] = useState<string[]>([]);
    const [useExclusion, setUseExclusion] = useState(false);

    const [primaryText, setPrimaryText] = useState("");
    const [headline, setHeadline] = useState("");
    const [greeting, setGreeting] = useState("");
    const [iceBreakers, setIceBreakers] = useState<IceBreaker[]>([{ question: "", payload: "" }]);

    // ── Media ────
    const [adSource, setAdSource] = useState<"upload" | "library">("upload");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
    const [library, setLibrary] = useState<LibraryVideo[]>([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Templates ────
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    // ── AI Analysis ────
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);

    // ── Search states ────
    const [accountSearch, setAccountSearch] = useState("");
    const [pageSearch, setPageSearch] = useState("");
    const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
    const [pagePopoverOpen, setPagePopoverOpen] = useState(false);
    const [interestSearch, setInterestSearch] = useState("");
    const [foundInterests, setFoundInterests] = useState<Interest[]>([]);
    const [searchingInterests, setSearchingInterests] = useState(false);
    const [customAudiences, setCustomAudiences] = useState<{ id: string; name: string }[]>([]);

    // ──── Load accounts & pages ────────────────────────────────────────────────
    useEffect(() => {
        setLoadingData(true);
        Promise.all([
            fetch("/api/manager-accounts").then((r) => r.json()).catch(() => []),
            fetch("/api/facebook-pages").then((r) => r.json()).catch(() => []),
        ]).then(([accData, pageData]) => {
            // Only show accounts/pages enabled (isActive) in Settings
            setAdAccounts(Array.isArray(accData) ? accData.filter((a: any) => a.isActive) : []);
            setPages(Array.isArray(pageData) ? pageData.filter((p: any) => p.isActive) : []);
        }).finally(() => setLoadingData(false));
    }, []);

    useEffect(() => {
        if (!adAccountId) { setBeneficiaries([]); return; }
        setLoadingBeneficiaries(true);
        fetch(`/api/facebook/beneficiaries?adAccountId=${encodeURIComponent(adAccountId)}`)
            .then((r) => r.json())
            .then((d) => {
                const list: Beneficiary[] = d.beneficiaries || [];
                setBeneficiaries(list);
                if (list[0] && !beneficiaryId) setBeneficiaryId(list[0].id);
            })
            .catch(() => setBeneficiaries([]))
            .finally(() => setLoadingBeneficiaries(false));
    }, [adAccountId]);

    useEffect(() => {
        if (!adAccountId) { setLibrary([]); return; }
        setLibraryLoading(true);
        fetch(`/api/facebook/ad-videos?adAccountId=${encodeURIComponent(adAccountId)}`)
            .then((r) => r.json())
            .then((d) => setLibrary(d.videos || []))
            .catch(() => setLibrary([]))
            .finally(() => setLibraryLoading(false));
    }, [adAccountId]);

    useEffect(() => {
        if (!adAccountId) { setCustomAudiences([]); return; }
        const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
        fetch(`/api/facebook/custom-audiences?adAccountId=${encodeURIComponent(actId)}`)
            .then((r) => r.json())
            .then((d) => setCustomAudiences((d.audiences || []).map((a: any) => ({ id: a.id, name: a.name || a.id }))))
            .catch(() => setCustomAudiences([]));
    }, [adAccountId]);

    useEffect(() => {
        if (!pageId) { setTemplates([]); setSelectedTemplateId(null); return; }
        setTemplatesLoading(true);
        fetch(`/api/test-templates?pageId=${encodeURIComponent(pageId)}`)
            .then((r) => r.json())
            .then((d) => {
                const forms = d.templates || [];
                setTemplates(forms);
                if (forms.length > 0) setSelectedTemplateId(forms[0].id);
            })
            .catch(() => setTemplates([]))
            .finally(() => setTemplatesLoading(false));
    }, [pageId]);

    useEffect(() => {
        if (!interestSearch || interestSearch.length < 2) { setFoundInterests([]); return; }
        const timer = setTimeout(() => {
            setSearchingInterests(true);
            fetch(`/api/targeting/search?q=${encodeURIComponent(interestSearch)}`)
                .then((r) => r.json())
                .then((d) => setFoundInterests(d.interests || []))
                .finally(() => setSearchingInterests(false));
        }, 400);
        return () => clearTimeout(timer);
    }, [interestSearch]);

    // ──── Helpers ──────────────────────────────────────────────────────────────
    const selectedAccountName = useMemo(() => adAccounts.find((a) => a.accountId === adAccountId)?.name || adAccountId, [adAccounts, adAccountId]);
    const selectedPageName = useMemo(() => pages.find((p) => p.pageId === pageId)?.name || pageId, [pages, pageId]);
    const hasMedia = !!mediaFile || !!selectedLibraryId;

    const togglePlacement = (p: string) =>
        setPlacements((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

    const addInterest = (i: Interest) => {
        if (manualInterests.some((x) => x.id === i.id)) return;
        setManualInterests((p) => [...p, i]);
        setInterestSearch("");
        setFoundInterests([]);
    };

    // ──── AI Analyze ───────────────────────────────────────────────────────────
    const handleAiAnalyze = async () => {
        if (!hasMedia) {
            toast.error(isThai ? "เลือก media ก่อนวิเคราะห์" : "Please select media first");
            return;
        }
        setAiAnalyzing(true);
        setAiResult(null);
        try {
            const fd = new FormData();
            fd.append("objective", campaignObjective);
            fd.append("language", language);

            if (mediaFile) {
                if (mediaFile.type.startsWith("image/")) {
                    // Image file — send directly
                    fd.append("file", mediaFile);
                } else if (mediaFile.type.startsWith("video/")) {
                    // Video file — extract first frame using canvas then send as JPEG
                    try {
                        const frameBlob = await new Promise<Blob>((resolve, reject) => {
                            const video = document.createElement("video");
                            video.muted = true;
                            video.playsInline = true;
                            const url = URL.createObjectURL(mediaFile);
                            video.src = url;
                            video.currentTime = 1; // seek to 1s for better frame
                            video.onloadeddata = () => { video.currentTime = 1; };
                            video.onseeked = () => {
                                try {
                                    const canvas = document.createElement("canvas");
                                    canvas.width = video.videoWidth || 640;
                                    canvas.height = video.videoHeight || 360;
                                    const ctx = canvas.getContext("2d");
                                    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                                    canvas.toBlob((blob) => {
                                        URL.revokeObjectURL(url);
                                        if (blob) resolve(blob);
                                        else reject(new Error("Canvas toBlob failed"));
                                    }, "image/jpeg", 0.92);
                                } catch (err) {
                                    URL.revokeObjectURL(url);
                                    reject(err);
                                }
                            };
                            video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Video load failed")); };
                        });
                        const frameFile = new File([frameBlob], "frame.jpg", { type: "image/jpeg" });
                        fd.append("file", frameFile);
                    } catch {
                        toast.error(isThai ? "ไม่สามารถดึง frame จาก video ได้" : "Could not extract frame from video");
                        setAiAnalyzing(false);
                        return;
                    }
                } else {
                    toast.error(isThai ? "ไฟล์ประเภทนี้ไม่รองรับ" : "Unsupported file type");
                    setAiAnalyzing(false);
                    return;
                }
            } else if (selectedLibraryId) {
                const vid = library.find((v) => v.id === selectedLibraryId);
                const thumbUrl = vid?.thumbnail || vid?.source;
                if (!thumbUrl) {
                    toast.error(isThai ? "ไม่พบ thumbnail ของ video นี้" : "No thumbnail found for this video");
                    setAiAnalyzing(false);
                    return;
                }
                // Fetch thumbnail as blob from frontend (avoids CDN auth issues on server)
                try {
                    const imgRes = await fetch(thumbUrl);
                    const blob = await imgRes.blob();
                    const thumbFile = new File([blob], "thumbnail.jpg", { type: blob.type || "image/jpeg" });
                    fd.append("file", thumbFile);
                } catch {
                    // Fallback: send URL and let backend try
                    fd.append("imageUrl", thumbUrl);
                }
            }

            const res = await fetch("/api/ai/analyze-video", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "AI analysis failed");

            setAiResult(data);
            setAiPanelOpen(true);
            toast.success(isThai ? "✨ AI วิเคราะห์เสร็จแล้ว!" : "✨ AI analysis complete!");
        } catch (e: any) {
            toast.error(isThai ? "AI วิเคราะห์ไม่สำเร็จ" : "AI analysis failed", { description: e.message });
        } finally {
            setAiAnalyzing(false);
        }
    };

    const applyAiCaption = () => {
        if (!aiResult) return;
        setPrimaryText(aiResult.caption);
        setHeadline(aiResult.headline);
        toast.success(isThai ? "✅ นำแคปชั่น AI ไปใช้แล้ว" : "✅ AI caption applied!");
    };

    const applyAiAudience = () => {
        if (!aiResult) return;
        setAgeMin(aiResult.audience.ageMin);
        setAgeMax(aiResult.audience.ageMax);
        // Add interests as plain objects (without validated FB IDs — user can validate later)
        const newInterests = aiResult.audience.interests.map((name) => ({ id: name, name }));
        setManualInterests(newInterests);
        toast.success(isThai ? "✅ นำกลุ่มเป้าหมาย AI ไปใช้แล้ว" : "✅ AI audience applied!");
    };

    // ──── Launch ───────────────────────────────────────────────────────────────
    const handleLaunch = async () => {
        if (!adAccountId || !pageId) {
            toast.error(isThai ? "กรุณาเลือกบัญชีโฆษณาและเพจก่อน" : "Please select Ad Account and Page first");
            return;
        }
        if (!hasMedia) {
            toast.error(isThai ? "กรุณาเลือกสื่อโฆษณาก่อน" : "Please select or upload media first");
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            const actId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
            fd.append("adAccountId", actId);
            fd.append("pageId", pageId);
            fd.append("campaignObjective", campaignObjective);
            fd.append("dailyBudget", String(dailyBudget));
            fd.append("campaignCount", String(campaignCount));
            fd.append("adSetCount", String(adSetCount));
            fd.append("adsCount", String(adsCount));
            fd.append("targetCountry", targetCountry);
            fd.append("placements", placements.join(","));
            fd.append("ageMin", String(ageMin));
            fd.append("ageMax", String(ageMax));
            if (primaryText) fd.append("primaryText", primaryText);
            if (headline) fd.append("headline", headline);
            if (useExclusion && exclusionAudienceIds.length > 0) fd.append("exclusionAudienceIds", JSON.stringify(exclusionAudienceIds));

            // Templates vs Manual Icebreakers
            if (selectedTemplateId && selectedTemplateId !== "manual") {
                fd.append("templateId", selectedTemplateId);
            } else {
                const validIce = iceBreakers.filter((ib) => ib.question.trim());
                if (validIce.length > 0) fd.append("iceBreakers", JSON.stringify(validIce));
                if (greeting) fd.append("greeting", greeting);
            }

            if (mediaFile) {
                fd.append("file", mediaFile);
                fd.append("mediaType", mediaFile.type.startsWith("video/") ? "video" : "image");
            } else if (selectedLibraryId) {
                fd.append("existingFbVideoId", selectedLibraryId);
                fd.append("mediaType", "video");
                const vid = library.find((v) => v.id === selectedLibraryId);
                if (vid?.source) fd.append("existingFbVideoUrl", vid.source);
            }

            const res = await fetch("/api/campaigns/create", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Campaign creation failed");

            toast.success(isThai ? "สร้างแคมเปญสำเร็จ! 🎉" : "Campaign created! 🎉", { description: data.message });
            setTimeout(() => router.push("/ads"), 2000);
        } catch (e: any) {
            toast.error(isThai ? "เกิดข้อผิดพลาด" : "Error", { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    // ──── Section header ───────────────────────────────────────────────────────
    const SectionHeader = ({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) => (
        <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
                <h2 className="text-base font-semibold leading-tight">{title}</h2>
                {sub && <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    );

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-2xl mx-auto pb-10">

            {/*  ── Section 1: Account & Page ─────────────────────────────────────  */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <SectionHeader icon={User}
                        title={isThai ? "บัญชี & เพจ" : "Account & Page"}
                        sub={isThai ? "เลือก Ad Account และ Facebook Page" : "Select Ad Account and Facebook Page"}
                    />
                    <div className="space-y-4">
                        {/* Ad Account */}
                        <div className="space-y-1.5">
                            <Label>{isThai ? "บัญชีโฆษณา" : "Ad Account"}</Label>
                            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {adAccountId ? <span className="truncate">{selectedAccountName}</span> : <span className="text-muted-foreground">{isThai ? "เลือกบัญชี..." : "Select account..."}</span>}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <div className="flex items-center border-b px-3">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input placeholder={isThai ? "ค้นหาบัญชี..." : "Search..."} value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
                                    </div>
                                    <div className="max-h-52 overflow-y-auto p-1">
                                        {adAccounts.filter((a) => !accountSearch || a.name.toLowerCase().includes(accountSearch.toLowerCase()) || a.accountId.includes(accountSearch)).map((a) => (
                                            <button key={a.accountId} type="button" onClick={() => { setAdAccountId(a.accountId); setAccountPopoverOpen(false); setAccountSearch(""); }} className={cn("relative flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-accent", adAccountId === a.accountId && "bg-accent")}>
                                                <div className="flex flex-col text-left"><span className="font-medium">{a.name}</span><span className="text-xs text-muted-foreground">ID: {a.accountId}</span></div>
                                                {adAccountId === a.accountId && <Check className="h-4 w-4 text-primary shrink-0" />}
                                            </button>
                                        ))}
                                        {adAccounts.length === 0 && <div className="py-5 text-center text-sm text-muted-foreground">{isThai ? "ไม่พบบัญชี" : "No accounts found"}</div>}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Facebook Page */}
                        <div className="space-y-1.5">
                            <Label>Facebook Page</Label>
                            <Popover open={pagePopoverOpen} onOpenChange={setPagePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {pageId ? <span className="truncate">{selectedPageName}</span> : <span className="text-muted-foreground">{isThai ? "เลือกเพจ..." : "Select page..."}</span>}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <div className="flex items-center border-b px-3">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input placeholder={isThai ? "ค้นหาเพจ..." : "Search..."} value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
                                    </div>
                                    <div className="max-h-52 overflow-y-auto p-1">
                                        {pages.filter((p) => !pageSearch || p.name.toLowerCase().includes(pageSearch.toLowerCase()) || p.pageId.includes(pageSearch)).map((p) => (
                                            <button key={p.pageId} type="button" onClick={() => { setPageId(p.pageId); setPagePopoverOpen(false); setPageSearch(""); }} className={cn("relative flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-2 text-sm hover:bg-accent", pageId === p.pageId && "bg-accent")}>
                                                <div className="flex flex-col text-left"><span className="font-medium">{p.name}</span>{p.username && <span className="text-xs text-muted-foreground">@{p.username}</span>}</div>
                                                {pageId === p.pageId && <Check className="h-4 w-4 text-primary shrink-0" />}
                                            </button>
                                        ))}
                                        {pages.length === 0 && <div className="py-5 text-center text-sm text-muted-foreground">{isThai ? "ไม่พบเพจ" : "No pages found"}</div>}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Beneficiary */}
                        {targetCountry === "TH" && (
                            <div className="md:col-span-2 space-y-2 border rounded-lg p-3 bg-muted/30">
                                <Label className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-primary" />
                                    {isThai ? "ข้อมูลผู้รับผลประโยชน์ (Beneficiary)" : "Beneficiary Information"}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isThai
                                        ? "Facebook บังคับระบุผู้รับผลประโยชน์สำหรับโฆษณาในไทย กรุณาเลือกหรือกรอก ID ที่ได้รับการยืนยันแล้ว"
                                        : "Facebook requires a verified beneficiary for Thailand ads. Select or enter a verified ID."}
                                </p>

                                {/* Loaded from API */}
                                {loadingBeneficiaries && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {isThai ? "กำลังโหลด..." : "Loading beneficiaries..."}
                                    </div>
                                )}

                                {!loadingBeneficiaries && beneficiaries.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs opacity-70">{isThai ? "รายการที่ยืนยันแล้ว" : "Verified list"}</Label>
                                        <div className="space-y-1.5">
                                            {beneficiaries.map((b) => (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => { setBeneficiaryId(b.id); setBeneficiaryManualId(""); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors",
                                                        beneficiaryId === b.id && !beneficiaryManualId
                                                            ? "border-primary bg-primary/5 text-primary font-medium"
                                                            : "border-border hover:bg-muted"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-3.5 w-3.5 rounded-full border-2 shrink-0 transition-colors",
                                                        beneficiaryId === b.id && !beneficiaryManualId
                                                            ? "border-primary bg-primary"
                                                            : "border-muted-foreground"
                                                    )} />
                                                    <span className="truncate">{b.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Manual input — always visible */}
                                <div className="space-y-1">
                                    <Label className="text-xs opacity-70">
                                        {isThai ? "กรอก Beneficiary ID โดยตรง" : "Enter Beneficiary ID directly"}
                                    </Label>
                                    <Input
                                        className="h-9"
                                        placeholder={isThai ? "เช่น 123456789101112" : "e.g. 123456789101112"}
                                        value={beneficiaryManualId}
                                        onChange={(e) => {
                                            setBeneficiaryManualId(e.target.value);
                                            if (e.target.value) setBeneficiaryId("");
                                        }}
                                    />
                                    {beneficiaryManualId && (
                                        <p className="text-xs text-primary font-medium">
                                            ✓ {isThai ? "จะใช้ ID นี้:" : "Using ID:"} {beneficiaryManualId}
                                        </p>
                                    )}
                                    {!beneficiaryManualId && beneficiaryId && (
                                        <p className="text-xs text-primary font-medium">
                                            ✓ {isThai ? "เลือกแล้ว ID:" : "Selected ID:"} {beneficiaryId}
                                        </p>
                                    )}
                                    {!beneficiaryManualId && !beneficiaryId && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            ⚠ {isThai ? "กรุณาระบุ Beneficiary ID" : "Please enter a Beneficiary ID"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </CardContent>
            </Card>

            {/*  ── Section 2: Media ──────────────────────────────────────────────  */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <SectionHeader icon={FileVideo}
                        title={isThai ? "สื่อโฆษณา" : "Ad Media"}
                        sub={isThai ? "อัปโหลดรูปหรือวิดีโอ หรือเลือกจากคลัง Facebook" : "Upload image/video or pick from your Facebook library"}
                    />
                    <div className="flex gap-2 mb-4">
                        {(["upload", "library"] as const).map((src) => (
                            <Button key={src} variant={adSource === src ? "default" : "outline"} size="sm" onClick={() => setAdSource(src)}>
                                {src === "upload" ? <><Upload className="mr-1.5 h-3.5 w-3.5" />{isThai ? "อัปโหลด" : "Upload"}</> : <><FileVideo className="mr-1.5 h-3.5 w-3.5" />{isThai ? "คลัง FB" : "FB Library"}</>}
                            </Button>
                        ))}
                    </div>

                    {adSource === "upload" && (
                        <div className="space-y-3">
                            <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 cursor-pointer hover:bg-muted/40 transition-colors">
                                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">{isThai ? "คลิกเพื่อเลือกไฟล์" : "Click to select file"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, MP4, MOV</p>
                                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setMediaFile(f); setSelectedLibraryId(null); } }} />
                            </div>
                            {mediaFile && (
                                <div className="flex items-center gap-3 rounded-lg border p-3">
                                    {mediaFile.type.startsWith("video/") ? <FileVideo className="h-7 w-7 text-violet-500 shrink-0" /> : <FileImage className="h-7 w-7 text-blue-500 shrink-0" />}
                                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{mediaFile.name}</p><p className="text-xs text-muted-foreground">{(mediaFile.size / 1024 / 1024).toFixed(1)} MB</p></div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMediaFile(null)}><X className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                    )}

                    {adSource === "library" && (
                        <div className="space-y-3">
                            {!adAccountId && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-400"><AlertCircle className="h-4 w-4 shrink-0" />{isThai ? "เลือกบัญชีโฆษณาก่อน" : "Select an ad account first"}</div>}
                            {libraryLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{isThai ? "กำลังโหลด..." : "Loading..."}</div>}
                            {!libraryLoading && library.length === 0 && adAccountId && <p className="text-sm text-muted-foreground">{isThai ? "ไม่พบวิดีโอในบัญชีนี้" : "No videos found"}</p>}
                            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                                {library.map((vid) => (
                                    <div key={vid.id} onClick={() => { setSelectedLibraryId(vid.id); setMediaFile(null); }} className={cn("relative cursor-pointer rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary transition-all", selectedLibraryId === vid.id && "ring-2 ring-primary")}>
                                        {vid.thumbnail ? <img src={vid.thumbnail} alt={vid.title || ""} className="w-full h-16 object-cover" /> : <div className="w-full h-16 bg-muted flex items-center justify-center"><Play className="h-5 w-5 text-muted-foreground" /></div>}
                                        {selectedLibraryId === vid.id && <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5"><Check className="h-3 w-3 text-white" /></div>}
                                        <p className="text-xs p-1 truncate">{vid.title || vid.id}</p>
                                    </div>
                                ))}
                            </div>
                            {selectedLibraryId && <Button variant="outline" size="sm" onClick={() => setSelectedLibraryId(null)}><X className="mr-1.5 h-3 w-3" />{isThai ? "ยกเลิก" : "Clear"}</Button>}
                        </div>
                    )}

                    {/* ── AI Analyze Button ── */}
                    {hasMedia && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAiAnalyze}
                                disabled={aiAnalyzing}
                                className="w-full border-dashed border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-500 transition-all font-medium"
                            >
                                {aiAnalyzing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isThai ? "AI กำลังวิเคราะห์..." : "Analyzing..."}</>
                                ) : (
                                    <><Sparkles className="mr-2 h-4 w-4" />{isThai ? "✨ วิเคราะห์ด้วย AI — สร้างแคปชั่น + กลุ่มเป้าหมาย" : "✨ AI Analyze — Generate caption & audience"}</>
                                )}
                            </Button>

                            {/* AI Result Panel */}
                            {aiResult && (
                                <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-b from-violet-50/80 to-white dark:from-violet-900/20 dark:to-transparent overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setAiPanelOpen((v) => !v)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-100/50 dark:hover:bg-violet-800/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                                            <Sparkles className="h-4 w-4" />
                                            {isThai ? "ผลการวิเคราะห์จาก AI" : "AI Analysis Result"}
                                        </div>
                                        {aiPanelOpen
                                            ? <ChevronUp className="h-4 w-4 text-violet-500" />
                                            : <ChevronDown className="h-4 w-4 text-violet-500" />}
                                    </button>

                                    {aiPanelOpen && (
                                        <div className="px-4 pb-4 space-y-4">
                                            {aiResult.reasoning && (
                                                <p className="text-xs text-violet-600 dark:text-violet-400 italic bg-violet-100/60 dark:bg-violet-800/20 rounded-lg px-3 py-2">
                                                    💡 {aiResult.reasoning}
                                                </p>
                                            )}

                                            {/* Caption block */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                                                        📝 {isThai ? "แคปชั่น + Headline" : "Caption + Headline"}
                                                    </Label>
                                                    <Button size="sm" className="h-6 text-xs px-3 bg-violet-600 hover:bg-violet-700 text-white" onClick={applyAiCaption}>
                                                        {isThai ? "ใช้เลย" : "Apply"}
                                                    </Button>
                                                </div>
                                                <div className="rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-violet-950/30 p-3 space-y-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Primary Text</p>
                                                        <p className="text-sm leading-relaxed whitespace-pre-line">{aiResult.caption}</p>
                                                    </div>
                                                    <Separator />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Headline</p>
                                                        <p className="text-sm font-semibold">{aiResult.headline}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Audience block */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                                                        🎯 {isThai ? "กลุ่มเป้าหมายที่แนะนำ" : "Suggested Audience"}
                                                    </Label>
                                                    <Button size="sm" className="h-6 text-xs px-3 bg-violet-600 hover:bg-violet-700 text-white" onClick={applyAiAudience}>
                                                        {isThai ? "ใช้เลย" : "Apply"}
                                                    </Button>
                                                </div>
                                                <div className="rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-violet-950/30 p-3 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span>{isThai ? "ช่วงอายุ" : "Age range"}: <strong>{aiResult.audience.ageMin}–{aiResult.audience.ageMax} {isThai ? "ปี" : "years"}</strong></span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {aiResult.audience.interests.map((interest) => (
                                                            <Badge key={interest} variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                                                                {interest}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/*  ── Section 3: Strategy & Budget ─────────────────────────────────  */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <SectionHeader icon={Target}
                        title="Strategy & Budget"
                        sub={isThai ? "วัตถุประสงค์ งบประมาณ และกลุ่มเป้าหมาย" : "Objective, budget, and targeting"}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>{isThai ? "วัตถุประสงค์" : "Objective"}</Label>
                            <Select value={campaignObjective} onValueChange={setCampaignObjective}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o.value} value={o.value}>{isThai ? o.th : o.en}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label><Globe className="inline h-3.5 w-3.5 mr-1" />{isThai ? "ประเทศ" : "Country"}</Label>
                            <Select value={targetCountry} onValueChange={setTargetCountry}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label><Wallet className="inline h-3.5 w-3.5 mr-1" />{isThai ? "งบประมาณรายวัน" : "Daily Budget"}</Label>
                            <Input type="number" min={1} value={dailyBudget} onChange={(e) => setDailyBudget(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{isThai ? "โครงสร้าง (Campaign × AdSet × Ad)" : "Structure (Campaign × AdSet × Ad)"}</Label>
                            <div className="flex gap-1.5 items-center">
                                <Input type="number" min={1} max={5} value={campaignCount} onChange={(e) => setCampaignCount(Number(e.target.value))} className="text-center px-2" />
                                <span className="text-muted-foreground text-sm">×</span>
                                <Input type="number" min={1} max={10} value={adSetCount} onChange={(e) => setAdSetCount(Number(e.target.value))} className="text-center px-2" />
                                <span className="text-muted-foreground text-sm">×</span>
                                <Input type="number" min={1} max={10} value={adsCount} onChange={(e) => setAdsCount(Number(e.target.value))} className="text-center px-2" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label><Users className="inline h-3.5 w-3.5 mr-1" />{isThai ? "อายุขั้นต่ำ" : "Age Min"}</Label>
                            <Input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label><Users className="inline h-3.5 w-3.5 mr-1" />{isThai ? "อายุสูงสุด" : "Age Max"}</Label>
                            <Input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Placements */}
                    <div className="mt-4 space-y-1.5">
                        <Label>Placements</Label>
                        <div className="flex flex-wrap gap-2">
                            {["facebook", "instagram", "messenger"].map((p) => (
                                <button key={p} type="button" onClick={() => togglePlacement(p)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium border transition-colors capitalize", placements.includes(p) ? "bg-primary text-primary-foreground border-primary" : "border-muted hover:bg-muted")}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Interests */}
                    <div className="mt-4 space-y-1.5">
                        <Label><Target className="inline h-3.5 w-3.5 mr-1" />{isThai ? "Interests (ไม่บังคับ)" : "Interests (optional)"}</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={isThai ? "ค้นหา เช่น cosmetics..." : "Search e.g. cosmetics..."} value={interestSearch} onChange={(e) => setInterestSearch(e.target.value)} className="pl-9" />
                        </div>
                        {searchingInterests && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{isThai ? "กำลังค้นหา..." : "Searching..."}</div>}
                        {foundInterests.length > 0 && (
                            <div className="rounded-lg border bg-popover shadow-md max-h-40 overflow-y-auto">
                                {foundInterests.map((i) => <button key={i.id} type="button" onClick={() => addInterest(i)} className="w-full flex items-center px-3 py-2 text-sm hover:bg-accent text-left gap-2"><Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{i.name}</button>)}
                            </div>
                        )}
                        {manualInterests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {manualInterests.map((i) => (
                                    <Badge key={i.id} variant="secondary" className="gap-1">{i.name}<button onClick={() => setManualInterests((p) => p.filter((x) => x.id !== i.id))}><X className="h-3 w-3" /></button></Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Exclusion audiences */}
                    {customAudiences.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Switch checked={useExclusion} onCheckedChange={setUseExclusion} id="exc-toggle" />
                                <Label htmlFor="exc-toggle">{isThai ? "ตัดกลุ่มที่ซื้อแล้ว (Custom Audiences)" : "Exclude custom audiences"}</Label>
                            </div>
                            {useExclusion && (
                                <div className="rounded-lg border p-3 space-y-1 max-h-36 overflow-y-auto">
                                    {customAudiences.map((a) => (
                                        <div key={a.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5" onClick={() => setExclusionAudienceIds((p) => p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id])}>
                                            <Checkbox checked={exclusionAudienceIds.includes(a.id)} />
                                            <span className="truncate">{a.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/*  ── Section 4: Ad Copy (optional) ────────────────────────────────  */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <SectionHeader icon={Newspaper}
                        title={isThai ? "ข้อความโฆษณา (ไม่บังคับ)" : "Ad Copy (optional)"}
                        sub={isThai ? "ถ้าว่างจะใช้รูป/วิดีโอเป็นหลัก" : "If left empty, media will be used without text"}
                    />
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label>{isThai ? "Primary Text" : "Primary Text"}</Label>
                            <Textarea placeholder={isThai ? "ข้อความโฆษณาหลัก..." : "Main ad text..."} value={primaryText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryText(e.target.value)} rows={3} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Headline</Label>
                            <Input placeholder={isThai ? "หัวเรื่อง..." : "Headline..."} value={headline} onChange={(e) => setHeadline(e.target.value)} />
                        </div>
                    </div>

                    {placements.includes("messenger") && (
                        <>
                            <Separator className="my-5" />
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-semibold">{isThai ? "ข้อความแชท (Messenger)" : "Messenger Template"}</span>
                                    {templatesLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-2" />}
                                </div>

                                {templates.length > 0 ? (
                                    <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
                                        <div className="space-y-1.5">
                                            <Label>{isThai ? "เลือกเทมเพลตที่บันทึกไว้" : "Select saved template"}</Label>
                                            <Select value={selectedTemplateId || "manual"} onValueChange={setSelectedTemplateId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isThai ? "เลือกการตั้งค่าแชท..." : "Select chat setup..."} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="manual" className="font-semibold text-blue-600 dark:text-blue-400">
                                                        {isThai ? "+ สร้างใหม่ (กำหนดเอง)" : "+ Create New (Manual)"}
                                                    </SelectItem>
                                                    {templates.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {isThai
                                            ? "คุณสามารถสร้างเทมเพลตที่ใช้บ่อยได้ใน Ads Manager หรือทำการตั้งค่าข้อความต้อนรับใหม่ที่นี่"
                                            : "You can create saved templates in Ads Manager, or configure a new welcome message here."}
                                    </div>
                                )}

                                {(!selectedTemplateId || selectedTemplateId === "manual") && (
                                    <div className="space-y-3 mt-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{isThai ? "ข้อความต้อนรับ" : "Greeting"}</Label>
                                            <Input placeholder={isThai ? "สวัสดีครับ 👋" : "Hello! 👋"} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            {iceBreakers.map((ib, idx) => (
                                                <div key={idx} className="flex gap-2 items-end">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs">{isThai ? `คำถาม ${idx + 1}` : `Question ${idx + 1}`}</Label>
                                                        <Input placeholder={isThai ? "เช่น ดูสินค้าเพิ่มเติม" : "e.g. View products"} value={ib.question}
                                                            onChange={(e) => { const u = [...iceBreakers]; u[idx] = { question: e.target.value, payload: e.target.value }; setIceBreakers(u); }} />
                                                    </div>
                                                    {iceBreakers.length > 1 && <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIceBreakers((p) => p.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                                                </div>
                                            ))}
                                            {iceBreakers.length < 5 && <Button variant="outline" size="sm" onClick={() => setIceBreakers((p) => [...p, { question: "", payload: "" }])}><Plus className="mr-1.5 h-3.5 w-3.5" />{isThai ? "เพิ่มคำถาม" : "Add question"}</Button>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/*  ── Launch ────────────────────────────────────────────────────────  */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-400 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{isThai ? "แคมเปญจะสร้างในสถานะ PAUSED — ไปเปิดใช้งานใน Ads Manager หลังตรวจสอบ" : "Campaigns will be created as PAUSED — activate in Ads Manager after review"}</span>
            </div>

            <Button onClick={handleLaunch} disabled={loading || !adAccountId || !pageId || !hasMedia} size="lg" className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isThai ? "กำลังสร้าง..." : "Creating..."}</> : <><Rocket className="mr-2 h-4 w-4" />{isThai ? "สร้างแคมเปญ" : "Launch Campaign"}</>}
            </Button>
        </div>
    );
}

// Newspaper icon (not in default lucide imports)
function Newspaper({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-1.447 2.894A2 2 0 0 0 4 22Z" />
            <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
        </svg>
    );
}
