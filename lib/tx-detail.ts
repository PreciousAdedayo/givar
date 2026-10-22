import type { Transaction, Wallet } from "@prisma/client";
import { txMeta } from "./tx";
import { maskAcct } from "./withdraw-usd";
import { plainMoney, type ReceiptData } from "./receipt";

type Meta = { bankCode?: string; bankName?: string; accountName?: string; accountNumber?: string; method?: string; coin?: string; network?: string; swift?: string; country?: string };
/** Friendly detail rows for a transaction (used on the detail page and in the PDF). Account numbers are always masked. */
export function detailRows(t: Transaction): [string, string][] {
  const m = (t.meta ?? {}) as Meta, rows: [string, string][] = [["Type", txMeta[t.type].label]];
  if (t.type === "WITHDRAWAL") { if (m.method) rows.push(["Method", m.method === "ACH" ? "US bank (ACH)" : m.method === "WIRE" ? "International wire" : "Domiciliary account"]); if (m.bankName) rows.push(["Bank", m.bankName]); if (m.accountName) rows.push(["Account name", m.accountName]); if (m.accountNumber) rows.push(["Account number", maskAcct(m.accountNumber)]); if (m.country) rows.push(["Country", m.country.toUpperCase()]); }
  if (t.type === "DEPOSIT") rows.push(["Method", m.method === "crypto" ? `Crypto (${m.coin} on ${m.network})` : t.reference.startsWith("flw_") || t.reference.startsWith("stw_") ? "Bank transfer to your Givar account" : "Card, transfer or USSD"]);
  return rows;
}
export function receiptData(t: Transaction & { wallet: Wallet }, customer: string): ReceiptData {
  const m = txMeta[t.type];
  return { reference: t.reference, label: m.label, status: t.status === "SUCCESS" ? "Successful" : t.status === "PENDING" ? "Pending" : "Failed", amount: t.amount, currency: t.wallet.currency, credit: m.credit, at: t.createdAt, rows: detailRows(t).filter(([k]) => k !== "Type"), customer };
}
export { plainMoney };
