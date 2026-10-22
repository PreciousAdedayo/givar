import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { refundGiveaway } from "@/lib/refund";
import { notify } from "@/lib/notify";

/** Runs on a schedule (vercel.json). Picks a winner with a cryptographically secure RNG. */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const due = await prisma.contest.findMany({ where: { endsAt: { lte: new Date() }, drawnAt: null, cancelledAt: null }, include: { entries: true } });
  for (const c of due) {
    const winnerId = c.entries.length ? c.entries[randomInt(c.entries.length)].userId : null;
    // Guarded update: if two runs overlap, only one can draw
    const r = await prisma.contest.updateMany({ where: { id: c.id, drawnAt: null }, data: { winnerId, drawnAt: new Date() } });
    if (r.count === 1) {
      if (winnerId) await notify(winnerId, { type: "CONTEST", title: "You won a contest!", body: `You won: ${c.prize}. Open the contest to contact the host and collect your prize.`, href: `/contests/${c.id}` });
      await notify(c.hostId, { type: "CONTEST", title: winnerId ? "Your contest has a winner" : "Your contest ended with no entries", body: winnerId ? `A winner was drawn for "${c.prize}". Open it to see their contact details.` : `"${c.prize}" ended with no entries.`, href: `/contests/${c.id}` });
    }
  }
  // Also return unclaimed money from expired giveaways to their creators
  const expired = await prisma.giveaway.findMany({ where: { expiresAt: { lte: new Date() }, escrowRemaining: { gt: 0 } }, select: { id: true } });
  for (const g of expired) await refundGiveaway(g.id);
  const old = new Date(Date.now() - 864e5);
  await prisma.rateHit.deleteMany({ where: { createdAt: { lt: old } } });
  await prisma.authToken.deleteMany({ where: { expiresAt: { lt: old } } });
  await prisma.phoneOtp.deleteMany({ where: { expiresAt: { lt: old } } });
  return NextResponse.json({ drawn: due.length, refunded: expired.length });
}
