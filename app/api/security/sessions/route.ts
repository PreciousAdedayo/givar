import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revokeOtherSessions } from "@/lib/sessions";
export async function POST(req: Request) {
  const s = await getSession(); if (!s) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ action: z.enum(["revoke", "revoke_others"]), id: z.string().optional() }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (p.data.action === "revoke_others") { await revokeOtherSessions(s.user.id, s.user.sid); return NextResponse.json({ ok: true }); }
  if (!p.data.id || p.data.id === s.user.sid) return NextResponse.json({ error: "Use Sign out to end this device." }, { status: 400 });
  await prisma.loginSession.updateMany({ where: { id: p.data.id, userId: s.user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
