"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, Users, Sparkles, Target, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/providers/ThemeProvider";

const AudiencesContent = dynamic<{ activeTab: TabKey }>(() => import("./audiences"), {
    loading: () => <TabLoadingState />,
    ssr: false,
});

function TabLoadingState() {
    return (
        <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
}

type TabKey = "engagement" | "lookalike" | "interest";

function ToolsPageContent() {
    const { language } = useTheme();
    const isThai = language === 'th';

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const tabFromUrl = searchParams.get("tab") || "engagement";
    const validTabs: TabKey[] = ["engagement", "lookalike", "interest"];
    const [activeTab, setActiveTab] = useState<TabKey>(
        validTabs.includes(tabFromUrl as TabKey) ? (tabFromUrl as TabKey) : "engagement"
    );

    // Sync URL when tab changes
    const handleTabChange = (tab: string) => {
        const newTab = tab as TabKey;
        setActiveTab(newTab);
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("tab", newTab);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Sync state when URL changes externally
    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && validTabs.includes(tabParam as TabKey) && tabParam !== activeTab) {
            setActiveTab(tabParam as TabKey);
        }
    }, [searchParams, activeTab]);

    return (
        <div className="h-full flex flex-col overflow-hidden -mx-6 sm:-mx-[60px] lg:-mx-[100px]">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
                <div className="shrink-0 px-6 sm:px-[60px] lg:px-[100px] h-14 flex items-end border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-30">
                    <TabsList className="bg-transparent p-0 h-auto gap-8 mt-1">
                        <TabsTrigger
                            value="engagement"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Target className="mr-2 h-4 w-4" />
                            Engagement
                        </TabsTrigger>
                        <TabsTrigger
                            value="lookalike"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Lookalike
                        </TabsTrigger>
                        <TabsTrigger
                            value="interest"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Interest (AI)
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <Suspense fallback={<TabLoadingState />}>
                        <AudiencesContent activeTab={activeTab} />
                    </Suspense>
                </div>
            </Tabs>
        </div>
    );
}

export default function ToolsPage() {
    return (
        <Suspense fallback={<TabLoadingState />}>
            <ToolsPageContent />
        </Suspense>
    );
}
