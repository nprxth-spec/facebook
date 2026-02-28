"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2 } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const AudiencesContent = dynamic(() => import("./audiences"), {
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

type TabKey = "audiences" | "creative" | "rules";

function ToolsPageContent() {
    const { language } = useTheme();
    const isThai = language === 'th';

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const tabFromUrl = searchParams.get("tab") || "audiences";
    const validTabs: TabKey[] = ["audiences", "creative", "rules"];
    const [activeTab, setActiveTab] = useState<TabKey>(
        validTabs.includes(tabFromUrl as TabKey) ? (tabFromUrl as TabKey) : "audiences"
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
        <div className="h-full flex flex-col overflow-hidden max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0 pt-4">
                <div className="shrink-0 px-6 md:px-8 border-b bg-background">
                    <TabsList className="bg-transparent p-0 h-auto gap-4">
                        <TabsTrigger
                            value="audiences"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-1 font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            {isThai ? "กลุ่มเป้าหมาย (Audiences)" : "Audiences"}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <TabsContent value="audiences" className="h-full m-0 data-[state=inactive]:hidden">
                        <Suspense fallback={<TabLoadingState />}>
                            <AudiencesContent />
                        </Suspense>
                    </TabsContent>
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
