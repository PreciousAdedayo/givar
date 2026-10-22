import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { MAX_LEN, listMessages, markRead, roomAccess, roomKey } from "@/lib/chat";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: { room: string } }) {
  const s = await getSession(); if (!s) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const key = decodeURIComponent(params.room);
  const access = await roomAccess(key, s.user.id, s.user.role); if (!access) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (access.role !== "staff") await markRead(s.user.id, key);
  return NextResponse.json({ title: access.title, role: access.role, messages: await listMessages(key) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: { room: string } }) {
  const s = await getSession(); if (!s) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const userId = s.user.id;
  if (!(await limit(`chat:${userId}`, 20, 60))) return NextResponse.json({ error: "You're sending messages too fast. Wait a moment." }, { status: 429 });
  const p = z.object({ body: z.string().trim().min(1).max(MAX_LEN), topic: z.string().max(120).optional() }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: `Messages can be 1 to ${MAX_LEN} characters.` }, { status: 400 });
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { banned: true, chatMutedUntil: true, name: true } });
  if (me.banned) return NextResponse.json({ error: "Your account can't send messages." }, { status: 403 });
  if (me.chatMutedUntil && me.chatMutedUntil > new Date()) return NextResponse.json({ error: "You've been muted in chats by a moderator for now." }, { status: 403 });
  let key = decodeURIComponent(params.room);
  if (key === "s:new") { // first message of a support chat creates the thread
    const open = await prisma.supportThread.findFirst({ where: { userId, status: "OPEN" }, select: { id: true } });
    const t = open ?? (await prisma.supportThread.create({ data: { userId, subject: p.data.topic?.slice(0, 120) ?? null } }));
    key = roomKey("s", t.id);
  }
  const access = await roomAccess(key, userId, s.user.role); if (!access) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const staff = access.role === "staff" && access.kind === "s"; // only support rooms allow staff to speak; community monitoring is read-only here
  if (access.role === "staff" && !staff) return NextResponse.json({ error: "Moderators post announcements from the admin area." }, { status: 403 });
  await prisma.chatMessage.create({ data: { roomKey: key, userId, body: p.data.body, fromStaff: staff } });
  if (access.kind === "s") {
    await prisma.supportThread.update({ where: { id: access.id }, data: staff ? {} : { status: "OPEN", closedAt: null } });
    if (staff) await notify(access.ownerId, { type: "SUPPORT", groupKey: `support:${access.id}`, title: "Support replied to you", body: p.data.body.slice(0, 120), href: "/help/chat", emailOnce: true });
  }
  await markRead(userId, key);
  return NextResponse.json({ ok: true, room: key });
}
