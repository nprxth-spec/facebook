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

  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Auto-refresh ถ้า token หมดอายุ และอัปเดตใน DB
  oauth2.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.account.updateMany({
        where: { userId, provider: "google" },
        data: {
          access_token: tokens.access_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        },
      });
    }
  });

  return oauth2;
}

/** ดึง Facebook access token */
export async function getFacebookToken(userId: string) {
  const account = await getProviderToken(userId, "facebook");
  return account?.access_token ?? null;
}
