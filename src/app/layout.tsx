import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Centxo - Facebook Ads to Google Sheets",
  description: "Export your Facebook Ads data directly to Google Sheets",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let initialLanguage = "th";
  if (session?.user?.id) {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
      select: { language: true },
    });
    if (prefs?.language) {
      initialLanguage = prefs.language;
    }
  }

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider initialLanguage={initialLanguage as any}>
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
