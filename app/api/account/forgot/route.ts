import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, limit } from "@/lib/ratelimit";
import { createToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
export async function POST(req: Request) {
  if (!(await limit(`forgot:${clientIp(req)}`, 5, 3600))) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const p = z.object({ email: z.string().email() }).safeParse(await req.json());
  if (p.success) {
    const u = await prisma.user.findUnique({ where: { email: p.data.email.toLowerCase() } });
    if (u?.passwordHash) { try { const t = await createToken(u.id, "RESET", 60); await sendEmail(u.email!, "Reset your Givar password", `<p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset?token=${t}">Choose a new password</a>. This link works once and expires in 1 hour.</p>`); } catch (e) { console.error(e); } }
  }
  return NextResponse.json({ ok: true }); // same answer whether or not the email exists
}
