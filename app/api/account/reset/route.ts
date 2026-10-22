import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { consumeToken } from "@/lib/tokens";
import { notify } from "@/lib/notify";
export async function POST(req: Request) {
  const p = z.object({ token: z.string().min(20), password: z.string().min(8).max(100) }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Use a password of 8+ characters." }, { status: 400 });
  const userId = await consumeToken(p.data.token, "RESET");
  if (!userId) return NextResponse.json({ error: "This link has expired or was already used. Request a new one." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(p.data.password) } });
  await prisma.user.update({ where: { id: userId }, data: { sessionsValidAfter: new Date() } }); // every existing login stops working
  await notify(userId, { type: "SECURITY", title: "Your password was reset", body: "If this wasn't you, contact support right away.", href: "/account/security" });
  return NextResponse.json({ ok: true });
}
