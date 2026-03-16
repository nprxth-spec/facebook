import { prisma } from "@/lib/db";
import { google } from "googleapis";

/** ดึง access_token ของ provider จาก Account table */
export async function getProviderToken(userId: string, provider: "google" | "facebook") {
  const account = await prisma.account.findFirst({
    where: { userId, provider },
    select: { access_token: true, refresh_token: true, expires_at: true },
  });
  if (!account?.access_token) return null;
  return account;
}

/** สร้าง Google OAuth2 client พร้อม token */
export async function getGoogleClient(userId: string) {
  const account = await getProviderToken(userId, "google");
  if (!account) return null;

  const hasRefreshToken = !!account.refresh_token;

  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2.setCredentials({
    access_token: account.access_token,
    // ถ้าไม่มี refresh_token ให้ไม่ตั้ง expiry_date เพื่อไม่ให้ไลบรารีพยายาม refresh แล้ว error ว่า "No refresh token is set"
    refresh_token: hasRefreshToken ? account.refresh_token ?? undefined : undefined,
    expiry_date: hasRefreshToken && account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Auto-refresh ถ้า token หมดอายุ และอัปเดตใน DB
  oauth2.on("tokens", async (tokens) => {
    try {
      const updateData: {
        access_token?: string | null;
        refresh_token?: string | null;
        expires_at?: number | null;
      } = {};

      if (tokens.access_token) {
        updateData.access_token = tokens.access_token;
      }

      if (tokens.refresh_token) {
        // บางครั้ง Google จะ rotate refresh token ใหม่ให้
        // ถ้าเราไม่บันทึกตัวใหม่ ตัวเก่าจะใช้ไม่ได้และทำให้เกิด invalid_grant
        updateData.refresh_token = tokens.refresh_token;
      }

      if (typeof tokens.expiry_date === "number") {
        updateData.expires_at = Math.floor(tokens.expiry_date / 1000);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.account.updateMany({
          where: { userId, provider: "google" },
          data: updateData,
        });
      }
    } catch (e) {
      console.error("Failed to persist Google tokens", e);
    }
  });

  return oauth2;
}

/** ดึง Facebook access token (บัญชีแรก) */
export async function getFacebookToken(userId: string) {
  const account = await getProviderToken(userId, "facebook");
  return account?.access_token ?? null;
}

/** ดึง Facebook access token ทุกบัญชีที่ user เชื่อมต่อ */
export async function getAllFacebookTokens(userId: string): Promise<{ providerAccountId: string; token: string }[]> {
  const accounts = await prisma.account.findMany({
    where: { userId, provider: "facebook" },
    select: { providerAccountId: true, access_token: true },
  });
  return accounts
    .filter((a): a is { providerAccountId: string; access_token: string } => !!a.access_token)
    .map((a) => ({ providerAccountId: a.providerAccountId, token: a.access_token }));
}

/** แลกเปลี่ยน Short-lived Facebook token เป็น Long-lived token (60 วัน) */
export async function exchangeFacebookToken(shortToken: string) {
  const appId = process.env.AUTH_FACEBOOK_ID;
  const appSecret = process.env.AUTH_FACEBOOK_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Facebook configuration missing");
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    })
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    access_token: data.access_token as string,
    expires_in: data.expires_in as number, // usually around 5184000 (60 days)
  };
}
