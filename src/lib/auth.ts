import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { exchangeFacebookToken } from "@/lib/tokens";

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
          prompt: "consent",
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
    async signIn({ account }) {
      if (account?.provider === "facebook" && account.access_token) {
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
          console.log("Facebook token exchanged (signIn)");
        } catch (err) {
          console.error("Facebook token exchange error (signIn):", err);
        }
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
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
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
