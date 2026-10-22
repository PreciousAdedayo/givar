import { prisma } from "./prisma";
import { fmt } from "./money";
import { notify } from "./notify";
import { afterDeposit } from "./referral";
/** Marks a pending deposit successful and credits the wallet. Idempotent via the PENDING->SUCCESS guard. */
export async function settleDeposit(reference: string) {
  const done = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { reference } });
    if (!t) return null;
    const flip = await tx.transaction.updateMany({ where: { id: t.id, status: "PENDING" }, data: { status: "SUCCESS" } });
    if (flip.count !== 1) return null;
    const w = await tx.wallet.update({ where: { id: t.walletId }, data: { balance: { increment: t.amount } } });
    return { userId: w.userId, amount: t.amount, currency: w.currency };
  });
  if (done) {
    await notify(done.userId, { type: "DEPOSIT", title: "Money added", body: `${fmt(done.amount, done.currency)} was added to your wallet.`, href: "/transactions" });
    await afterDeposit(done.userId, done.amount, done.currency);
  }
}
