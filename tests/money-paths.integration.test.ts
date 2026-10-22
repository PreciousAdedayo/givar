/** Integration tests for everything that moves money. They need a DISPOSABLE Postgres:
 *    TEST_DATABASE_URL=postgresql://... npx prisma db push && npm test
 *  Skipped automatically when TEST_DATABASE_URL is not set. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";

const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("money paths", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any, claimGiveaway: any, ClaimError: any, settleDeposit: any, settleWithdrawal: any;
  beforeAll(async () => {
    process.env.DATABASE_URL = url; // must be set before the Prisma client is first imported
    ({ prisma } = await import("@/lib/prisma")); ({ claimGiveaway, ClaimError } = await import("@/lib/claim"));
    ({ settleDeposit } = await import("@/lib/wallet")); ({ settleWithdrawal } = await import("@/lib/payout"));
  });
  afterAll(async () => { await prisma?.$disconnect(); });

  const mkUser = async (tag: string) => { const u = await prisma.user.create({ data: { email: `${tag}-${randomUUID()}@t.test`, name: tag } }); await prisma.wallet.create({ data: { userId: u.id, currency: "NGN" } }); return u; };
  const mkGiveaway = async (creatorId: string, o: { total: number; winners: number; distribution?: "EQUAL" | "RANDOM"; expiresAt?: Date }) => {
    await prisma.wallet.update({ where: { userId_currency: { userId: creatorId, currency: "NGN" } }, data: { locked: { increment: o.total } } });
    return prisma.giveaway.create({ data: { creatorId, title: "t", totalAmount: o.total, escrowRemaining: o.total, winners: o.winners, winnersLeft: o.winners, distribution: o.distribution ?? "EQUAL", claimCode: `GV-${randomUUID().slice(0, 6)}`, claimSlug: randomUUID().slice(0, 9), expiresAt: o.expiresAt ?? new Date(Date.now() + 3600e3) } });
  };
  const wallet = (userId: string) => prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: "NGN" } } });

  it("20 people claim at once, 5 prizes: exactly 5 succeed and escrow empties to the kobo", async () => {
    const creator = await mkUser("creator"); const g = await mkGiveaway(creator.id, { total: 10001, winners: 5 });
    const users = await Promise.all(Array.from({ length: 20 }, (_, i) => mkUser(`c${i}`)));
    const res = await Promise.allSettled(users.map((u: { id: string }) => claimGiveaway(g.claimSlug, u.id)));
    const ok = res.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ amount: number }>[];
    expect(ok).toHaveLength(5);
    expect(ok.reduce((a, r) => a + r.value.amount, 0)).toBe(10001);
    const after = await prisma.giveaway.findUnique({ where: { id: g.id } });
    expect(after.escrowRemaining).toBe(0); expect(after.winnersLeft).toBe(0);
    expect((await wallet(creator.id)).locked).toBe(0);
  });
  it("random distribution pays out exactly the total, at least 1 each", async () => {
    const creator = await mkUser("creator"); const g = await mkGiveaway(creator.id, { total: 5000, winners: 7, distribution: "RANDOM" });
    const users = await Promise.all(Array.from({ length: 7 }, (_, i) => mkUser(`r${i}`)));
    const amounts: number[] = []; for (const u of users) amounts.push((await claimGiveaway(g.claimSlug, u.id)).amount);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(5000); expect(Math.min(...amounts)).toBeGreaterThanOrEqual(1);
  });
  it("the same person can't claim twice", async () => {
    const creator = await mkUser("creator"); const g = await mkGiveaway(creator.id, { total: 1000, winners: 5 }); const u = await mkUser("dup");
    await claimGiveaway(g.claimSlug, u.id); await expect(claimGiveaway(g.claimSlug, u.id)).rejects.toBeInstanceOf(ClaimError);
  });
  it("can't claim your own giveaway, or an expired one, or without answering the question", async () => {
    const creator = await mkUser("creator"); const u = await mkUser("x");
    const own = await mkGiveaway(creator.id, { total: 1000, winners: 2 }); await expect(claimGiveaway(own.claimSlug, creator.id)).rejects.toBeInstanceOf(ClaimError);
    const old = await mkGiveaway(creator.id, { total: 1000, winners: 2, expiresAt: new Date(Date.now() - 1000) }); await expect(claimGiveaway(old.claimSlug, u.id)).rejects.toBeInstanceOf(ClaimError);
    const q = await mkGiveaway(creator.id, { total: 1000, winners: 2 }); await prisma.giveaway.update({ where: { id: q.id }, data: { question: "Favourite food?" } });
    await expect(claimGiveaway(q.claimSlug, u.id)).rejects.toBeInstanceOf(ClaimError);
    await expect(claimGiveaway(q.claimSlug, u.id, undefined, undefined, "Jollof")).resolves.toBeTruthy();
  });
  it("a repeated deposit webhook credits once", async () => {
    const u = await mkUser("dep"); const w = await wallet(u.id); const reference = `dep_${randomUUID()}`;
    await prisma.transaction.create({ data: { walletId: w.id, type: "DEPOSIT", status: "PENDING", amount: 5000, reference } });
    await Promise.all([settleDeposit(reference), settleDeposit(reference), settleDeposit(reference)]);
    expect((await wallet(u.id)).balance).toBe(5000);
  });
  it("a failed withdrawal refunds once; a successful one never refunds", async () => {
    const u = await mkUser("wd"); const w = await wallet(u.id);
    const mk = async (ref: string) => prisma.transaction.create({ data: { walletId: w.id, type: "WITHDRAWAL", status: "PENDING", amount: 3000, reference: ref } });
    const bad = `wd_${randomUUID()}`, good = `wd_${randomUUID()}`; await mk(bad); await mk(good);
    await Promise.all([settleWithdrawal(bad, false), settleWithdrawal(bad, false)]); await settleWithdrawal(good, true); await settleWithdrawal(good, false);
    expect((await wallet(u.id)).balance).toBe(3000);
  });
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("personal codes", () => {
  it("each code works exactly once, even when 10 people try the same code at once", async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const { prisma } = await import("@/lib/prisma"); const { claimGiveaway } = await import("@/lib/claim"); const { randomUUID } = await import("crypto");
    const mk = async (t: string) => { const u = await prisma.user.create({ data: { email: `${t}-${randomUUID()}@t.test`, name: t } }); await prisma.wallet.create({ data: { userId: u.id, currency: "NGN" } }); return u; };
    const host = await mk("host"); await prisma.wallet.update({ where: { userId_currency: { userId: host.id, currency: "NGN" } }, data: { locked: { increment: 3000 } } });
    const g = await prisma.giveaway.create({ data: { creatorId: host.id, title: "p", totalAmount: 3000, escrowRemaining: 3000, winners: 3, winnersLeft: 3, mode: "PERSONAL", claimCode: `GV-${randomUUID().slice(0, 6)}`, claimSlug: randomUUID().slice(0, 9), expiresAt: new Date(Date.now() + 3600e3) } });
    await prisma.personalCode.createMany({ data: ["GV-AAAA-BBBB", "GV-CCCC-DDDD", "GV-EEEE-FFFF"].map((code) => ({ giveawayId: g.id, code: code.replace(/[AEI]/g, "K") + "", amount: 1000 })) });
    const code = (await prisma.personalCode.findFirstOrThrow({ where: { giveawayId: g.id } })).code;
    const users = await Promise.all(Array.from({ length: 10 }, (_, i) => mk(`p${i}`)));
    const res = await Promise.allSettled(users.map((u: { id: string }) => claimGiveaway(code, u.id)));
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
});
