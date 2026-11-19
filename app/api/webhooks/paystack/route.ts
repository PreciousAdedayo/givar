import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { settleDeposit } from "@/lib/wallet";

export async function POST(req: Request) {
  const raw = await req.text(); // signature is over the RAW body
  const sig = req.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET ?? "").update(raw).digest("hex");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = JSON.parse(raw);
  try {
    if (body.event === "charge.success") {
      const d = body.data;
      if (!d || typeof d.reference !== "string" || !Number.isSafeInteger(d.amount) || d.amount <= 0 || d.currency !== "NGN" || d.status !== "success")
        return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
      const pending = await prisma.transaction.findUnique({ where: { reference: d.reference }, include: { wallet: { select: { currency: true } } } });
      if (!pending || pending.status !== "PENDING") return NextResponse.json({ ok: true }); // unknown or already-settled event
      if (pending.type !== "DEPOSIT" || pending.amount !== d.amount || pending.wallet.currency !== "NGN") {
        await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "paystack_mismatch", meta: { error: `Amount/currency/type mismatch for ${d.reference}`, body } } });
        return NextResponse.json({ error: "Payment details do not match the pending deposit." }, { status: 400 });
      }
      await settleDeposit(d.reference, { amount: d.amount, currency: d.currency });
    }
  } catch (e) {
    await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "paystack", meta: { error: String(e), body } } });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
