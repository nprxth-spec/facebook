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
    // ถ้าไม่ได้ตั้งค่า base URL ไว้ จะไม่บังคับตรวจ Origin เพื่อไม่ให้ระบบพัง
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

