import { headers } from "next/headers";
import { prisma } from "./prisma";
import { describeDevice } from "./device";
import { notify } from "./notify";
import { isListedAdmin, parseAdminEmails } from "./admin-list";

/** Records a sign-in. Alerts the user if it comes from a device and country they haven't used before. */
export async function startSession(userId: string) {
  let ua: string | null = null, ip: string | null = null, country: string | null = null;
  try { const h = headers(); ua = h.get("user-agent"); ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? null; country = h.get("x-vercel-ip-country"); } catch { /* outside a request */ }
  const prior = await prisma.loginSession.findMany({ where: { userId }, select: { ua: true, country: true }, take: 50 });
  const s = await prisma.loginSession.create({ data: { userId, ua: ua?.slice(0, 300) ?? null, ip, country } });
  const label = describeDevice(ua);
  if (prior.length > 0 && !prior.some((p) => describeDevice(p.ua) === label && p.country === country))
    await notify(userId, { type: "SECURITY", title: "New sign-in to your account", body: `${label}${country ? ` · ${country}` : ""}. If this wasn't you, change your password and sign out other devices.`, href: "/account/security" });
  return s.id;
}
/** Signs out every device except (optionally) the current one. */
export const revokeOtherSessions = (userId: string, keepSid?: string) =>
  prisma.loginSession.updateMany({ where: { userId, revokedAt: null, ...(keepSid ? { NOT: { id: keepSid } } : {}) }, data: { revokedAt: new Date() } });

/** Makes the owner an admin without touching the database: set ADMIN_EMAILS in your hosting settings, then sign in.
 *  Only an email the user has VERIFIED counts (Google sign-in, or the link in the verification email), so nobody can
 *  become admin by simply signing up with your address. */
export async function promoteIfAdminEmail(userId: string) {
  const list = parseAdminEmails(process.env.ADMIN_EMAILS); if (list.length === 0) return;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, role: true } });
  if (!u || u.role === "ADMIN" || !u.emailVerified || !isListedAdmin(u.email, list)) return;
  await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
  await prisma.auditLog.create({ data: { adminId: userId, action: "admin_promoted_by_ADMIN_EMAILS", target: userId } });
}
