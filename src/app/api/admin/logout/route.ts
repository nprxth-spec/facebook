import { NextResponse } from "next/server";

const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? "admin-session";

export async function POST() {
  // เคลียร์ cookie admin_session โดยตั้ง maxAge ให้หมดอายุทันที
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  // ไม่จำเป็นต้องเช็คค่าเท่ากับ ADMIN_SESSION_TOKEN ตอนลบ แค่เคลียร์ทิ้งก็พอ
  void ADMIN_SESSION_TOKEN;

  return res;
}

