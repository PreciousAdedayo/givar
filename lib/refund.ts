import { prisma } from "./prisma";
import { fmt } from "./money";
import { notify } from "./notify";
/** Returns unclaimed escrow to the creator (used on expiry and admin cancel). Safe to run twice. */
export async function refundGiveaway(id: string) {
  let info: { userId: string; currency: "NGN" | "USD"; title: string } | null = null;
  const amount = await prisma.$transaction(async (tx) => {
    const g = await tx.giveaway.findUnique({ where: { id } });
    if (!g || g.escrowRemaining <= 0) return 0;
    const done = await tx.giveaway.updateMany({ where: { id, escrowRemaining: g.escrowRemaining }, data: { escrowRemaining: 0, winnersLeft: 0 } });
    if (done.count === 0) return 0;
    const w = await tx.wallet.update({ where: { userId_currency: { userId: g.creatorId, currency: g.currency } }, data: { locked: { decrement: g.escrowRemaining }, balance: { increment: g.escrowRemaining } } });
    await tx.transaction.create({ data: { walletId: w.id, type: "ESCROW_RELEASE", status: "SUCCESS", amount: g.escrowRemaining, reference: `refund_${id}` } });
    info = { userId: g.creatorId, currency: g.currency, title: g.title };
    return g.escrowRemaining;
  });
  const i = info as { userId: string; currency: "NGN" | "USD"; title: string } | null;
  if (amount > 0 && i) await notify(i.userId, { type: "GIVEAWAY", title: "Unclaimed money returned", body: `${fmt(amount, i.currency)} from "${i.title}" went back to your wallet.`, href: "/transactions" });
  return amount;
}
