import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { newSecret, otpauthUri } from "@/lib/totp";
export async function POST() {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!(await limit(`2fa-setup:${userId}`, 10, 3600))) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { twoFactorEnabled: true, email: true, phone: true } });
  if (u.twoFactorEnabled) return NextResponse.json({ error: "Two-factor authentication is already on." }, { status: 409 });
  const secret = newSecret(); // saved but NOT active until the user proves they can generate a code
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  const uri = otpauthUri(secret, u.email ?? u.phone ?? "account");
  return NextResponse.json({ secret, uri, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) });
}
