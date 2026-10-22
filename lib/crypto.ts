import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";
import { SITE } from "./seo";

export const COINS = [
  { id: "USDT-TRC20", coin: "USDT", network: "TRC20", label: "USDT on Tron (TRC20)", note: "Usually the cheapest and fastest", pay: "usdttrc20", prefix: "T", len: 34 },
  { id: "USDT-BEP20", coin: "USDT", network: "BEP20", label: "USDT on BNB Chain (BEP20)", note: "Low fees", pay: "usdtbsc", prefix: "0x", len: 42 },
  { id: "USDT-ERC20", coin: "USDT", network: "ERC20", label: "USDT on Ethereum (ERC20)", note: "Higher network fees", pay: "usdterc20", prefix: "0x", len: 42 },
  { id: "USDC-ERC20", coin: "USDC", network: "ERC20", label: "USDC on Ethereum (ERC20)", note: "Higher network fees", pay: "usdc", prefix: "0x", len: 42 },
  { id: "BTC", coin: "BTC", network: "Bitcoin", label: "Bitcoin (BTC)", note: "Slower confirmations", pay: "btc", prefix: "bc1", len: 42 },
  { id: "ETH", coin: "ETH", network: "Ethereum", label: "Ether (ETH)", note: "Higher network fees", pay: "eth", prefix: "0x", len: 42 },
] as const;
export const CRYPTO_MIN_USD = 10, CRYPTO_MAX_USD = 5000;
export const coinById = (id: string) => COINS.find((c) => c.id === id);
export const cryptoConfigured = () => !!process.env.NOWPAYMENTS_API_KEY;

/** Asks the crypto payment provider for a one-time deposit address. Written for NOWPayments' public API;
 *  check the field names against their current docs. Without a key, dev mode makes a clearly fake address. */
export async function createCryptoPayment(depositId: string, coin: (typeof COINS)[number], usd: number) {
  if (!cryptoConfigured()) {
    if (process.env.NODE_ENV === "production") throw new Error("Crypto deposits are not configured");
    const chars = "0123456789abcdefABCDEF", body = Array.from(randomBytes(coin.len), (b) => chars[b % chars.length]).join("").slice(0, coin.len - coin.prefix.length);
    return { providerId: `mock_${randomUUID()}`, address: coin.prefix + body, payAmount: null as number | null };
  }
  const r = await fetch("https://api.nowpayments.io/v1/payment", { method: "POST", headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!, "Content-Type": "application/json" }, body: JSON.stringify({ price_amount: usd, price_currency: "usd", pay_currency: coin.pay, order_id: depositId, order_description: "Givar USD deposit", ipn_callback_url: `${SITE}/api/webhooks/crypto` }), signal: AbortSignal.timeout(15000) });
  const j = await r.json();
  if (!r.ok || !j.pay_address) throw new Error(j.message ?? "Crypto provider error");
  return { providerId: String(j.payment_id), address: String(j.pay_address), payAmount: typeof j.pay_amount === "number" ? j.pay_amount : null };
}
const sortKeys = (v: unknown): unknown => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])])) : v;
/** NOWPayments signs the JSON body (keys sorted) with HMAC-SHA512 and your IPN secret. */
export function verifyIpn(body: unknown, sig: string | null) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET; if (!secret || !sig) return false;
  const expect = createHmac("sha512", secret).update(JSON.stringify(sortKeys(body))).digest("hex");
  return sig.length === expect.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}
/** Credits the user's USD wallet once, when the payment is confirmed. Safe to call twice. */
export async function creditCryptoDeposit(providerId: string) {
  return prisma.$transaction(async (tx) => {
    const d = await tx.cryptoDeposit.findUnique({ where: { providerId } });
    if (!d) return null;
    const flip = await tx.cryptoDeposit.updateMany({ where: { id: d.id, status: { not: "CREDITED" } }, data: { status: "CREDITED", creditedAt: new Date() } });
    if (flip.count !== 1) return null;
    const w = await tx.wallet.upsert({ where: { userId_currency: { userId: d.userId, currency: "USD" } }, update: { balance: { increment: d.usd } }, create: { userId: d.userId, currency: "USD", balance: d.usd } });
    await tx.transaction.create({ data: { walletId: w.id, type: "DEPOSIT", status: "SUCCESS", amount: d.usd, reference: `crypto_${providerId}`, meta: { coin: d.coin, network: d.network, method: "crypto" } } });
    return { userId: d.userId, usd: d.usd, coin: d.coin };
  });
}
