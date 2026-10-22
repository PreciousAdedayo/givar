import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { hashCode } from "@/lib/otp";
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  const otp = await prisma.phoneOtp.findUnique({ where: { userId } });
  if (!otp || otp.expiresAt < new Date()) return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
  if (otp.attempts >= 5) return NextResponse.json({ error: "Too many wrong codes. Request a new one." }, { status: 429 });
  await prisma.phoneOtp.update({ where: { userId }, data: { attempts: { increment: 1 } } });
  const a = Buffer.from(hashCode(p.data.code, userId)), b = Buffer.from(otp.hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Wrong code. Check and try again." }, { status: 400 });
  try {
    await prisma.$transaction([prisma.user.update({ where: { id: userId }, data: { phone: otp.phone, phoneVerified: true } }), prisma.phoneOtp.delete({ where: { userId } })]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "That number is already used by another account." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
