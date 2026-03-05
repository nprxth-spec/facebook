import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // เส้นทาง /admin ทั้งหมดใช้ระบบ auth แยกเอง ไม่ผูกกับ next-auth
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // อนุญาตหน้า login ของ admin โดยไม่ต้องมี cookie
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminSessionToken = process.env.ADMIN_SESSION_TOKEN ?? "admin-session";
    const token = req.cookies.get("admin_session")?.value;

    if (!token || token !== adminSessionToken) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  const publicPaths = ["/", "/login", "/terms", "/privacy", "/data"];
  const isPublic = publicPaths.includes(pathname);

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)"],
};
