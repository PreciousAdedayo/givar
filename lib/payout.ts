import { prisma } from "./prisma";
import { fmt } from "./money";
import { notify } from "./notify";
import { NG_BANKS } from "./banks";

const BASE = process.env.FLUTTERWAVE_BASE ?? "https://api.flutterwave.com/v3";
const auth = () => ({ Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET}`, "Content-Type": "application/json" });
export const payoutsConfigured = () => !!process.env.FLUTTERWAVE_SECRET;

export async function listBanks(): Promise<{ code: string; name: string }[]> {
  if (!payoutsConfigured()) return NG_BANKS; // no provider key: use our built-in list of Nigerian banks
  try {
    const r = await fetch(`${BASE}/banks/NG`, { headers: auth(), next: { revalidate: 86400 } });
    const j = await r.json();
    const live: { code: string; name: string }[] = j.status === "success" ? j.data.map((b: { code: string; name: string }) => ({ code: b.code, name: b.name })) : [];
    return live.length ? live.sort((a, b) => a.name.localeCompare(b.name)) : NG_BANKS;
  } catch { return NG_BANKS; }
}

export async function resolveAccount(bankCode: string, accountNumber: string): Promise<string | null> {
  if (!payoutsConfigured()) return "TEST ACCOUNT";
  const r = await fetch(`${BASE}/accounts/resolve`, { method: "POST", headers: auth(), body: JSON.stringify({ account_number: accountNumber, account_bank: bankCode }) });
  const j = await r.json();
  return j.status === "success" ? j.data.account_name : null;
}

/** "rejected" = provider clearly refused (safe to refund). "unknown" = timeout/network error: the money MAY have left,
 *  so we must NOT refund automatically; the withdrawal stays PENDING for reconciliation. */
export async function sendTransfer(p: { reference: string; amountMinor: number; bankCode: string; accountNumber: string }): Promise<"queued" | "rejected" | "unknown"> {
  try {
    const r = await fetch(`${BASE}/transfers`, {
      method: "POST", headers: auth(), signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ account_bank: p.bankCode, account_number: p.accountNumber, amount: p.amountMinor / 100, currency: "NGN", narration: "Givar withdrawal", reference: p.reference }),
    });
    const j = await r.json();
    if (j.status === "success") return "queued";
    return r.status >= 400 && r.status < 500 ? "rejected" : "unknown";
  } catch {
    return "unknown";
  }
}

/** Final outcome of a withdrawal. Idempotent: only the first call to flip PENDING has any effect.
 *  Failure returns the money to the wallet. */
export async function settleWithdrawal(reference: string, success: boolean) {
  const done = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { reference } });
    if (!t || t.type !== "WITHDRAWAL") return null;
    const flip = await tx.transaction.updateMany({ where: { id: t.id, status: "PENDING" }, data: { status: success ? "SUCCESS" : "FAILED" } });
    if (flip.count !== 1) return null;
    const w = success ? await tx.wallet.findUniqueOrThrow({ where: { id: t.walletId } }) : await tx.wallet.update({ where: { id: t.walletId }, data: { balance: { increment: t.amount } } });
    return { userId: w.userId, amount: t.amount, currency: w.currency };
  });
  if (done) await notify(done.userId, success
    ? { type: "WITHDRAWAL", title: "Withdrawal sent", body: `${fmt(done.amount, done.currency)} is on its way to your bank account.`, href: "/transactions" }
    : { type: "WITHDRAWAL", title: "Withdrawal failed", body: `Your bank transfer of ${fmt(done.amount, done.currency)} did not go through. The money is back in your wallet.`, href: "/wallet" });
}
