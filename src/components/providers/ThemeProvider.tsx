"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { translations, Language } from "@/lib/translations";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    accentColor: string;
    language: Language;
    timezone: string;
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: string) => void;
    setLanguage: (lang: Language) => void;
    setTimezone: (tz: string) => void;
    refreshPreferences: () => Promise<void>;
    t: (path: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS: Record<string, string> = {
    blue: "221.2 83.2% 53.3%",
    purple: "262.1 83.3% 57.8%",
    green: "142.1 76.2% 36.3%",
    orange: "24.6 95% 53.1%",
    red: "0 72.2% 50.6%",
    pink: "330.4 81.2% 60.4%",
};

export function ThemeProvider({
    children,
    initialLanguage = "th"
}: {
    children: React.ReactNode;
    initialLanguage?: Language;
}) {
    const { data: session } = useSession();
    // เริ่มต้นด้วย "light" ทั้งฝั่ง server และ client เพื่อลด hydration mismatch
    const [theme, setThemeState] = useState<Theme>("light");
    const [accentColor, setAccentColorState] = useState("blue");
    const [language, setLanguageState] = useState<Language>(initialLanguage);
    const [timezone, setTimezoneState] = useState("Asia/Bangkok");

    const applyTheme = useCallback((t: Theme) => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (t === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.add(systemTheme);
        } else {
            root.classList.add(t);
        }
    }, []);

    const applyAccent = useCallback((color: string) => {
        const root = window.document.documentElement;
        const hsl = ACCENT_COLORS[color] || ACCENT_COLORS.blue;
        root.style.setProperty("--primary", hsl);
    }, []);

    const refreshPreferences = useCallback(async () => {
        try {
            const res = await fetch("/api/user/preferences");
            const d = await res.json();
            if (d.theme) setThemeState(d.theme);
            if (d.accentColor) setAccentColorState(d.accentColor);
            if (d.language) setLanguageState(d.language as Language);
            if (d.timezone) setTimezoneState(d.timezone);
        } catch (e) {
            console.error("Failed to load preferences", e);
        }
    }, []);

    useEffect(() => {
        if (session) {
            refreshPreferences();
        }
    }, [session, refreshPreferences]);

    // สำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน เก็บค่าลง localStorage แทน
    useEffect(() => {
        if (!session && typeof window !== "undefined") {
            const storedTheme = window.localStorage.getItem("centxo:theme") as Theme | null;
            const storedLang = window.localStorage.getItem("centxo:language") as Language | null;
            const storedTz = window.localStorage.getItem("centxo:timezone");
            if (storedTheme) setThemeState(storedTheme);
            if (storedLang) setLanguageState(storedLang);
            if (storedTz) setTimezoneState(storedTz);
        }
    }, [session]);

    // ใช้ useLayoutEffect ลดอาการหน้ากระพริบตอนสลับธีม
    useLayoutEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    useEffect(() => {
        applyAccent(accentColor);
    }, [accentColor, applyAccent]);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const persistPrefs = async (data: Partial<{ theme: Theme; accentColor: string; language: Language; timezone: string }>) => {
        try {
            if (session) {
                await fetch("/api/user/preferences", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
            } else if (typeof window !== "undefined") {
                if (data.theme) window.localStorage.setItem("centxo:theme", data.theme);
                if (data.language) window.localStorage.setItem("centxo:language", data.language);
                if (data.timezone) window.localStorage.setItem("centxo:timezone", data.timezone);
            }
        } catch (e) {
            console.error("Failed to persist preferences", e);
        }
    };

    const setTheme = (t: Theme) => {
        setThemeState(t);
        void persistPrefs({ theme: t });
    };
    const setAccentColor = (c: string) => {
        setAccentColorState(c);
        void persistPrefs({ accentColor: c as string });
    };
    const setLanguage = (l: Language) => {
        setLanguageState(l);
        void persistPrefs({ language: l });
    };
    const setTimezone = (tz: string) => {
        setTimezoneState(tz);
        void persistPrefs({ timezone: tz });
    };

    const t = useCallback((path: string): string => {
        const keys = path.split(".");
        let current: any = translations[language];
        for (const key of keys) {
            if (current && current[key]) {
                current = current[key];
            } else {
                return path;
            }
        }
        return typeof current === "string" ? current : path;
    }, [language]);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                accentColor,
                language,
                timezone,
                setTheme,
                setAccentColor,
                setLanguage,
                setTimezone,
                refreshPreferences,
                t,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
