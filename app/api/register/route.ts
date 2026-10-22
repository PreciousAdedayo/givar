import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { provisionUser } from "@/lib/virtual-accounts";
import { clientIp, limit } from "@/lib/ratelimit";
import { createToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { ensureReferralCode } from "@/lib/referral";

const Body = z.object({ name: z.string().min(2).max(60), identifier: z.string().min(5).max(80), password: z.string().min(8).max(100), ref: z.string().max(12).optional() });
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function POST(req: Request) {
  if (!(await limit(`reg:${clientIp(req)}`, 5, 3600))) return NextResponse.json({ error: "Too many sign-ups from this network. Try again later." }, { status: 429 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter your name, an email or phone, and a password of 8+ characters." }, { status: 400 });
  const { name, identifier, password, ref } = p.data;
  const referrer = ref ? await prisma.user.findUnique({ where: { referralCode: ref.toUpperCase() }, select: { id: true } }) : null;
  const isEmail = identifier.includes("@");
  const key = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier.replace(/\s/g, "") };
  if (await prisma.user.findFirst({ where: key })) return NextResponse.json({ error: "An account with these details already exists. Sign in instead." }, { status: 409 });
  const user = await prisma.user.create({ data: { name, ...key, passwordHash: hashPassword(password), referredById: referrer?.id } });
  await ensureReferralCode(user.id);
  await provisionUser(user);
  await notify(user.id, { type: "SYSTEM", title: "Welcome to Givar", body: "Your naira and dollar account numbers are ready. Add money to create your first giveaway.", href: "/", email: false });
  if (user.email) { // a failed email must never block sign-up
    try { const t = await createToken(user.id, "VERIFY", 1440); await sendEmail(user.email, "Verify your Givar email", `<p>Welcome to Givar.</p><p><a href="${site}/api/account/verify-email?token=${t}">Verify your email</a></p>`); } catch (e) { console.error(e); }
  }
  return NextResponse.json({ ok: true });
}
