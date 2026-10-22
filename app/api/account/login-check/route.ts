import { NextResponse } from "next/server";
import { z } from "zod";
import { checkCredentials } from "@/lib/credentials";
import { clientIp, limit } from "@/lib/ratelimit";
/** Step 1 of sign-in: tells the sign-in page whether to ask for a 2FA code. The password is checked again on the real sign-in. */
export async function POST(req: Request) {
  if (!(await limit(`lc:${clientIp(req)}`, 30, 900))) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const p = z.object({ identifier: z.string().min(3), password: z.string().min(1) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter your email or phone and password." }, { status: 400 });
  const r = await checkCredentials(p.data.identifier, p.data.password);
  if (!r.ok) return NextResponse.json({ error: "Wrong email, phone or password." }, { status: 401 });
  return NextResponse.json({ ok: true, needs2fa: r.user.twoFactor });
}
