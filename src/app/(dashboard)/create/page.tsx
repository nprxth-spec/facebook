"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Zap, Loader2 } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import dynamic from "next/dynamic";

const CreateAutoWizard = dynamic(() => import("./CreateAutoWizard"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    ),
});

function CreatePageContent() {
    const { language } = useTheme();
    const isThai = language === "th";

    return (
        <div className="py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                        {isThai ? "สร้างโฆษณา" : "Create Ads"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isThai ? "สร้างแคมเปญโฆษณาบน Facebook ด้วยระบบอัตโนมัติ" : "Create Facebook ad campaigns with our automated system"}
                    </p>
                </div>
                <CreateAutoWizard />
            </div>
        </div>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <CreatePageContent />
        </Suspense>
    );
}
