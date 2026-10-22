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
    if (body.event === "charge.success") await settleDeposit(body.data.reference);
  } catch (e) {
    await prisma.analyticsEvent.create({ data: { type: "webhook_failed", path: "paystack", meta: { error: String(e), body } } });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
