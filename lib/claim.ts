import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { fmt } from "./money";
import { notify } from "./notify";
import { PERSONAL_RE } from "./codes";

export class ClaimError extends Error {}

/** Atomically claims a giveaway. Everything happens in ONE transaction so
 *  concurrent claimers can never over-spend the escrow or claim twice. */
export async function claimGiveaway(slugOrCode: string, userId: string, phone?: string, fingerprint?: string, answer?: string) {
  if (PERSONAL_RE.test(slugOrCode.trim().toUpperCase())) { const r = await redeemPersonalCode(slugOrCode, userId, phone, fingerprint, answer); if (r) return r; }
  try {
    const r = await prisma.$transaction(async (tx) => {
      const found = await tx.giveaway.findFirst({ where: { OR: [{ claimSlug: slugOrCode }, { claimCode: slugOrCode }] }, select: { id: true } });
      if (!found) throw new ClaimError("Giveaway not found.");
      // Row lock: claimers of the same giveaway run one at a time, so the amount maths below never uses stale numbers
      await tx.$queryRaw`SELECT id FROM "Giveaway" WHERE id = ${found.id} FOR UPDATE`;
      const g = await tx.giveaway.findUniqueOrThrow({ where: { id: found.id } });
      if (g.flagged && !g.cancelledAt) throw new ClaimError("Giveaway not found.");
      if (g.cancelledAt) throw new ClaimError("This giveaway was cancelled by the host.");
      if (g.question && !answer?.trim()) throw new ClaimError("Answer the question to claim.");
      if (g.expiresAt < new Date()) throw new ClaimError("This giveaway has expired.");
      if (g.creatorId === userId) throw new ClaimError("You can't claim your own giveaway.");

      // Amount for this winner (last winner takes any remainder, so escrow empties exactly)
      const avg = Math.floor(g.totalAmount / g.winners);
      let amount = avg;
      if (g.winnersLeft === 1) amount = g.escrowRemaining;
      else if (g.distribution === "RANDOM") {
        const max = Math.min(avg * 2, g.escrowRemaining - (g.winnersLeft - 1));
        amount = 1 + Math.floor(Math.random() * Math.max(max, 1));
      }

      // Conditional decrement: fails (count 0) if someone else took the last slot
      const upd = await tx.giveaway.updateMany({
        where: { id: g.id, winnersLeft: { gt: 0 }, escrowRemaining: { gte: amount } },
        data: { winnersLeft: { decrement: 1 }, escrowRemaining: { decrement: amount } },
      });
      if (upd.count === 0) throw new ClaimError("All prizes have been claimed.");

      await tx.claim.create({ data: { giveawayId: g.id, userId, phone, fingerprint, amount, answer: answer?.trim().slice(0, 300) } });

      const wallet = await tx.wallet.upsert({
        where: { userId_currency: { userId, currency: g.currency } },
        update: { balance: { increment: amount } },
        create: { userId, currency: g.currency, balance: amount },
      });
      // Release from creator's locked funds
      await tx.wallet.update({
        where: { userId_currency: { userId: g.creatorId, currency: g.currency } },
        data: { locked: { decrement: amount } },
      });
      await tx.transaction.create({
        data: { walletId: wallet.id, type: "CLAIM_CREDIT", status: "SUCCESS", amount, reference: `claim_${g.id}_${userId}` },
      });
      return { amount, currency: g.currency, title: g.title, creatorId: g.creatorId, giveawayId: g.id, slug: g.claimSlug, winners: g.winners, left: g.winnersLeft - 1 };
    });
    const money = fmt(r.amount, r.currency), claimed = r.winners - r.left;
    await notify(userId, { type: "CLAIM", title: `You won ${money}`, body: `${money} from "${r.title}" is now in your wallet.`, href: "/wallet" });
    await notify(r.creatorId, { type: "GIVEAWAY", groupKey: `giveaway:${r.giveawayId}`, title: r.left === 0 ? "Your giveaway is fully claimed" : `${claimed} of ${r.winners} prizes claimed`, body: r.left === 0 ? `Everyone has claimed "${r.title}". Nothing is left in escrow.` : `"${r.title}" has been claimed ${claimed} time${claimed === 1 ? "" : "s"}. ${r.left} left.`, href: `/c/${r.slug}`, email: r.left === 0 });
    return { amount: r.amount, currency: r.currency, title: r.title };
  } catch (e) {
    // Unique-constraint hit = same user/phone/device already claimed
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw new ClaimError("You've already claimed this giveaway.");
    throw e;
  }
}

