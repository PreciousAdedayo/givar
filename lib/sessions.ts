import { headers } from "next/headers";
import { prisma } from "./prisma";
import { describeDevice } from "./device";
import { notify } from "./notify";

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
