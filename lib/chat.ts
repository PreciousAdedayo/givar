import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const MAX_LEN = 500;
export type RoomInfo = { key: string; kind: "g" | "c" | "s"; id: string; title: string; ownerId: string; role: "owner" | "member" | "staff" };
export const roomKey = (kind: "g" | "c" | "s", id: string) => `${kind}:${id}`;
export function parseRoom(key: string): { kind: "g" | "c" | "s"; id: string } | null {
  const m = /^([gcs]):([A-Za-z0-9_-]{6,40})$/.exec(key); return m ? { kind: m[1] as "g" | "c" | "s", id: m[2] } : null;
}
/** Who may open a room: giveaway = the host and people who claimed it. Contest = the host and entrants. Support = that user (and our staff). Admins can read everything. */
export async function roomAccess(key: string, userId: string, role: string): Promise<RoomInfo | null> {
  const r = parseRoom(key); if (!r) return null;
  const admin = role === "ADMIN";
  if (r.kind === "g") {
    const g = await prisma.giveaway.findUnique({ where: { id: r.id }, select: { title: true, creatorId: true } }); if (!g) return null;
    if (g.creatorId === userId) return { key, ...r, title: g.title, ownerId: g.creatorId, role: "owner" };
    if (await prisma.claim.findFirst({ where: { giveawayId: r.id, userId }, select: { id: true } })) return { key, ...r, title: g.title, ownerId: g.creatorId, role: "member" };
    return admin ? { key, ...r, title: g.title, ownerId: g.creatorId, role: "staff" } : null;
  }
  if (r.kind === "c") {
    const c = await prisma.contest.findUnique({ where: { id: r.id }, select: { prize: true, hostId: true } }); if (!c) return null;
    if (c.hostId === userId) return { key, ...r, title: c.prize, ownerId: c.hostId, role: "owner" };
    if (await prisma.contestEntry.findFirst({ where: { contestId: r.id, userId }, select: { id: true } })) return { key, ...r, title: c.prize, ownerId: c.hostId, role: "member" };
    return admin ? { key, ...r, title: c.prize, ownerId: c.hostId, role: "staff" } : null;
  }
  const t = await prisma.supportThread.findUnique({ where: { id: r.id }, select: { userId: true, subject: true } }); if (!t) return null;
  if (t.userId === userId) return { key, ...r, title: "Givar support", ownerId: t.userId, role: "owner" };
  return admin ? { key, ...r, title: t.subject ?? "Support chat", ownerId: t.userId, role: "staff" } : null;
}
export type Msg = { id: string; userId: string; name: string; fromStaff: boolean; hidden: boolean; body: string; at: string };
export async function listMessages(key: string, take = 60): Promise<Msg[]> {
  const rows = await prisma.chatMessage.findMany({ where: { roomKey: key }, orderBy: { createdAt: "desc" }, take, include: { user: { select: { name: true } } } });
  return rows.reverse().map((m) => ({ id: m.id, userId: m.userId, name: m.fromStaff ? "Givar Team" : shortName(m.user.name), fromStaff: m.fromStaff, hidden: m.hidden, body: m.hidden ? "" : m.body, at: m.createdAt.toISOString() }));
}
export const shortName = (n?: string | null) => { const [a, b] = (n ?? "").trim().split(/\s+/); return a ? (b ? `${a} ${b[0]}.` : a) : "Member"; };
export const markRead = (userId: string, key: string) => prisma.chatRead.upsert({ where: { userId_roomKey: { userId, roomKey: key } }, update: { lastReadAt: new Date() }, create: { userId, roomKey: key } });

/** Every room the user belongs to, with the last message and how many are unread. */
export async function myRooms(userId: string) {
  const [mineG, joinedG, mineC, joinedC, threads] = await Promise.all([
    prisma.giveaway.findMany({ where: { creatorId: userId }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.claim.findMany({ where: { userId }, select: { giveaway: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.contest.findMany({ where: { hostId: userId }, select: { id: true, prize: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.contestEntry.findMany({ where: { userId }, select: { contest: { select: { id: true, prize: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.supportThread.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, status: true } }),
  ]);
  const rooms: { key: string; kind: "support" | "giveaway" | "contest"; title: string; href: string; host: boolean }[] = [];
  for (const t of threads.slice(0, 1)) rooms.push({ key: roomKey("s", t.id), kind: "support", title: "Givar support", href: "/help/chat", host: false });
  const seen = new Set<string>();
  for (const g of [...mineG.map((x) => ({ ...x, host: true })), ...joinedG.map((x) => ({ ...x.giveaway, host: false }))]) if (!seen.has(g.id)) { seen.add(g.id); rooms.push({ key: roomKey("g", g.id), kind: "giveaway", title: g.title, href: `/c/${g.id}/community`, host: g.host }); }
  for (const c of [...mineC.map((x) => ({ id: x.id, title: x.prize, host: true })), ...joinedC.map((x) => ({ id: x.contest.id, title: x.contest.prize, host: false }))]) if (!seen.has(c.id)) { seen.add(c.id); rooms.push({ key: roomKey("c", c.id), kind: "contest", title: c.title, href: `/contests/${c.id}/community`, host: c.host }); }
  if (rooms.length === 0) return [];
  const keys = rooms.map((r) => r.key);
  const [last, unread] = await Promise.all([
    prisma.$queryRaw<{ roomKey: string; body: string; createdAt: Date; name: string | null; fromStaff: boolean }[]>(Prisma.sql`SELECT DISTINCT ON (m."roomKey") m."roomKey", m.body, m."createdAt", u.name, m."fromStaff" FROM "ChatMessage" m JOIN "User" u ON u.id = m."userId" WHERE m."roomKey" IN (${Prisma.join(keys)}) AND m.hidden = false ORDER BY m."roomKey", m."createdAt" DESC`),
    prisma.$queryRaw<{ roomKey: string; n: bigint }[]>(Prisma.sql`SELECT m."roomKey", count(*) AS n FROM "ChatMessage" m LEFT JOIN "ChatRead" r ON r."userId" = ${userId} AND r."roomKey" = m."roomKey" WHERE m."roomKey" IN (${Prisma.join(keys)}) AND m."userId" <> ${userId} AND m.hidden = false AND m."createdAt" > COALESCE(r."lastReadAt", '1970-01-01') GROUP BY m."roomKey"`),
  ]);
  return rooms.map((r) => { const l = last.find((x) => x.roomKey === r.key); return { ...r, last: l ? { body: l.body, at: l.createdAt, who: l.fromStaff ? "Givar Team" : shortName(l.name) } : null, unread: Number(unread.find((x) => x.roomKey === r.key)?.n ?? 0) }; })
    .sort((a, b) => (b.last?.at?.getTime() ?? 0) - (a.last?.at?.getTime() ?? 0));
}
export async function unreadChatCount(userId: string) { return (await myRooms(userId)).reduce((a, r) => a + r.unread, 0); }

/** Open support chats whose last message is from the customer, i.e. waiting for us to reply. */
export async function supportNeedsReply() {
  const r = await prisma.$queryRaw<{ n: bigint }[]>(Prisma.sql`SELECT count(*) AS n FROM "SupportThread" t WHERE t.status = 'OPEN' AND COALESCE((SELECT m."fromStaff" FROM "ChatMessage" m WHERE m."roomKey" = 's:' || t.id ORDER BY m."createdAt" DESC LIMIT 1), true) = false`);
  return Number(r[0]?.n ?? 0);
}
export const NOTICE = "Only the host and people who joined can see this chat. Givar moderators can review chats to keep everyone safe. Never share your password, PIN or card details.";
