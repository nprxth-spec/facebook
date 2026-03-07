export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) {
    return;
  }

  try {
    const incoming = new URL(origin);

    const allowedUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL;

    if (allowedUrl) {
      const allowed = new URL(allowedUrl);
      if (allowed.protocol === incoming.protocol && allowed.host === incoming.host) {
        return;
      }
    }

    // Fallback: ยอมรับเมื่อ Origin ตรงกับ Host ของ request (same-site เช่น production ที่ env อาจไม่ตรงโดเมนจริง)
    const host = req.headers.get("host");
    if (host && incoming.host === host) {
      return;
    }

    throw new Error("Invalid origin");
  } catch {
    throw new Error("Invalid origin");
  }
}