/** Redeems a one-time personal code. Returns null if the text isn't a personal code at all. */
export async function redeemPersonalCode(raw: string, userId: string, phone?: string, fingerprint?: string, answer?: string) {
  const code = raw.trim().toUpperCase();
  try {
    const r = await prisma.$transaction(async (tx) => {
      const found = await tx.personalCode.findUnique({ where: { code }, include: { giveaway: true } });
      if (!found) return null;
      await tx.$queryRaw`SELECT id FROM "PersonalCode" WHERE id = ${found.id} FOR UPDATE`; // two people typing the same code at once: only one wins
      const pc = await tx.personalCode.findUniqueOrThrow({ where: { id: found.id } }), g = found.giveaway;
      if (pc.redeemedAt) throw new ClaimError("This code has already been used.");
      if (g.cancelledAt) throw new ClaimError("This giveaway was cancelled by the host.");
      if (g.flagged) throw new ClaimError("Giveaway not found.");
      if (g.expiresAt < new Date()) throw new ClaimError("This giveaway has expired.");
      if (g.creatorId === userId) throw new ClaimError("You can't claim your own giveaway.");
      if (g.question && !answer?.trim()) throw new ClaimError("Answer the question to claim.");
      const upd = await tx.giveaway.updateMany({ where: { id: g.id, winnersLeft: { gt: 0 }, escrowRemaining: { gte: pc.amount } }, data: { winnersLeft: { decrement: 1 }, escrowRemaining: { decrement: pc.amount } } });
      if (upd.count === 0) throw new ClaimError("All prizes have been claimed.");
      await tx.personalCode.update({ where: { id: pc.id }, data: { redeemedById: userId, redeemedAt: new Date() } });
      await tx.claim.create({ data: { giveawayId: g.id, userId, phone, fingerprint, amount: pc.amount, answer: answer?.trim().slice(0, 300) } });
      const wallet = await tx.wallet.upsert({ where: { userId_currency: { userId, currency: g.currency } }, update: { balance: { increment: pc.amount } }, create: { userId, currency: g.currency, balance: pc.amount } });
      await tx.wallet.update({ where: { userId_currency: { userId: g.creatorId, currency: g.currency } }, data: { locked: { decrement: pc.amount } } });
      await tx.transaction.create({ data: { walletId: wallet.id, type: "CLAIM_CREDIT", status: "SUCCESS", amount: pc.amount, reference: `claim_${g.id}_${userId}` } });
      return { amount: pc.amount, currency: g.currency, title: g.title, creatorId: g.creatorId, giveawayId: g.id, slug: g.claimSlug, winners: g.winners, left: g.winnersLeft - 1 };
    });
    if (!r) return null;
    const money = fmt(r.amount, r.currency), claimed = r.winners - r.left;
    await notify(userId, { type: "CLAIM", title: `You won ${money}`, body: `${money} from "${r.title}" is now in your wallet.`, href: "/wallet" });
    await notify(r.creatorId, { type: "GIVEAWAY", groupKey: `giveaway:${r.giveawayId}`, title: r.left === 0 ? "Every code has been used" : `${claimed} of ${r.winners} codes used`, body: r.left === 0 ? `All personal codes for "${r.title}" were redeemed.` : `A code for "${r.title}" was just redeemed. ${r.left} left.`, href: `/manage/${r.giveawayId}`, email: r.left === 0 });
    return { amount: r.amount, currency: r.currency, title: r.title };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ClaimError("You've already claimed this giveaway.");
    throw e;
  }
}
