import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { DEFAULT_PREFS, esc, shouldEmail, type NType } from "./notify-rules";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
export type NotifyInput = { type: NType; title: string; body: string; href?: string; groupKey?: string; email?: boolean; emailOnce?: boolean };

/** Creates an in-app notification and (if the user's settings allow) emails it.
 *  NEVER throws: a failed notification must not break a payment, a claim or a review. */
export async function notify(userId: string, n: NotifyInput) {
  try {
    const data = { type: n.type, title: n.title, body: n.body, href: n.href ?? null };
    // emailOnce: if the user hasn't read the previous message in this group yet, don't send another email
    const prevUnread = n.emailOnce && n.groupKey ? !!(await prisma.notification.findFirst({ where: { userId, groupKey: n.groupKey, readAt: null }, select: { id: true } })) : false;
    if (n.groupKey) await prisma.notification.upsert({ where: { userId_groupKey: { userId, groupKey: n.groupKey } }, update: { ...data, readAt: null, createdAt: new Date() }, create: { userId, groupKey: n.groupKey, ...data } });
    else await prisma.notification.create({ data: { userId, ...data } });
    if (n.email === false || prevUnread) return;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, notificationPref: true } });
    if (!u?.email || !shouldEmail(n.type, { ...DEFAULT_PREFS, ...(u.notificationPref ?? {}) })) return;
    await sendEmail(u.email, n.title, `<p>${esc(n.body)}</p>${n.href ? `<p><a href="${site}${n.href}">Open in Givar</a></p>` : ""}<p style="color:#888;font-size:12px">You can choose which emails you get in Notification settings.</p>`);
  } catch (e) { console.error("notify failed", e); }
}

/** In-app only, for announcements to many people. Sent in batches. */
export async function notifyMany(userIds: string[], n: Omit<NotifyInput, "groupKey" | "email" | "emailOnce"> & { broadcastId?: string }) {
  let sent = 0;
  for (let i = 0; i < userIds.length; i += 1000) {
    const r = await prisma.notification.createMany({ data: userIds.slice(i, i + 1000).map((userId) => ({ userId, type: n.type, title: n.title, body: n.body, href: n.href ?? null, broadcastId: n.broadcastId })) });
    sent += r.count;
  }
  return sent;
}
export const unreadCount = (userId: string) => prisma.notification.count({ where: { userId, readAt: null } });
