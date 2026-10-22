import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { toMinor } from "@/lib/money";
import { limit } from "@/lib/ratelimit";
import { checkPin } from "@/lib/pin";
import { notify } from "@/lib/notify";
import { fmt } from "@/lib/money";
import { payoutsConfigured, resolveAccount, sendTransfer, settleWithdrawal } from "@/lib/payout";
import { USD_MAX, USD_MIN, UsdDetails, maskAcct } from "@/lib/withdraw-usd";

const prod = process.env.NODE_ENV === "production";
const Ngn = z.object({ currency: z.literal("NGN"), amount: z.number().min(500).max(5_000_000), bankCode: z.string().min(2).max(10), accountNumber: z.string().regex(/^\d{10}$/), pin: z.string().regex(/^\d{4}$/) });
const Usd = z.object({ currency: z.literal("USD"), amount: z.number().min(USD_MIN / 100).max(USD_MAX / 100), pin: z.string().regex(/^\d{4}$/), details: UsdDetails });
const Body = z.discriminatedUnion("currency", [Ngn, Usd]);
const fail = (error: string, status = 400, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });

export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return fail("Sign in first.", 401);
  if (!(await limit(`wd:${userId}`, 10, 3600))) return fail("Too many withdrawal attempts. Try again later.", 429);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.banned) return fail("Your account can't withdraw.", 403);
  if (prod && user.kyc !== "VERIFIED") return fail("Verify your identity to withdraw.", 403, { needsKyc: true });
  const p = Body.safeParse(await req.json());
  if (!p.success) return fail(p.error.issues[0]?.message && p.error.issues[0].path.length > 1 ? p.error.issues[0].message : "Check the details and amount.");
  const pin = await checkPin(userId, p.data.pin);
  if (!pin.ok) return fail(pin.error, 403, { needsPin: pin.code === "NO_PIN" });
  const currency = p.data.currency, amount = toMinor(p.data.amount), reference = `wd_${randomUUID()}`;

  let meta: Record<string, unknown>;
  if (p.data.currency === "NGN") {
    if (prod && !payoutsConfigured()) return fail("Withdrawals are temporarily unavailable.", 503);
    const accountName = await resolveAccount(p.data.bankCode, p.data.accountNumber);
    if (!accountName) return fail("We couldn't find that account. Check the bank and number.", 404);
    meta = { bankCode: p.data.bankCode, accountNumber: p.data.accountNumber, accountName };
  } else meta = { ...p.data.details, method: p.data.details.method };

  try {
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUniqueOrThrow({ where: { userId_currency: { userId, currency } } });
      const ok = await tx.wallet.updateMany({ where: { id: w.id, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
      if (ok.count === 0) throw new Error("INSUFFICIENT");
      await tx.transaction.create({ data: { walletId: w.id, type: "WITHDRAWAL", status: "PENDING", amount, reference, meta: meta as object } });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") return fail("Not enough balance.", 402);
    return fail("Something went wrong. Try again.", 500);
  }

  if (currency === "USD") { // USD payouts are reviewed and sent by our team (see Admin > Withdrawals)
    await notify(userId, { type: "WITHDRAWAL", title: "Withdrawal request received", body: `${fmt(amount, "USD")} to ${(meta as { bankName?: string }).bankName ?? "your bank"} ${maskAcct((meta as { accountNumber?: string }).accountNumber)}. We process USD withdrawals within 1 to 2 business days.`, href: "/transactions" });
    return NextResponse.json({ ok: true, review: true });
  }
  if (!payoutsConfigured()) { await settleWithdrawal(reference, true); return NextResponse.json({ ok: true, note: "dev mode: no real transfer" }); }
  const result = await sendTransfer({ reference, amountMinor: amount, bankCode: (meta as { bankCode: string }).bankCode, accountNumber: (meta as { accountNumber: string }).accountNumber });
  if (result === "rejected") { await settleWithdrawal(reference, false); return fail("Your bank transfer couldn't be started. Your money is back in your wallet.", 502); }
  if (result === "unknown") await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "payout_unknown", meta: { reference, error: "Transfer outcome unknown; reconcile before refunding" } } });
  return NextResponse.json({ ok: true });
}
