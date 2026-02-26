import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

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
          ].join(","),
        },
      },
    }),
  ],
  session: {
    strategy: "database",
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
