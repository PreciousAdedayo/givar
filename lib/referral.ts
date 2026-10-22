import { randomInt } from "crypto";
import { prisma } from "./prisma";
const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REFERRAL_BONUS = 50_000; // ₦500 in kobo, paid to the referrer
export const REFERRAL_MIN_DEPOSIT = 100_000; // the friend's first deposit must be at least ₦1,000
const code = () => Array.from({ length: 7 }, () => A[randomInt(A.length)]).join("");
/** Gives the user a short referral code (once). */
export async function ensureReferralCode(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (u?.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) { try { const c = code(); await prisma.user.update({ where: { id: userId }, data: { referralCode: c } }); return c; } catch { /* collision: try again */ } }
  return null;
}

import { fmt } from "./money";
import { notify } from "./notify";
/** Call after any successful deposit. The first qualifying deposit by a referred friend pays the referrer, exactly once. */
export async function afterDeposit(userId: string, amountMinor: number, currency: "NGN" | "USD") {
  try {
    if (currency === "NGN" ? amountMinor < REFERRAL_MIN_DEPOSIT : amountMinor < 200) return; // ₦1,000 or $2
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { referredById: true, name: true } });
    if (!u?.referredById) return;
    const credited = await prisma.$transaction(async (tx) => {
      try { await tx.referralReward.create({ data: { referrerId: u.referredById!, referredId: userId, amount: REFERRAL_BONUS } }); } catch { return false; } // unique(referredId): already paid
      const w = await tx.wallet.upsert({ where: { userId_currency: { userId: u.referredById!, currency: "NGN" } }, update: { balance: { increment: REFERRAL_BONUS } }, create: { userId: u.referredById!, currency: "NGN", balance: REFERRAL_BONUS } });
      await tx.transaction.create({ data: { walletId: w.id, type: "REFERRAL_BONUS", status: "SUCCESS", amount: REFERRAL_BONUS, reference: `ref_${userId}` } });
      return true;
    });
    if (credited) await notify(u.referredById, { type: "SYSTEM", title: `You earned ${fmt(REFERRAL_BONUS, "NGN")}`, body: `${u.name?.split(" ")[0] ?? "Your friend"} made their first deposit, so your referral bonus is in your wallet.`, href: "/referrals" });
  } catch (e) { console.error("referral reward", e); }
}
