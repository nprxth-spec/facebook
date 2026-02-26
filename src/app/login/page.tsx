"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function LoginPage() {
  const { language } = useTheme();
  const isThai = language === "th";
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f4f5ff] via-[#f8f9ff] to-[#fef9ff] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-4">
      {/* Top brand logo (aligned with landing navbar) */}
      <header className="absolute top-4 left-0 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_12px_30px_rgba(37,99,235,0.35)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              AdSync
            </span>
          </Link>
        </div>
      </header>

      {/* Center card */}
      <div className="w-full max-w-sm">
        <div className="relative mx-auto rounded-3xl bg-white/95 dark:bg-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.16)] border border-slate-100/90 dark:border-slate-800 px-7 py-8">
            {/* Heading */}
            <div className="text-center mb-5">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {isThai ? "ยินดีต้อนรับสู่ AdSync" : "Welcome to AdSync"}
              </h1>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {isThai
                  ? "ปลดล็อกทุกฟีเจอร์ด้วยการเข้าสู่ระบบ"
                  : "Unlock all features by logging in"}
              </p>
            </div>

            {/* Login buttons */}
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={() => signIn("google", { callbackUrl: "/connect" })}
                variant="outline"
                size="lg"
                className="w-full max-w-[300px] h-10 justify-center gap-1.5 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[13px] px-3"
              >
                <GoogleIcon />
                {isThai ? "เข้าสู่ระบบด้วย Google" : "Continue with Google"}
              </Button>

              <Button
                onClick={() => signIn("facebook", { callbackUrl: "/connect" })}
                size="lg"
                className="w-full max-w-[300px] h-10 justify-center gap-1.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-[13px] px-3"
              >
                <FacebookIcon />
                {isThai ? "เข้าสู่ระบบด้วย Facebook" : "Continue with Facebook"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
                  {isThai ? "หรือ" : "or"}
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Email button (placeholder / normal button) */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full max-w-[300px] h-10 justify-center gap-1.5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-[13px] px-3"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px]">
                  @
                </span>
                {isThai ? "เข้าสู่ระบบด้วยอีเมล" : "Continue with Email"}
              </Button>
            </div>

            {/* Terms */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-relaxed">
              {isThai ? (
                <>
                  การกดปุ่มเข้าสู่ระบบ ถือว่าคุณยอมรับ{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    เงื่อนไขการใช้งาน
                  </Link>{" "}
                  และ{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    นโยบายความเป็นส่วนตัว
                  </Link>
                </>
              ) : (
                <>
                  By clicking continue, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Privacy Policy
                  </Link>
                </>
              )}
              </p>
            </div>
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-200">
            {isThai ? "← กลับหน้าหลัก" : "← Back to homepage"}
          </Link>
        </p>
      </div>
    </div>
  );
}
