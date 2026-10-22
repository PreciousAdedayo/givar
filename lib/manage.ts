import { prisma } from "./prisma";
import { refundGiveaway } from "./refund";
import { fmt } from "./money";
import { notify } from "./notify";

export type Outcome = { ok: true; message: string } | { ok: false; error: string };
/** Host cancels a giveaway that is still running. Unclaimed money returns to their wallet. The 5% fee is not refunded. */
export async function cancelGiveawayAsHost(userId: string, id: string): Promise<Outcome> {
  const g = await prisma.giveaway.findUnique({ where: { id } });
  if (!g || g.creatorId !== userId) return { ok: false, error: "Giveaway not found." };
  if (g.cancelledAt) return { ok: false, error: "This giveaway is already cancelled." };
  if (g.expiresAt <= new Date() || g.winnersLeft === 0) return { ok: false, error: "This giveaway is already over. You can renew it instead." };
  const refunded = await refundGiveaway(id); // zeroes the escrow and returns it
  await prisma.giveaway.update({ where: { id }, data: { cancelledAt: new Date() } });
  return { ok: true, message: `Giveaway cancelled. ${fmt(refunded, g.currency)} went back to your wallet.` };
}
/** Host cancels a contest before it is drawn. Contests with paid entries can't be cancelled automatically, because entrants must be refunded. */
export async function cancelContestAsHost(userId: string, id: string): Promise<Outcome> {
  const c = await prisma.contest.findUnique({ where: { id }, include: { _count: { select: { entries: true } } } });
  if (!c || c.hostId !== userId) return { ok: false, error: "Contest not found." };
  if (c.cancelledAt) return { ok: false, error: "This contest is already cancelled." };
  if (c.drawnAt || c.endsAt <= new Date()) return { ok: false, error: "This contest is already over. You can run it again instead." };
  if (c.entryFee > 0 && c._count.entries > 0) return { ok: false, error: "This contest has paid entries, so entrants must be refunded. Chat with support and we will cancel it and refund everyone." };
  await prisma.contest.update({ where: { id }, data: { cancelledAt: new Date() } });
  const entrants = await prisma.contestEntry.findMany({ where: { contestId: id }, select: { userId: true } });
  for (const e of entrants) await notify(e.userId, { type: "CONTEST", title: "A contest was cancelled", body: `The host cancelled "${c.prize}".`, href: `/contests/${id}` });
  return { ok: true, message: "Contest cancelled." };
}
export type Status = "live" | "ended" | "cancelled" | "claimed";
export const giveawayStatus = (g: { expiresAt: Date; winnersLeft: number; cancelledAt: Date | null; flagged: boolean }): Status => g.cancelledAt || g.flagged ? "cancelled" : g.winnersLeft === 0 ? "claimed" : g.expiresAt <= new Date() ? "ended" : "live";
export const contestStatus = (c: { endsAt: Date; drawnAt: Date | null; cancelledAt: Date | null }): Status => c.cancelledAt ? "cancelled" : c.drawnAt || c.endsAt <= new Date() ? "ended" : "live";
