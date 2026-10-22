import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creditCryptoDeposit, verifyIpn } from "@/lib/crypto";
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
      if (paid && asked && paid < asked * 0.99) await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "crypto_underpaid", meta: { error: `Underpaid ${providerId}`, body } } });
      else {
        const done = await creditCryptoDeposit(providerId);
        if (done) { await notify(done.userId, { type: "DEPOSIT", title: "Crypto deposit received", body: `${fmt(done.usd, "USD")} from ${done.coin} was added to your dollar wallet.`, href: "/transactions" }); await afterDeposit(done.userId, done.usd, "USD"); }
      }
    }
  } catch (e) {
    await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "crypto", meta: { error: String(e), body } } });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
