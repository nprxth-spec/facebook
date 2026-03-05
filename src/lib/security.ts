export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) {
    // บาง client (เช่น native app) อาจไม่ส่ง Origin มา ให้ผ่านไปเพื่อลด false positive
    return;
  }

  const allowedUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL;

  if (!allowedUrl) {
    // ใน production ต้องตั้งค่า base URL ให้ชัดเจน ไม่งั้นให้ fail ทันทีเพื่อไม่ให้ CSRF protection หายไปเงียบ ๆ
    if (process.env.NODE_ENV === "production") {
      throw new Error("Base URL env not configured for origin check");
    }
    // ใน dev/preview ยังอนุโลมเพื่อไม่ให้ developer ติดขัด
    return;
  }

  try {
    const allowed = new URL(allowedUrl);
    const incoming = new URL(origin);

    const sameHost = allowed.protocol === incoming.protocol && allowed.host === incoming.host;
    if (!sameHost) {
      throw new Error("Invalid origin");
    }
  } catch {
    throw new Error("Invalid origin");
  }
}

