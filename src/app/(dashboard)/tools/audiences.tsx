"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Users, Loader2, Plus, ChevronsUpDown, Search, ExternalLink, Sparkles, CheckCircle2, XCircle, RefreshCw, Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";

const AUDIENCE_TYPE_LABELS: Record<string, { th: string; en: string }> = {
    page_engaged: { th: "คนที่มีส่วนร่วมกับเพจ", en: "People who engaged with page" },
    page_visited: { th: "คนที่เคยเข้ามาดูเพจ", en: "People who visited page" },
    page_messaged: { th: "คนที่เคยส่งข้อความหาเพจ", en: "People who messaged page" },
    page_post_interaction: { th: "คนที่มีส่วนร่วมกับโพสต์หรือโฆษณา", en: "People who engaged with post/ad" },
    page_cta_clicked: { th: "คนที่คลิกปุ่ม Call-to-Action", en: "People who clicked CTA" },
    page_or_post_save: { th: "คนที่บันทึกเพจหรือโพสต์", en: "People who saved page/post" },
    page_liked: { th: "คนที่กดถูกใจหรือติดตามเพจ", en: "People who liked or followed page" },
};

interface CustomAudience {
    id: string;
    name: string;
    subtype?: string;
    accountId?: string;
    accountName?: string;
}

type TabKey = "engagement" | "lookalike" | "interest";

interface InterestPreset {
    id: string;
    name: string;
    description?: string | null;
    interests: Array<{ id: string; name: string }>;
}

