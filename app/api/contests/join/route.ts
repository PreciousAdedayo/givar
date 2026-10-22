import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

class E extends Error {}
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in to join." }, { status: 401 });
  const p = z.object({ contestId: z.string() }).safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Contest" WHERE id = ${p.data.contestId} FOR UPDATE`;
      const c = await tx.contest.findUnique({ where: { id: p.data.contestId }, include: { _count: { select: { entries: true } } } });
      if (!c) throw new E("Contest not found.");
      if (c.cancelledAt) throw new E("This contest was cancelled by the host.");
      if (c.endsAt < new Date() || c.drawnAt) throw new E("This contest has ended.");
      if (c.hostId === userId) throw new E("You can't enter your own contest.");
      if (c._count.entries >= c.maxEntries) throw new E("This contest is full.");
      if (c.entryFee > 0) {
        const fee = Math.round(c.entryFee * 0.05);
        const debit = await tx.wallet.updateMany({ where: { userId, currency: c.currency, balance: { gte: c.entryFee } }, data: { balance: { decrement: c.entryFee } } });
        if (debit.count === 0) throw new E("Not enough balance. Add money to your wallet first.");
        const mine = await tx.wallet.findUniqueOrThrow({ where: { userId_currency: { userId, currency: c.currency } } });
        const host = await tx.wallet.upsert({ where: { userId_currency: { userId: c.hostId, currency: c.currency } }, update: { balance: { increment: c.entryFee - fee } }, create: { userId: c.hostId, currency: c.currency, balance: c.entryFee - fee } });
        await tx.transaction.createMany({ data: [
          { walletId: mine.id, type: "CONTEST_ENTRY", status: "SUCCESS", amount: c.entryFee, reference: `entry_${c.id}_${userId}` },
          { walletId: host.id, type: "FEE", status: "SUCCESS", amount: fee, reference: `cfee_${c.id}_${userId}`, meta: { note: "5% platform fee on entry" } },
        ] });
      }
      await tx.contestEntry.create({ data: { contestId: c.id, userId } }); // unique per user
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof E) return NextResponse.json({ error: e.message }, { status: 409 });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "You're already in this contest." }, { status: 409 });
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
