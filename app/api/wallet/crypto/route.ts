import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { limit } from "@/lib/ratelimit";
import { CRYPTO_MAX_USD, CRYPTO_MIN_USD, coinById, createCryptoPayment } from "@/lib/crypto";
export async function GET() {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const list = await prisma.cryptoDeposit.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 });
  return NextResponse.json(list.map((d) => ({ id: d.id, coin: d.coin, network: d.network, address: d.address, usd: d.usd / 100, status: d.status, at: d.createdAt })));
}
export async function POST(req: Request) {
  const userId = await getUserId(); if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!(await limit(`crypto:${userId}`, 10, 3600))) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const p = z.object({ coinId: z.string(), amount: z.number().min(CRYPTO_MIN_USD).max(CRYPTO_MAX_USD) }).safeParse(await req.json());
  const coin = p.success ? coinById(p.data.coinId) : undefined;
  if (!p.success || !coin) return NextResponse.json({ error: `Choose a coin and an amount between $${CRYPTO_MIN_USD} and $${CRYPTO_MAX_USD.toLocaleString()}.` }, { status: 400 });
  const id = crypto.randomUUID();
  try {
    const pay = await createCryptoPayment(id, coin, p.data.amount);
    const d = await prisma.cryptoDeposit.create({ data: { id, userId, coin: coin.coin, network: coin.network, address: pay.address, providerId: pay.providerId, usd: Math.round(p.data.amount * 100) } });
    return NextResponse.json({ id: d.id, address: d.address, coin: d.coin, network: d.network, usd: p.data.amount, payAmount: pay.payAmount, qr: await QRCode.toDataURL(d.address, { margin: 1, width: 200 }), dev: !process.env.NOWPAYMENTS_API_KEY });
  } catch (e) {
    console.error("crypto create", e);
    return NextResponse.json({ error: "Crypto deposits are unavailable right now. Try again later." }, { status: 502 });
  }
}
