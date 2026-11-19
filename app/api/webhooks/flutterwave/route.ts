import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settleWithdrawal } from "@/lib/payout";
import { notify } from "@/lib/notify";
import { afterDeposit } from "@/lib/referral";
import { fmt } from "@/lib/money";

/** Credits a wallet when money lands in a user's Givar virtual account.
 *  Idempotent: Transaction.reference is unique, so retries never double-credit. */
export async function POST(req: Request) {
  if (req.headers.get("verif-hash") !== process.env.FLUTTERWAVE_SECRET_HASH)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const d = body?.data;
  try {
    if (body.event === "transfer.completed") { // payout result: success keeps the debit, failure refunds the wallet
      if (d?.reference) await settleWithdrawal(d.reference, d.status === "SUCCESSFUL");
      return NextResponse.json({ ok: true });
    }
    if (body.event !== "charge.completed" || d?.status !== "successful") return NextResponse.json({ ok: true });
    if (String(d.currency ?? "").toUpperCase() !== "NGN") return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    if (!process.env.FLUTTERWAVE_SECRET || !d.id) throw new Error("Flutterwave verification is not configured or transaction ID is missing");
    const verifyResponse = await fetch(`${process.env.FLUTTERWAVE_BASE ?? "https://api.flutterwave.com/v3"}/transactions/${encodeURIComponent(String(d.id))}/verify`, { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}` }, signal: AbortSignal.timeout(15000) });
    const verified = await verifyResponse.json().catch(() => null);
    const v = verified?.data;
    const webhookAmount = Math.round(Number(d.amount) * 100);
    if (!verifyResponse.ok || verified?.status !== "success" || v?.status !== "successful" || String(v?.currency ?? "").toUpperCase() !== "NGN" || Math.round(Number(v?.amount) * 100) !== webhookAmount || (d.tx_ref && v?.tx_ref !== d.tx_ref)) throw new Error("Flutterwave transaction verification failed or payload did not match");
    const va = await prisma.virtualAccount.findFirst({ where: { OR: [{ txRef: d.tx_ref ?? "" }, { accountNumber: d.account_number ?? "" }] } });
    if (!va) throw new Error(`No virtual account for ${d.tx_ref}`);
    const amount = Math.round(Number(d.amount) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0 || !d.id) throw new Error("Invalid Flutterwave transaction amount or ID");
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.upsert({
        where: { userId_currency: { userId: va.userId, currency: "NGN" } },
        update: { balance: { increment: amount } },
        create: { userId: va.userId, currency: "NGN", balance: amount },
      });
      await tx.transaction.create({ data: { walletId: w.id, type: "DEPOSIT", status: "SUCCESS", amount, reference: `flw_${d.id}`, meta: d } });
    });
    await notify(va.userId, { type: "DEPOSIT", title: "Money received", body: `${fmt(amount, "NGN")} arrived in your naira account.`, href: "/transactions" });
    await afterDeposit(va.userId, amount, "NGN");
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ ok: true }); // duplicate delivery
    await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "flutterwave", meta: { error: String(e?.message), body } } });
    return NextResponse.json({ error: "failed" }, { status: 500 }); // provider will retry
  }
  return NextResponse.json({ ok: true });
}
