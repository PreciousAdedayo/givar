import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { newClaimCode, newClaimSlug, newPersonalCode, splitAmounts } from "@/lib/codes";
import { toMinor } from "@/lib/money";

const FEE_RATE = 0.05; // platform revenue, charged on top of the giveaway amount
const Body = z.object({
  title: z.string().min(3).max(80), description: z.string().max(500).optional(),
  currency: z.enum(["NGN", "USD"]), amount: z.number().positive().max(10_000_000), winners: z.number().int().min(1).max(1000),
  distribution: z.enum(["EQUAL", "RANDOM"]), claimType: z.enum(["LINK", "CODE"]),
  expiresInHours: z.number().int().min(1).max(24 * 30), question: z.string().max(140).optional(),
  mode: z.enum(["SHARED", "PERSONAL"]).default("SHARED"), // PERSONAL: one unique one-time code per winner
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s?.user.id) return NextResponse.json({ error: "Sign in to create a giveaway." }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: s.user.id } });
  if (process.env.NODE_ENV === "production" && !(me?.emailVerified || me?.phoneVerified)) return NextResponse.json({ error: "Verify your email or phone to create a giveaway." }, { status: 403 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  const d = p.data, total = toMinor(d.amount), fee = Math.round(total * FEE_RATE);
  if (total < d.winners) return NextResponse.json({ error: "Amount is too small for that many winners." }, { status: 400 });

  try {
    const g = await prisma.$transaction(async (tx) => {
      // Lock funds: move total from balance to locked, and take the fee. Fails atomically if balance is short.
      const w = await tx.wallet.findUnique({ where: { userId_currency: { userId: s.user.id, currency: d.currency } } });
      const ok = w && (await tx.wallet.updateMany({ where: { id: w.id, balance: { gte: total + fee } }, data: { balance: { decrement: total + fee }, locked: { increment: total } } }));
      if (!w || !ok || ok.count === 0) throw new Error("INSUFFICIENT");
      const g = await tx.giveaway.create({ data: {
        creatorId: s.user.id, title: d.title, description: d.description, currency: d.currency, totalAmount: total, escrowRemaining: total,
        winners: d.winners, winnersLeft: d.winners, distribution: d.distribution, claimType: d.claimType, question: d.question,
        claimCode: newClaimCode(), claimSlug: newClaimSlug(), expiresAt: new Date(Date.now() + d.expiresInHours * 3600_000), mode: d.mode,
      } });
      if (d.mode === "PERSONAL") { // one code per winner, with its share fixed now
        const amounts = splitAmounts(total, d.winners, d.distribution), codes = new Set<string>();
        while (codes.size < d.winners) codes.add(newPersonalCode());
        await tx.personalCode.createMany({ data: Array.from(codes).map((code, i) => ({ giveawayId: g.id, code, amount: amounts[i] })) });
      }
      await tx.transaction.createMany({ data: [
        { walletId: w.id, type: "ESCROW_LOCK", status: "SUCCESS", amount: total, reference: `lock_${g.id}` },
        { walletId: w.id, type: "FEE", status: "SUCCESS", amount: fee, reference: `fee_${g.id}` },
      ] });
      return g;
    });
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "", claimLink = `${site}/c/${g.claimSlug}`;
    const codes = g.mode === "PERSONAL" ? (await prisma.personalCode.findMany({ where: { giveawayId: g.id }, orderBy: { createdAt: "asc" } })).map((c) => ({ code: c.code, amount: c.amount, link: `${claimLink}?code=${c.code}` })) : undefined;
    return NextResponse.json({ id: g.id, mode: g.mode, claimCode: g.claimCode, claimLink, codes });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") return NextResponse.json({ error: "Not enough balance. Add money to your wallet first." }, { status: 402 });
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
