"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ChevronDown, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function Header() {
  const { data: session } = useSession();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const { language } = useTheme();
  const isThai = language === "th";

  const initials = session?.user?.name
    ? session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "U";

  return (
    <header className="h-16 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 flex items-center justify-end px-6 gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
                {session?.user?.name ?? "User"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                {session?.user?.email ?? ""}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                {session?.user?.name}
              </p>
              <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                {session?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              {isThai ? "บัญชีของฉัน" : "My account"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              {isThai ? "ตั้งค่า" : "Settings"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isThai ? "ออกจากระบบ" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <DialogContent className="max-w-[320px] p-0 overflow-hidden rounded-xl border-none shadow-2xl">
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 text-left">
                {isThai ? "ออกจากระบบ?" : "Sign out?"}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-left leading-snug">
                {isThai
                  ? "คุณแน่ใจหรือไม่ที่จะออกจากระบบการใช้งานในขณะนี้?"
                  : "Are you sure you want to sign out now?"}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 pt-0">
            <Button
              variant="ghost"
              size="sm"
              className="px-4 h-9 rounded-lg text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsLogoutConfirmOpen(false)}
            >
              {isThai ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="px-4 h-9 rounded-lg bg-red-600 hover:bg-red-700 font-bold"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              {isThai ? "ตกลง" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
