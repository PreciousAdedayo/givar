import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { checkSecondFactor } from "@/lib/credentials";
import { notify } from "@/lib/notify";
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ code: z.string().min(6).max(12), password: z.string().optional() }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter a code from your app or a backup code." }, { status: 400 });
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, twoFactorEnabled: true } });
  if (!u.twoFactorEnabled) return NextResponse.json({ error: "Two-factor authentication is off." }, { status: 409 });
  if (u.passwordHash && !(p.data.password && verifyPassword(p.data.password, u.passwordHash))) return NextResponse.json({ error: "Your password is wrong." }, { status: 400 });
  if (!(await checkSecondFactor(userId, p.data.code))) return NextResponse.json({ error: "That code is wrong." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: null } });
  await notify(userId, { type: "SECURITY", title: "Two-factor authentication turned off", body: "If this wasn't you, change your password now.", href: "/account/security" });
  return NextResponse.json({ ok: true });
}
