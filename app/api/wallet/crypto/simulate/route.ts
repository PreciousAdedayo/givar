import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { creditCryptoDeposit } from "@/lib/crypto";
import { notify } from "@/lib/notify";
import { fmt } from "@/lib/money";
/** DEV ONLY: pretends the blockchain payment arrived, so you can test without sending real crypto. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" || process.env.NOWPAYMENTS_API_KEY) return NextResponse.json({ error: "Not available." }, { status: 404 });
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const p = z.object({ id: z.string() }).safeParse(await req.json());
  const d = p.success ? await prisma.cryptoDeposit.findFirst({ where: { id: p.data.id, userId } }) : null;
  if (!d) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const done = await creditCryptoDeposit(d.providerId);
  if (done) await notify(done.userId, { type: "DEPOSIT", title: "Crypto deposit received", body: `${fmt(done.usd, "USD")} from ${done.coin} was added to your dollar wallet.`, href: "/transactions" });
  return NextResponse.json({ ok: true });
}
