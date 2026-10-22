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
    const va = await prisma.virtualAccount.findFirst({ where: { OR: [{ txRef: d.tx_ref ?? "" }, { accountNumber: d.account_number ?? "" }] } });
    if (!va) throw new Error(`No virtual account for ${d.tx_ref}`);
    const amount = Math.round(Number(d.amount) * 100);
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
