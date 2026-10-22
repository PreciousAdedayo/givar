import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { makeBackupCodes, verifyTotp } from "@/lib/totp";
import { notify } from "@/lib/notify";
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!(await limit(`2fa-en:${userId}`, 10, 900))) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const p = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter the 6-digit code from your app." }, { status: 400 });
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { twoFactorSecret: true, twoFactorEnabled: true } });
  if (u.twoFactorEnabled || !u.twoFactorSecret) return NextResponse.json({ error: "Start the setup again." }, { status: 409 });
  if (!verifyTotp(u.twoFactorSecret, p.data.code)) return NextResponse.json({ error: "That code didn't match. Check your phone's clock and try the next code." }, { status: 400 });
  const { codes, stored } = makeBackupCodes();
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true, backupCodes: stored } });
  await notify(userId, { type: "SECURITY", title: "Two-factor authentication turned on", body: "Your account now needs a code from your authenticator app to sign in.", href: "/account/security" });
  return NextResponse.json({ ok: true, backupCodes: codes }); // the only time they are shown
}
