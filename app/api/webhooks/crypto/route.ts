import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COINS, creditCryptoDeposit, verifyIpn } from "@/lib/crypto";
import { afterDeposit } from "@/lib/referral";
import { notify } from "@/lib/notify";
import { fmt } from "@/lib/money";

/** Payment status updates from the crypto provider. Only a signed "finished" payment that covers the amount credits the wallet. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !verifyIpn(body, req.headers.get("x-nowpayments-sig"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const providerId = String(body.payment_id ?? ""), status = String(body.payment_status ?? "");
  try {
    const d = await prisma.cryptoDeposit.findUnique({ where: { providerId } });
    if (!d) return NextResponse.json({ ok: true });
    if (status === "confirming" || status === "confirmed" || status === "sending") await prisma.cryptoDeposit.updateMany({ where: { id: d.id, status: "WAITING" }, data: { status: "CONFIRMING" } });
    else if (status === "failed" || status === "expired") await prisma.cryptoDeposit.updateMany({ where: { id: d.id, status: { in: ["WAITING", "CONFIRMING"] } }, data: { status: status.toUpperCase() } });
    else if (status === "partially_paid") await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "crypto_partial", meta: { error: `Partial payment for ${providerId}: needs manual review`, body } } });
    else if (status === "finished") {
      const paid = Number(body.actually_paid), asked = Number(body.pay_amount);
      const price = Number(body.price_amount);
      const depositCoin = COINS.find((c) => c.pay.toLowerCase() === String(body.pay_currency ?? "").toLowerCase());
      const paymentTolerance = Number.isFinite(asked) && asked > 0 ? Math.max(0.00000001, asked * 0.00000001) : 0;
      // Never credit the full USD value for a materially underpaid token transfer.
      const amountValid = Number.isFinite(paid) && paid > 0 && Number.isFinite(asked) && asked > 0 && paid + paymentTolerance >= asked;
      const priceValid = Number.isFinite(price) && price > 0;
      if (!depositCoin || !amountValid || !priceValid) {
        await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "crypto_invalid_amount", meta: { error: `Invalid or underpaid crypto deposit ${providerId}`, body } } });
      } else {
        const deposit = await prisma.cryptoDeposit.findUnique({ where: { providerId } });
        const expectedCurrency = deposit && COINS.some((c) => c.coin === deposit.coin && c.network === deposit.network && c.pay.toLowerCase() === String(body.pay_currency ?? "").toLowerCase());
        const quoted = deposit?.payAmount ? Number(deposit.payAmount) : NaN;
        const quoteMatches = Number.isFinite(quoted) && quoted > 0 && Number.isFinite(asked) && Math.abs(asked - quoted) <= Math.max(0.00000001, quoted * 0.000001);
        const orderMatches = !!deposit && String(body.order_id ?? "") === deposit.id;
        const usdMatches = !!deposit && Math.abs(price - deposit.usd / 100) <= 0.01 && String(body.price_currency ?? "").toLowerCase() === "usd";
        if (!deposit || !expectedCurrency || !quoteMatches || !orderMatches || !usdMatches) {
          await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "crypto_mismatch", meta: { error: `Crypto deposit details mismatch ${providerId}`, body } } });
        } else {
          const done = await creditCryptoDeposit(providerId);
          if (done) { await notify(done.userId, { type: "DEPOSIT", title: "Crypto deposit received", body: `${fmt(done.usd, "USD")} from ${done.coin} was added to your dollar wallet.`, href: "/transactions" }); await afterDeposit(done.userId, done.usd, "USD"); }
        }
      }
    }
  } catch (e) {
    await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "crypto", meta: { error: String(e), body } } });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
