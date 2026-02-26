"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function ConnectPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const connectedProviders = session?.user?.connectedProviders ?? [];
  const hasGoogle = connectedProviders.includes("google");
  const hasFacebook = connectedProviders.includes("facebook");

  // Determine which provider was used to login (the one that's connected)
  const loginProvider = hasGoogle && !hasFacebook ? "google" : hasFacebook && !hasGoogle ? "facebook" : null;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // If both are connected, go to dashboard
    if (hasGoogle && hasFacebook) {
      router.push("/dashboard");
    }
  }, [status, hasGoogle, hasFacebook, router]);

  const handleConnect = async (provider: "google" | "facebook") => {
    setLoading(true);
    await signIn(provider, { callbackUrl: "/connect" });
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Google logged in → prompt to connect Facebook (can skip)
  if (loginProvider === "google" || (hasGoogle && !hasFacebook)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                เชื่อมต่อ Facebook
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
                เชื่อมต่อบัญชี Facebook เพื่อดึงข้อมูลโฆษณาได้เต็มรูปแบบ
              </p>
            </div>

            {/* Status */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Google เชื่อมต่อแล้ว</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{session?.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook ยังไม่ได้เชื่อมต่อ</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">จำเป็นสำหรับดึงข้อมูลโฆษณา</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleConnect("facebook")}
                size="lg"
                className="w-full gap-3 font-medium bg-[#1877F2] hover:bg-[#166fe5] text-white border-0"
                disabled={loading}
              >
                <FacebookIcon />
                เชื่อมต่อ Facebook
              </Button>
              <Button
                onClick={handleSkip}
                variant="ghost"
                size="lg"
                className="w-full text-gray-500 dark:text-gray-400"
              >
                ข้ามขั้นตอนนี้
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
              คุณสามารถเชื่อมต่อภายหลังได้ในหน้าตั้งค่า
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Facebook logged in → MUST connect Google (cannot skip)
  if (loginProvider === "facebook" || (hasFacebook && !hasGoogle)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                เชื่อมต่อ Google
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
                จำเป็นต้องเชื่อมต่อ Google เพื่อส่งออกข้อมูลไปยัง Google Sheets
              </p>
            </div>

            {/* Required badge */}
            <div className="mb-4 flex justify-center">
              <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-800">
                จำเป็นต้องเชื่อมต่อ — ไม่สามารถข้ามได้
              </span>
            </div>

            {/* Status */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Facebook เชื่อมต่อแล้ว</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{session?.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="w-5 h-5 rounded-full border-2 border-red-400 dark:border-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Google ยังไม่ได้เชื่อมต่อ</p>
                  <p className="text-xs text-red-500 dark:text-red-400">จำเป็นสำหรับส่งออกไป Google Sheets</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleConnect("google")}
              variant="outline"
              size="lg"
              className="w-full gap-3 font-medium border-gray-300 hover:border-gray-400"
              disabled={loading}
            >
              <GoogleIcon />
              เชื่อมต่อ Google (บังคับ)
            </Button>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
              Google จำเป็นสำหรับการส่งออกข้อมูลไปยัง Google Sheets
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
