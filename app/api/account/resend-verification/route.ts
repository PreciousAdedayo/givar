import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { createToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
export async function POST() {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!(await limit(`resend:${userId}`, 3, 3600))) return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!me.email || me.emailVerified) return NextResponse.json({ error: "Nothing to verify." }, { status: 400 });
  try { const t = await createToken(me.id, "VERIFY", 1440); await sendEmail(me.email, "Verify your Givar email", `<p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/api/account/verify-email?token=${t}">Verify your email</a></p>`); }
  catch { return NextResponse.json({ error: "Couldn't send the email. Try again shortly." }, { status: 502 }); }
  return NextResponse.json({ ok: true });
}
