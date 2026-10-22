import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { toMinor } from "@/lib/money";

const Body = z.object({ prize: z.string().min(3).max(100), image: z.string().url().optional(), entryFee: z.number().min(0).max(1_000_000), maxEntries: z.number().int().min(2).max(100000), endsAt: z.string().datetime(), partner: z.string().max(60).optional() });

export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = Body.safeParse(await req.json());
  if (!p.success || new Date(p.data.endsAt) <= new Date()) return NextResponse.json({ error: "Check the details. The end date must be in the future." }, { status: 400 });
  const c = await prisma.contest.create({ data: { ...p.data, endsAt: new Date(p.data.endsAt), entryFee: toMinor(p.data.entryFee), hostId: userId } });
  return NextResponse.json({ id: c.id });
}
