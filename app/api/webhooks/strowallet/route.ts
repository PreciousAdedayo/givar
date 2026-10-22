import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { afterDeposit } from "@/lib/referral";
import { fmt } from "@/lib/money";

/** USD deposits. TODO: the header name, event names and payload fields below are ASSUMPTIONS.
 *  Match them to Strowallet/Maplerad's webhook docs before going live. */
export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.STROWALLET_WEBHOOK_SECRET || !process.env.STROWALLET_WEBHOOK_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const d = body?.data ?? body;
  try {
    const va = await prisma.virtualAccount.findUnique({ where: { accountNumber: String(d.account_number) } });
    if (!va || va.currency !== "USD") throw new Error(`No USD account ${d.account_number}`);
    const amount = Math.round(Number(d.amount) * 100);
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.upsert({ where: { userId_currency: { userId: va.userId, currency: "USD" } }, update: { balance: { increment: amount } }, create: { userId: va.userId, currency: "USD", balance: amount } });
      await tx.transaction.create({ data: { walletId: w.id, type: "DEPOSIT", status: "SUCCESS", amount, reference: `stw_${d.reference ?? d.id}`, meta: d } });
    });
    await notify(va.userId, { type: "DEPOSIT", title: "Money received", body: `${fmt(amount, "USD")} arrived in your dollar account.`, href: "/transactions" });
    await afterDeposit(va.userId, amount, "USD");
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ ok: true });
    await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "strowallet", meta: { error: String(e?.message), body } } });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
