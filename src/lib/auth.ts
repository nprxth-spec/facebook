import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { exchangeFacebookToken } from "@/lib/tokens";
import { logActivity } from "@/lib/activity-log";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly",
          access_type: "offline",
          // ใช้ consent + select_account เพื่อให้ Google ส่ง refresh_token แน่นอน
          // และให้ผู้ใช้เลือกบัญชีได้ทุกครั้ง
          prompt: "consent select_account",
        },
      },
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
      authorization: {
        params: {
          scope: [
            "email",
            "public_profile",
            "ads_read",
            "ads_management",
            "business_management",
            "read_insights",
            "pages_messaging",
            "pages_manage_metadata",
            "pages_read_engagement",
          ].join(","),
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  events: {
    async linkAccount({ account }) {
      if (account.provider === "facebook" && account.access_token) {
        try {
          const longLived = await exchangeFacebookToken(account.access_token);
          await prisma.account.update({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            data: {
              access_token: longLived.access_token,
              expires_at: Math.floor(Date.now() / 1000) + longLived.expires_in,
            },
          });
          console.log("Facebook token exchanged (linkAccount)");
        } catch (err) {
          console.error("Facebook token exchange error (linkAccount):", err);
        }
      }
    },
    async signIn({ user, account, isNewUser }) {
      // Log successful login (ไม่มี access ถึง IP/UA ใน events)
      await logActivity({
        userId: user.id,
        action: "login",
        category: "auth",
        metadata: {
          provider: account?.provider,
          isNewUser: !!isNewUser,
        },
      });
    },
  },
  callbacks: {
  async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.image = user.image;
        const accounts = await prisma.account.findMany({
          where: { userId: user.id },
          select: { provider: true },
        });
        session.user.connectedProviders = accounts.map((a: { provider: string }) => a.provider);
      }
      return session;
    },
  async signIn({ user, account }) {
      if (!user.email) return true;

      // When signing in with Google, try to persist the Google profile picture
      // into User.image so we can reuse it in future sessions.
      if (account?.provider === "google" && account.id_token) {
        try {
          const [, payloadB64] = account.id_token.split(".");
          if (payloadB64) {
            const payloadJson = Buffer.from(payloadB64, "base64").toString("utf8");
            const payload = JSON.parse(payloadJson) as { picture?: string };
            if (payload.picture) {
              await prisma.user.update({
                where: { id: user.id },
                data: { image: payload.picture },
              });
            }
          }
        } catch (e) {
          console.error("Failed to persist Google profile image from id_token:", e);
        }
      }

      // Ensure TrialHistory exists for this email (ใช้กันการลบแล้วสมัครใหม่เอา trial ซ้ำ)
      try {
        const email = user.email;
        if (email) {
          const existing = await prisma.trialHistory.findUnique({
            where: { email },
          });
          if (!existing) {
            const now = new Date();
            await prisma.trialHistory.create({
              data: {
                email,
                firstSignupAt: now,
                freeTrialStartedAt: now,
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to ensure TrialHistory on signIn:", e);
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
