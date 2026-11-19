import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { toMinor } from "@/lib/money";
import { settleDeposit } from "@/lib/wallet";

const Body = z.object({ amount: z.number().min(100).max(5_000_000) }); // NGN only; USD arrives via the virtual account

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Enter an amount between ₦100 and ₦5,000,000." }, { status: 400 });
  if (!process.env.PAYSTACK_SECRET && process.env.NODE_ENV === "production") return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const wallet = await prisma.wallet.upsert({ where: { userId_currency: { userId, currency: "NGN" } }, update: {}, create: { userId, currency: "NGN" } });
  const amount = toMinor(p.data.amount), reference = `dep_${randomUUID()}`;
  await prisma.transaction.create({ data: { walletId: wallet.id, type: "DEPOSIT", status: "PENDING", amount, reference } });

  if (!process.env.PAYSTACK_SECRET) {
    await settleDeposit(reference); // DEV ONLY: instant fake credit so you can test the flow
    return NextResponse.json({ credited: true });
  }
  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email ?? `${user.id}@givar.app`, amount, reference, currency: "NGN", callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet`, channels: ["card", "bank_transfer", "ussd"] }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.status || typeof j.data?.authorization_url !== "string") {
      await prisma.transaction.updateMany({ where: { reference, status: "PENDING" }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "Couldn't start the payment. Try again." }, { status: 502 });
    }
    return NextResponse.json({ url: j.data.authorization_url });
  } catch (e) {
    // A timeout can happen after the provider created the payment. Keep PENDING so a valid webhook can still settle it.
    console.error("Paystack initialize failed", e);
    return NextResponse.json({ error: "Payment provider is temporarily unavailable." }, { status: 502 });
  }
}
