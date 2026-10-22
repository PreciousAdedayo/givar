import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revokeOtherSessions } from "@/lib/sessions";
import { limit } from "@/lib/ratelimit";
import { notify } from "@/lib/notify";
import { hashPassword, verifyPassword } from "@/lib/password";
export async function POST(req: Request) {
  const sess = await getSession(); if (!sess) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const userId = sess.user.id;
  if (!(await limit(`pw:${userId}`, 5, 900))) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  const p = z.object({ current: z.string().optional(), password: z.string().min(8).max(100) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Use a new password of 8+ characters." }, { status: 400 });
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (me.passwordHash && !(p.data.current && verifyPassword(p.data.current, me.passwordHash))) return NextResponse.json({ error: "Your current password is wrong." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(p.data.password) } });
  await revokeOtherSessions(userId, sess.user.sid); // anyone else signed in is signed out
  await notify(userId, { type: "SECURITY", title: "Your password was changed", body: "If this wasn't you, reset your password now and contact support.", href: "/account/security" });
  return NextResponse.json({ ok: true });
}
