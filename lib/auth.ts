import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { provisionUser } from "./virtual-accounts";
import { checkCredentials, checkSecondFactor } from "./credentials";
import { startSession } from "./sessions";
import { ensureReferralCode } from "./referral";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth" },
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" }),
    Credentials({
      credentials: { identifier: {}, password: {}, code: {} },
      async authorize(c) {
        if (!c?.identifier || !c.password) return null;
        const r = await checkCredentials(c.identifier, c.password);
        if (!r.ok) return null;
        if (r.user.twoFactor && !(c.code && (await checkSecondFactor(r.user.id, c.code)))) return null;
        return { id: r.user.id, email: r.user.email, name: r.user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      const email = user.email.toLowerCase();
      let db = await prisma.user.findUnique({ where: { email } });
      if (db?.banned) return false;
      if (!db) { db = await prisma.user.create({ data: { email, name: user.name, image: user.image, emailVerified: true } }); await provisionUser(db); await ensureReferralCode(db.id); }
      user.id = db.id;
      return true;
    },
    async jwt({ token, user }) {
      try {
        if (user?.id) { token.id = user.id; token.sid = await startSession(user.id); token.invalid = undefined; }
        if (token.id && token.sid) {
          // Every request: is this device still allowed in? (revoked, banned, or "sign out everywhere")
          const s = await prisma.loginSession.findUnique({ where: { id: token.sid }, include: { user: { select: { banned: true, role: true, sessionsValidAfter: true } } } });
          const iat = typeof token.iat === "number" ? token.iat * 1000 : 0;
          if (!s || s.revokedAt || s.user.banned || (s.user.sessionsValidAfter && iat < s.user.sessionsValidAfter.getTime())) return { invalid: true };
          token.role = s.user.role;
          if (Date.now() - s.lastSeenAt.getTime() > 300000) await prisma.loginSession.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } });
        } else if (token.id && !token.role) {
          token.role = (await prisma.user.findUnique({ where: { id: token.id }, select: { role: true } }))?.role ?? "USER"; // sessions from before this feature existed
        }
      } catch (e) { console.error("jwt callback", e); }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = (token.id as string) ?? ""; session.user.role = (token.role as string) ?? "USER"; session.user.sid = token.sid; }
      return session;
    },
  },
};
