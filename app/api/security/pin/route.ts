import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { verifyPassword } from "@/lib/password";
import { checkPin, hashPin } from "@/lib/pin";
import { notify } from "@/lib/notify";
/** Set a transaction PIN (needs your password), or change it (needs the current PIN). */
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!(await limit(`pin:${userId}`, 8, 900))) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const p = z.object({ pin: z.string().regex(/^\d{4}$/), current: z.string().optional(), password: z.string().optional() }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "A PIN is exactly 4 digits." }, { status: 400 });
  if (/^(\d)\1{3}$/.test(p.data.pin) || ["1234", "4321", "0123"].includes(p.data.pin)) return NextResponse.json({ error: "Choose a PIN that's harder to guess." }, { status: 400 });
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { pinHash: true, passwordHash: true } });
  if (u.pinHash) { const r = await checkPin(userId, p.data.current ?? ""); if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 }); }
  else if (u.passwordHash && !(p.data.password && verifyPassword(p.data.password, u.passwordHash))) return NextResponse.json({ error: "Your password is wrong." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { pinHash: hashPin(p.data.pin), pinFails: 0, pinLockedUntil: null } });
  await notify(userId, { type: "SECURITY", title: u.pinHash ? "Transaction PIN changed" : "Transaction PIN set", body: "You'll need this PIN to withdraw money.", href: "/account/security" });
  return NextResponse.json({ ok: true });
}
