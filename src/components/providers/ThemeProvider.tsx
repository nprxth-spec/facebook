"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    accentColor: string;
    language: string;
    timezone: string;
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: string) => void;
    setLanguage: (lang: string) => void;
    setTimezone: (tz: string) => void;
    refreshPreferences: () => Promise<void>;
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [theme, setThemeState] = useState<Theme>("light");
    const [accentColor, setAccentColorState] = useState("blue");
    const [language, setLanguageState] = useState("th");
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
            if (d.language) setLanguageState(d.language);
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

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    useEffect(() => {
        applyAccent(accentColor);
    }, [accentColor, applyAccent]);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setTheme = (t: Theme) => setThemeState(t);
    const setAccentColor = (c: string) => setAccentColorState(c);
    const setLanguage = (l: string) => setLanguageState(l);
    const setTimezone = (tz: string) => setTimezoneState(tz);

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
