import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { hashCode } from "@/lib/otp";
import { sendSms } from "@/lib/sms";
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ phone: z.string().regex(/^\+\d{8,15}$/) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter your number with country code, like +2348012345678." }, { status: 400 });
  if (!(await limit(`otp:${userId}`, 3, 3600))) return NextResponse.json({ error: "Too many codes requested. Try again in an hour." }, { status: 429 });
  if (await prisma.user.findFirst({ where: { phone: p.data.phone, phoneVerified: true, NOT: { id: userId } } })) return NextResponse.json({ error: "That number is already used by another account." }, { status: 409 });
  const code = String(randomInt(100000, 1000000));
  await prisma.phoneOtp.upsert({ where: { userId }, update: { phone: p.data.phone, hash: hashCode(code, userId), attempts: 0, expiresAt: new Date(Date.now() + 10 * 60000) }, create: { userId, phone: p.data.phone, hash: hashCode(code, userId), expiresAt: new Date(Date.now() + 10 * 60000) } });
  try { await sendSms(p.data.phone, `Your Givar code is ${code}. It expires in 10 minutes.`); } catch { return NextResponse.json({ error: "We couldn't send the code. Try again shortly." }, { status: 502 }); }
  return NextResponse.json({ ok: true });
}
