import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { claimGiveaway, ClaimError } from "@/lib/claim";

const Body = z.object({ code: z.string().min(4).max(40), fingerprint: z.string().max(80).optional(), answer: z.string().max(300).optional() });

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to claim." }, { status: 401 });
  if (!(await limit(`claim:${userId}`, 20, 60))) return NextResponse.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.banned) return NextResponse.json({ error: "Your account can't claim giveaways." }, { status: 403 });
  // A verified phone is what makes "one claim per person" real: it's unique per giveaway in the database
  if (process.env.NODE_ENV === "production" && !user.phoneVerified) return NextResponse.json({ error: "Verify your phone number to claim.", needsPhone: true }, { status: 403 });
  try {
    return NextResponse.json(await claimGiveaway(p.data.code, userId, user.phoneVerified ? user.phone ?? undefined : undefined, p.data.fingerprint, p.data.answer));
  } catch (e) {
    if (e instanceof ClaimError) return NextResponse.json({ error: e.message }, { status: 409 });
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
