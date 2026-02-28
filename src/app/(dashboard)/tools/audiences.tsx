"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Users, Loader2, Plus, ChevronsUpDown, Search, ExternalLink, Sparkles, CheckCircle2, XCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const AUDIENCE_TYPE_KEYS = [
    "page_engaged",
    "page_visited",
    "page_messaged",
    "page_post_interaction",
    "page_cta_clicked",
    "page_or_post_save",
    "page_liked",
] as const;

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

export default function AudiencesPage() {
    // Using static 'th' locale strings for simplicity in this port
    const isThai = true;

    // Emulate useAdAccount context with local state populated from /api/manager-accounts
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]); // simplified for this port
    const [accountsLoading, setAccountsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<TabKey>("engagement");
    const [adAccountIds, setAdAccountIds] = useState<string[]>([]);
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

    const [audienceName, setAudienceName] = useState("");
    const [retentionDays, setRetentionDays] = useState(365);
    const [audienceTypes, setAudienceTypes] = useState<string[]>(["page_messaged"]);
    const [audiences, setAudiences] = useState<CustomAudience[]>([]);

    const [loadingAudiences, setLoadingAudiences] = useState(false);
    const [creating, setCreating] = useState(false);
    const [creationProgress, setCreationProgress] = useState<Record<string, "creating" | "success" | "error">>({});

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
        <div className="py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-500" />
                    กลุ่มเป้าหมาย (Custom Audiences)
                </h1>
                <p className="text-muted-foreground mt-1">เครื่องมือสร้างและจัดการกลุ่มเป้าหมายล่วงหน้า</p>
            </div>

            <div className="flex gap-2 mb-6">
                <Button variant={activeTab === "engagement" ? "default" : "outline"} onClick={() => setActiveTab("engagement")}>
                    Engagement
                </Button>
                <Button variant={activeTab === "lookalike" ? "default" : "outline"} onClick={() => setActiveTab("lookalike")}>
                    Lookalike
                </Button>
                <Button variant={activeTab === "interest" ? "default" : "outline"} onClick={() => setActiveTab("interest")}>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Interest (AI)
                </Button>
            </div>

            <div className="grid gap-6 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {activeTab === "engagement" && "สร้าง Engagement Audience"}
                            {activeTab === "lookalike" && "สร้าง Lookalike Audience"}
                            {activeTab === "interest" && "หาไอเดียกลุ่มเป้าหมายด้วย AI"}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === "engagement" && "คัดกรองคนที่มีส่วนร่วมกับเพจของคุณ"}
                            {activeTab === "lookalike" && "ค้นหาคนที่มีพฤติกรรมคล้ายกับฐานลูกค้าเดิม"}
                            {activeTab === "interest" && "ใส่รายละเอียดสินค้า ให้ AI ช่วยคิด Interests ยิงแอดให้"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        <div className="space-y-2">
                            <Label>เลือกบัญชีโฆษณา</Label>
                            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {adAccountIds.length > 0 ? (
                                            <span>{adAccountIds.length} บัญชีที่เลือก</span>
                                        ) : (
                                            <span className="text-muted-foreground">เลือกบัญชี...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
                                    <div className="border-b px-3 py-2">
                                        <div className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent" onClick={selectAllAccounts}>
                                            <Checkbox checked={adAccountIds.length === adAccounts.length && adAccounts.length > 0} />
                                            เลือกทั้งหมด
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
                                    <Label>เงื่อนไข (Audience Type)</Label>
                                    <Popover open={audienceTypePopoverOpen} onOpenChange={setAudienceTypePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {audienceTypes.length > 0 ? <span>เลือกแล้ว {audienceTypes.length} แบบ</span> : <span className="text-muted-foreground">เลือกพฤติกรรม...</span>}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                                            <div className="p-1">
                                                {AUDIENCE_TYPE_KEYS.map((key) => (
                                                    <div key={key} className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-accent cursor-pointer" onClick={() => toggleAudienceType(key)}>
                                                        <Checkbox checked={audienceTypes.includes(key)} />
                                                        <span className="text-sm">{key}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>เพจเฟสบุ๊ค (Facebook Pages)</Label>
                                    <Popover open={pagePopoverOpen} onOpenChange={setPagePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {selectedPageIds.length > 0 ? (
                                                    <span>{selectedPageIds.length} เพจที่เลือก</span>
                                                ) : (
                                                    <span className="text-muted-foreground">เลือกเพจ...</span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0" align="start">
                                            <div className="border-b px-3 py-2">
                                                <div className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent" onClick={selectAllPages}>
                                                    <Checkbox checked={selectedPageIds.length === pages.length && pages.length > 0} />
                                                    เลือกทั้งหมด
                                                </div>
                                            </div>
                                            <div className="max-h-[280px] overflow-y-auto p-1">
                                                {pages.length === 0 && (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">ไม่พบเพจที่เปิดใช้งาน</div>
                                                )}
                                                {pages.map((p: any) => (
                                                    <div key={p.pageId} className="flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-accent" onClick={() => togglePage(p.pageId)}>
                                                        <Checkbox checked={selectedPageIds.includes(p.pageId)} />
                                                        <span className="text-sm font-medium">{p.name} <span className="text-xs text-muted-foreground ml-1">({p.pageId})</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <p className="text-xs text-muted-foreground mt-1 text-right">
                                        <Link href="/settings?tab=manager-accounts" className="text-blue-500 hover:underline">จัดการเพจในหน้า Settings</Link>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ชื่อกลุ่มเป้าหมาย</Label>
                                        <Input placeholder="Engagement เพจ" value={audienceName} onChange={(e) => setAudienceName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ย้อนหลังกี่วัน (สูงสุด 365)</Label>
                                        <Input type="number" min={1} max={365} value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
                                    </div>
                                </div>

                                <Button onClick={handleCreateEngagement} disabled={creating || selectedPageIds.length === 0 || adAccountIds.length === 0}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    สร้างลงในบัญชีโฆษณา
                                </Button>
                            </>
                        )}

                        {/* --- Lookalike Tab --- */}
                        {activeTab === "lookalike" && (
                            <>
                                <div className="space-y-2">
                                    <Label>เลือกกลุ่มเป้าหมายต้นทาง (Seed Audience)</Label>
                                    <Popover open={lookalikeOriginOpen} onOpenChange={setLookalikeOriginOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {lookalikeOriginId ? audiences.find((a) => a.id === lookalikeOriginId)?.name || lookalikeOriginId : <span className="text-muted-foreground">เลือก Audience...</span>}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                {loadingAudiences ? <div className="p-4 text-center text-xs">Loading...</div> : null}
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
                                        <Label>ชื่อ Lookalike</Label>
                                        <Input placeholder="Lookalike 1%" value={lookalikeName} onChange={(e) => setLookalikeName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ขนาด (% Ratio, 0.01 = 1%)</Label>
                                        <Input type="number" step="0.01" min={0.01} max={0.2} value={lookalikeRatio} onChange={(e) => setLookalikeRatio(Number(e.target.value))} />
                                    </div>
                                </div>

                                <Button onClick={handleCreateLookalike} disabled={creating || !lookalikeOriginId || adAccountIds.length === 0}>
                                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    บันทึก Lookalike
                                </Button>
                            </>
                        )}

                        {/* --- Interest (AI) Tab --- */}
                        {activeTab === "interest" && (
                            <>
                                <div className="space-y-2">
                                    <Label>บอกรายละเอียดสินค้า แบรนด์ หรือกลุ่มคนที่คุณอยากยิงแอดไปหา (AI)</Label>
                                    <textarea
                                        placeholder="เช่น ครีมกันแดดสำหรับคนผิวแพ้ง่าย ชอบไปทะเล"
                                        value={interestDescription}
                                        onChange={(e) => setInterestDescription(e.target.value)}
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center py-2">
                                    <div className="border-t w-full" />
                                    <span className="text-xs text-muted-foreground px-2 shrink-0">หรือใส่เอง</span>
                                    <div className="border-t w-full" />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">คำที่ต้องการ (Manual)</Label>
                                    <Input
                                        placeholder="เช่น cosmetics, skin care, fashion"
                                        value={interestManualInput}
                                        onChange={(e) => setInterestManualInput(e.target.value)}
                                    />
                                </div>

                                <Button onClick={handleGenerateInterest} disabled={interestGenerating || (interestDescription.trim().length < 5 && !interestManualInput.trim())}>
                                    {interestGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {interestGenerating ? "AI กำลังคิด..." : interestManualInput.trim() ? "ตรวจสอบคำ" : "ให้ AI คิดคำค้นหา"}
                                </Button>

                                {suggestedInterests.length > 0 && (
                                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4 mt-4">
                                        <p className="text-sm font-medium">คำที่ AI แนะนำ (ผ่านการตรวจสอบกับ Facebook แล้ว)</p>
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
                                                placeholder="ตั้งชื่อ Preset"
                                                value={interestPresetName}
                                                onChange={(e) => setInterestPresetName(e.target.value)}
                                                className="max-w-xs"
                                            />
                                            <Button onClick={handleSaveInterestPreset} disabled={interestSaving || !interestPresetName.trim()}>
                                                Save Preset
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    </CardContent>
                </Card>
            </div>

            {activeTab === "interest" && interestPresets.length > 0 && (
                <div className="mt-8 max-w-3xl">
                    <h3 className="font-semibold mb-4 text-lg">Presets ที่บันทึกไว้</h3>
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
        </div>
    );
}