export default function AudiencesPage({ activeTab }: { activeTab: TabKey }) {
    const { language } = useTheme();
    const isThai = language === 'th';

    // Emulate useAdAccount context with local state populated from /api/manager-accounts
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]); // simplified for this port
    const [accountsLoading, setAccountsLoading] = useState(true);

    const [adAccountIds, setAdAccountIds] = useState<string[]>([]);
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

    const [audienceName, setAudienceName] = useState("");
    const [retentionDays, setRetentionDays] = useState(365);
    const [audienceTypes, setAudienceTypes] = useState<string[]>(["page_messaged"]);
    const [audiences, setAudiences] = useState<CustomAudience[]>([]);

    const [loadingAudiences, setLoadingAudiences] = useState(false);
    const [creating, setCreating] = useState(false);
    const [creationProgress, setCreationProgress] = useState<Record<string, "creating" | "success" | "error">>({});
    const [deleteTarget, setDeleteTarget] = useState<CustomAudience | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [pageSearch, setPageSearch] = useState("");
    const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
    const [pagePopoverOpen, setPagePopoverOpen] = useState(false);
    const [audienceTypePopoverOpen, setAudienceTypePopoverOpen] = useState(false);

    const [lookalikeOriginId, setLookalikeOriginId] = useState("");
    const [lookalikeName, setLookalikeName] = useState("");
    const [lookalikeCountry, setLookalikeCountry] = useState("TH");
    const [lookalikeRatio, setLookalikeRatio] = useState(0.01);
    const [lookalikeType, setLookalikeType] = useState<"similarity" | "reach">("similarity");
    const [lookalikeOriginOpen, setLookalikeOriginOpen] = useState(false);

    // Interest (AI) state
    const [interestDescription, setInterestDescription] = useState("");
    const [interestManualInput, setInterestManualInput] = useState("");
    const [interestGenerating, setInterestGenerating] = useState(false);
    const [suggestedInterests, setSuggestedInterests] = useState<Array<{ id: string; name: string }>>([]);
    const [interestPresetName, setInterestPresetName] = useState("");
    const [interestPresets, setInterestPresets] = useState<InterestPreset[]>([]);
    const [interestSaving, setInterestSaving] = useState(false);

    // Load accounts and pages
    useEffect(() => {
        async function loadAccountsAndPages() {
            try {
                // Fetch Ad Accounts
                const resAccounts = await fetch("/api/manager-accounts");
                const dataAccounts = await resAccounts.json();
                if (resAccounts.ok) {
                    const activeAccounts = dataAccounts.filter((a: any) => a.isActive);
                    setAdAccounts(activeAccounts);
                    if (activeAccounts.length > 0) {
                        setAdAccountIds([activeAccounts[0].accountId]);
                    }
                }

                // Fetch Facebook Pages
                const resPages = await fetch("/api/facebook-pages");
                const dataPages = await resPages.json();
                if (resPages.ok) {
                    const activePages = dataPages.filter((p: any) => p.isActive);
                    setPages(activePages);
                    if (activePages.length > 0) {
                        setSelectedPageIds([activePages[0].pageId]);
                    }
                }
            } catch (e) {
                console.error("Failed to load accounts or pages", e);
            } finally {
                setAccountsLoading(false);
            }
        }
        loadAccountsAndPages();
    }, []);

    const loadAudiences = useCallback(() => {
        const ids = adAccountIds.length > 0 ? adAccountIds : [];
        if (ids.length === 0) {
            setAudiences([]);
            return;
        }
        setLoadingAudiences(true);
        const norm = (id: string) => (String(id || "").startsWith("act_") ? id : `act_${id}`);

        Promise.all(
            ids.map((actId) => {
                const n = norm(actId);
                return fetch(`/api/facebook/custom-audiences?adAccountId=${encodeURIComponent(n)}`, { cache: "no-store" })
                    .then((r) => r.json())
                    .then((d) => ({ actId: n, data: d, ok: !d.error }));
            })
        )
            .then((results) => {
                const merged: CustomAudience[] = [];
                results.forEach(({ actId, data, ok }) => {
                    const acc = adAccounts.find((a: any) => a.accountId === actId || a.accountId === actId.replace(/^act_/, ""));
                    const accountName = acc?.name || actId;
                    if (ok && !data.error) {
                        (data.audiences || []).forEach((a: any) => {
                            if (a?.id) merged.push({ ...a, accountId: actId, accountName });
                        });
                    }
                });
                setAudiences(merged);
            })
            .finally(() => setLoadingAudiences(false));
    }, [adAccountIds, adAccounts]);

    useEffect(() => {
        if (adAccountIds.length > 0) loadAudiences();
        else setAudiences([]);
    }, [adAccountIds.length, loadAudiences]);

    const loadInterestPresets = useCallback(async () => {
        try {
            const res = await fetch("/api/facebook/interest-audiences", { cache: "no-store" });
            const data = await res.json();
            if (data.presets) setInterestPresets(data.presets);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (activeTab === "interest") loadInterestPresets();
    }, [activeTab, loadInterestPresets]);

    const handleDelete = async () => {
        if (!deleteTarget?.accountId) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/facebook/custom-audiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", audienceId: deleteTarget.id, adAccountId: deleteTarget.accountId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            toast.success("ลบกลุ่มเป้าหมายสำเร็จ");
            setAudiences((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        } catch (e: any) {
            toast.error(e.message || "Failed to delete");
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleGenerateInterest = async () => {
        const manual = interestManualInput.trim();
        const desc = interestDescription.trim();

        if (!manual && (!desc || desc.length < 5)) {
            toast.error("กรุณใส่รายละเอียดก่อนครับ");
            return;
        }

        setInterestGenerating(true);
        setSuggestedInterests([]);
        try {
            const body: Record<string, unknown> = {
                action: "generate",
                adAccountId: adAccountIds[0] || undefined,
            };
            if (manual) body.manualInterests = manual;
            else body.description = desc;

            const res = await fetch("/api/facebook/interest-audiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate");
            }

            const list = data.validated || data.interests?.map((n: string) => ({ id: "", name: n })) || [];
            setSuggestedInterests(list);
            if (data.suggestedName) setInterestPresetName(data.suggestedName);
            else if (manual && !interestPresetName) setInterestPresetName(manual.split(/[,،、;]+/)[0]?.trim() || "");
        } catch (e: any) {
            toast.error(e.message || "Failed");
        } finally {
            setInterestGenerating(false);
        }
    };

    const handleSaveInterestPreset = async () => {
        if (!interestPresetName.trim() || suggestedInterests.length === 0) {
            toast.error("กรุณาระบุชื่อ Preset");
            return;
        }
        setInterestSaving(true);
        try {
            const res = await fetch("/api/facebook/interest-audiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save",
                    name: interestPresetName.trim(),
                    description: interestDescription.trim() || undefined,
                    interests: suggestedInterests,
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error || "Failed");

            toast.success("บันทึก Preset เรียบร้อยแล้ว");
            setSuggestedInterests([]);
            setInterestPresetName("");
            setInterestDescription("");
            loadInterestPresets();
        } catch (e: any) {
            toast.error(e.message || "Failed");
        } finally {
            setInterestSaving(false);
        }
    };

    const handleCreateEngagement = async () => {
        if (adAccountIds.length === 0 || selectedPageIds.length === 0) {
            toast.error("กรุณาเลือกบัญชีและเพจก่อนครับ");
            return;
        }
        const name = audienceName.trim() || "Engagement Audience";
        setCreating(true);
        setCreationProgress(Object.fromEntries(adAccountIds.map((id) => [id, "creating"])));

        const payload = {
            name,
            pageIds: selectedPageIds,
            retentionDays,
            audienceTypes: audienceTypes.length > 0 ? audienceTypes : ["page_messaged"],
        };

        try {
            const res = await fetch("/api/facebook/custom-audiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, adAccountIds }),
            });
            const data = await res.json();

            if (res.ok && data.created > 0) {
                toast.success(`สร้างสำเร็จ ${data.created} บัญชี`);
                setAudienceName("");
                loadAudiences();
            } else {
                toast.error("เกิดข้อผิดพลาดในการสร้างบางบัญชี");
            }

            // Update ui statuses (simplified)
            const newProgs: any = {};
            adAccountIds.forEach(id => newProgs[id] = "success");
            setCreationProgress(newProgs);
        } catch (e) {
            toast.error("ระบบขัดข้อง");
        } finally {
            setCreating(false);
            setTimeout(() => setCreationProgress({}), 2000);
        }
    };

    const handleCreateLookalike = async () => {
        if (!lookalikeOriginId || !lookalikeName.trim() || adAccountIds.length === 0) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        setCreating(true);
        setCreationProgress(Object.fromEntries(adAccountIds.map((id) => [id, "creating"])));

        const payload = {
            action: "create_lookalike",
            name: lookalikeName.trim(),
            originAudienceId: lookalikeOriginId,
            lookalikeCountry,
            lookalikeRatio,
            lookalikeType,
        };

        try {
            const res = await fetch("/api/facebook/custom-audiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, adAccountIds }),
            });
            const data = await res.json();

            if (res.ok && data.results) {
                toast.success(`สร้างลุคอะไลค์สำเร็จ`);
                setLookalikeName("");
                loadAudiences();
            }

            const newProgs: any = {};
            adAccountIds.forEach(id => newProgs[id] = "success");
            setCreationProgress(newProgs);
        } catch (e) {
            toast.error("ระบบขัดข้อง");
        } finally {
            setCreating(false);
            setTimeout(() => setCreationProgress({}), 2000);
        }
    };

    const toggleAccount = (accountId: string) => {
        setAdAccountIds((prev) =>
            prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
        );
    };

    const selectAllAccounts = () => {
        const all = adAccounts.map((a: any) => a.accountId).filter(Boolean);
        setAdAccountIds((prev) => (prev.length === all.length ? [] : all));
    };

    const togglePage = (pageId: string) => {
        setSelectedPageIds((prev) =>
            prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]
        );
    };

    const selectAllPages = () => {
        const all = pages.map((p: any) => p.pageId).filter(Boolean);
        setSelectedPageIds((prev) => (prev.length === all.length ? [] : all));
    };

    const toggleAudienceType = (type: string) => {
        setAudienceTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    if (accountsLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Simplified UI rendering block based on reference project port
    return (
        <div className="py-8 px-4 h-full overflow-y-auto">
            <div className="grid gap-6 max-w-3xl mx-auto">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>
                            {activeTab === "engagement" && (isThai ? "สร้าง Engagement Audience" : "Create Engagement Audience")}
                            {activeTab === "lookalike" && (isThai ? "สร้าง Lookalike Audience" : "Create Lookalike Audience")}
                            {activeTab === "interest" && (isThai ? "หาไอเดียกลุ่มเป้าหมายด้วย AI" : "Find Audience Ideas with AI")}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === "engagement" && (isThai ? "คัดกรองคนที่มีส่วนร่วมกับเพจของคุณ" : "Filter people who engaged with your page")}
                            {activeTab === "lookalike" && (isThai ? "ค้นหาคนที่มีพฤติกรรมคล้ายกับฐานลูกค้าเดิม" : "Find people similar to your existing customers")}
                            {activeTab === "interest" && (isThai ? "ใส่รายละเอียดสินค้า ให้ AI ช่วยคิด Interests ยิงแอดให้" : "Describe your product and let AI suggest targeting interests")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label>{isThai ? "เลือกบัญชีโฆษณา" : "Ad Account"}</Label>
                            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {adAccountIds.length > 0 ? (
                                            <span>{adAccountIds.length} {isThai ? "บัญชีที่เลือก" : "selected"}</span>
                                        ) : (
                                            <span className="text-muted-foreground">{isThai ? "เลือกบัญชี..." : "Select account..."}</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
                                    <div className="border-b px-3 py-2">
                                        <div className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent" onClick={selectAllAccounts}>
                                            <Checkbox checked={adAccountIds.length === adAccounts.length && adAccounts.length > 0} />
                                            {isThai ? "เลือกทั้งหมด" : "Select all"}
                                        </div>
                                    </div>
                                    <div className="max-h-[280px] overflow-y-auto p-1">
                                        {adAccounts.map((a: any) => (
                                            <div key={a.accountId} className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-accent" onClick={() => toggleAccount(a.accountId)}>
                                                <Checkbox checked={adAccountIds.includes(a.accountId)} />
                                                <span className="text-sm font-medium">{a.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* --- Engagement Tab --- */}
                        {activeTab === "engagement" && (
                            <>
                                <div className="space-y-2">
                                    <Label>{isThai ? "เงื่อนไข (Audience Type)" : "Audience Type"}</Label>
                                    <Popover open={audienceTypePopoverOpen} onOpenChange={setAudienceTypePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {audienceTypes.length > 0
                                                    ? <span>{isThai ? `เลือกแล้ว ${audienceTypes.length} แบบ` : `${audienceTypes.length} selected`}</span>
                                                    : <span className="text-muted-foreground">{isThai ? "เลือกพฤติกรรม..." : "Select behavior..."}</span>}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                                            <div className="p-1">
                                                {Object.entries(AUDIENCE_TYPE_LABELS).map(([key, labels]) => (
                                                    <div key={key} className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-accent cursor-pointer" onClick={() => toggleAudienceType(key)}>
                                                        <Checkbox checked={audienceTypes.includes(key)} />
                                                        <span className="text-sm">{isThai ? labels.th : labels.en}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>{isThai ? "เพจเฟสบุ๊ค" : "Facebook Pages"}</Label>
                                    <Popover open={pagePopoverOpen} onOpenChange={setPagePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {selectedPageIds.length > 0 ? (
                                                    <span>{selectedPageIds.length} {isThai ? "เพจที่เลือก" : "page(s) selected"}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">{isThai ? "เลือกเพจ..." : "Select page..."}</span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
                                            <div className="border-b px-3 py-2">
                                                <div className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent" onClick={selectAllPages}>
                                                    <Checkbox checked={selectedPageIds.length === pages.length && pages.length > 0} />
                                                    {isThai ? "เลือกทั้งหมด" : "Select all"}
                                                </div>
                                            </div>
                                            <div className="max-h-[280px] overflow-y-auto p-1">
                                                {pages.length === 0 && (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        {isThai ? "ไม่พบเพจที่เปิดใช้งาน" : "No active pages found"}
                                                    </div>
                                                )}
                                                {pages.map((p: any) => (
                                                    <div key={p.pageId} className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-accent" onClick={() => togglePage(p.pageId)}>
                                                        <Checkbox checked={selectedPageIds.includes(p.pageId)} />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{p.name}</span>
                                                            {p.username && <span className="text-xs text-muted-foreground">@{p.username}</span>}
                                                            <span className="text-[10px] text-muted-foreground opacity-50">{p.pageId}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <p className="text-xs text-muted-foreground mt-1 text-right">
                                        <Link href="/settings?tab=manager-accounts" className="text-blue-500 hover:underline">
                                            {isThai ? "จัดการเพจในหน้า Settings" : "Manage pages in Settings"}
                                        </Link>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isThai ? "ชื่อกลุ่มเป้าหมาย" : "Audience Name"}</Label>
                                        <Input placeholder={isThai ? "Engagement เพจ" : "Page Engagement"} value={audienceName} onChange={(e) => setAudienceName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isThai ? "ย้อนหลังกี่วัน (สูงสุด 365)" : "Retention Days (max 365)"}</Label>
                                        <Input type="number" min={1} max={365} value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
                                    </div>
                                </div>

                                <Button onClick={handleCreateEngagement} disabled={creating || selectedPageIds.length === 0 || adAccountIds.length === 0}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    {isThai ? "สร้างลงในบัญชีโฆษณา" : "Create in Ad Accounts"}
                                </Button>
                            </>
                        )}

                        {/* --- Lookalike Tab --- */}
                        {activeTab === "lookalike" && (
                            <>
                                <div className="space-y-2">
                                    <Label>{isThai ? "เลือกกลุ่มเป้าหมายต้นทาง (Seed Audience)" : "Seed Audience"}</Label>
                                    <Popover open={lookalikeOriginOpen} onOpenChange={setLookalikeOriginOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {lookalikeOriginId
                                                    ? audiences.find((a) => a.id === lookalikeOriginId)?.name || lookalikeOriginId
                                                    : <span className="text-muted-foreground">{isThai ? "เลือก Audience..." : "Select audience..."}</span>}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {loadingAudiences ? <div className="p-4 text-center text-xs">{isThai ? "กำลังโหลด..." : "Loading..."}</div> : null}
                                                {audiences.map((a) => (
                                                    <div key={a.id} className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-accent cursor-pointer" onClick={() => { setLookalikeOriginId(a.id); setLookalikeOriginOpen(false); }}>
                                                        <span className="text-sm truncate w-full">{a.name} ({a.accountName})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{isThai ? "ชื่อ Lookalike" : "Lookalike Name"}</Label>
                                        <Input placeholder="Lookalike 1%" value={lookalikeName} onChange={(e) => setLookalikeName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isThai ? "ขนาด (% Ratio, 0.01 = 1%)" : "Size (% Ratio, 0.01 = 1%)"}</Label>
                                        <Input type="number" step="0.01" min={0.01} max={0.2} value={lookalikeRatio} onChange={(e) => setLookalikeRatio(Number(e.target.value))} />
                                    </div>
                                </div>

                                <Button onClick={handleCreateLookalike} disabled={creating || !lookalikeOriginId || adAccountIds.length === 0}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    {isThai ? "บันทึก Lookalike" : "Save Lookalike"}
                                </Button>
                            </>
                        )}

                        {/* --- Interest (AI) Tab --- */}
                        {activeTab === "interest" && (
                            <>
                                <div className="space-y-2">
                                    <Label>{isThai ? "บอกรายละเอียดสินค้า แบรนด์ หรือกลุ่มคนที่คุณอยากยิงแอดไปหา (AI)" : "Describe your product, brand, or target audience (AI)"}</Label>
                                    <textarea
                                        placeholder={isThai ? "เช่น ครีมกันแดดสำหรับคนผิวแพ้ง่าย ชอบไปทะเล" : "e.g. sunscreen for sensitive skin, beach lovers"}
                                        value={interestDescription}
                                        onChange={(e) => setInterestDescription(e.target.value)}
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center py-2">
                                    <div className="border-t w-full" />
                                    <span className="text-xs text-muted-foreground px-2 shrink-0">{isThai ? "หรือใส่เอง" : "or enter manually"}</span>
                                    <div className="border-t w-full" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">{isThai ? "คำที่ต้องการ (Manual)" : "Keywords (Manual)"}</Label>
                                    <Input
                                        placeholder={isThai ? "เช่น cosmetics, skin care, fashion" : "e.g. cosmetics, skin care, fashion"}
                                        value={interestManualInput}
                                        onChange={(e) => setInterestManualInput(e.target.value)}
                                    />
                                </div>

                                <Button onClick={handleGenerateInterest} disabled={interestGenerating || (interestDescription.trim().length < 5 && !interestManualInput.trim())}>
                                    {interestGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {interestGenerating
                                        ? (isThai ? "AI กำลังคิด..." : "AI is thinking...")
                                        : interestManualInput.trim()
                                            ? (isThai ? "ตรวจสอบคำ" : "Validate Keywords")
                                            : (isThai ? "ให้ AI คิดคำค้นหา" : "Let AI Generate Interests")}
                                </Button>

                                {suggestedInterests.length > 0 && (
                                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 mt-4">
                                        <p className="text-sm font-medium">
                                            {isThai ? "คำที่ AI แนะนำ (ผ่านการตรวจสอบกับ Facebook แล้ว)" : "AI-suggested interests (validated with Facebook)"}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestedInterests.map((i, idx) => (
                                                <Badge key={`${i.id}-${idx}`} variant={i.id ? "default" : "secondary"}>
                                                    {i.name}
                                                    {i.id && <span className="ml-1 text-xs opacity-70">✓</span>}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Input
                                                placeholder={isThai ? "ตั้งชื่อ Preset" : "Preset name"}
                                                value={interestPresetName}
                                                onChange={(e) => setInterestPresetName(e.target.value)}
                                                className="max-w-xs"
                                            />
                                            <Button onClick={handleSaveInterestPreset} disabled={interestSaving || !interestPresetName.trim()}>
                                                {isThai ? "บันทึก Preset" : "Save Preset"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    </CardContent>
                </Card>

                {/* Existing Audiences (Engagement/Lookalike only) */}
                {activeTab !== "interest" && (
                    <Card className="shadow-sm">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base text-gray-800 dark:text-gray-200">
                                        {isThai ? "กลุ่มเป้าหมายที่มีอยู่แล้ว" : "Existing Audiences"}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {isThai ? "จัดการและดูรายละเอียดกลุ่มเป้าหมายที่เคยสร้างไว้" : "Manage and view previously created audiences"}
                                    </CardDescription>
                                </div>
                                {adAccountIds.length > 0 && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={loadAudiences} disabled={loadingAudiences}>
                                        {loadingAudiences ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                        <span className="ml-1.5">{isThai ? "รีเฟรช" : "Refresh"}</span>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {adAccountIds.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{isThai ? "กรุณาเลือกบัญชีโฆษณาก่อน" : "Please select an ad account first"}</p>
                            ) : loadingAudiences ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> {isThai ? "กำลังโหลด..." : "Loading..."}
                                </div>
                            ) : audiences.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{isThai ? "ไม่พบกลุ่มเป้าหมายในบัญชีที่เลือก" : "No audiences found in the selected account"}</p>
                            ) : (
                                <div className="space-y-2">
                                    {audiences.map((a) => (
                                        <div key={`${a.accountId}-${a.id}`} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.name}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    ID: {a.id}
                                                    {a.accountName && ` · ${isThai ? "บัญชี" : "Account"}: ${a.accountName}`}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{a.subtype || "CUSTOM"}</Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => setDeleteTarget(a)}
                                                    disabled={!a.accountId}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {activeTab === "interest" && interestPresets.length > 0 && (
                <div className="mt-8 max-w-3xl mx-auto">
                    <h3 className="font-semibold mb-4 text-lg">{isThai ? "Presets ที่บันทึกไว้" : "Saved Presets"}</h3>
                    <div className="grid gap-4">
                        {interestPresets.map(p => (
                            <Card key={p.id} className="p-4 rounded-xl border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="font-medium text-base mb-2">{p.name}</div>
                                {p.description && <div className="text-sm text-muted-foreground mb-3">{p.description}</div>}
                                <div className="flex flex-wrap gap-2">
                                    {p.interests.map((i, idx) => (
                                        <Badge key={`${i.id}-${idx}`} variant="secondary">{i.name}</Badge>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isThai ? "ยืนยันการลบกลุ่มเป้าหมาย?" : "Delete audience?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget && (
                                <>
                                    {isThai
                                        ? <>คุณกำลังจะลบ <strong>{deleteTarget.name}</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</>
                                        : <>You are about to delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.</>}
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{isThai ? "ยกเลิก" : "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); void handleDelete(); }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isThai ? "ลบข้อมูล" : "Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
