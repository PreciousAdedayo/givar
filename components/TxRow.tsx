import Link from "next/link";
import type { TxStatus, TxType } from "@prisma/client";
import { fmt } from "@/lib/money";
import { txMeta } from "@/lib/tx";

export type TxItem = { id: string; type: TxType; status: TxStatus; amount: number; createdAt: Date; wallet: { currency: "NGN" | "USD" } };
export default function TxRow({ t }: { t: TxItem }) {
  const m = txMeta[t.type], Icon = m.icon, ok = t.status === "SUCCESS";
  return (
    <li><Link href={`/transactions/${t.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-[var(--line)]/40" aria-label={`${m.label}, open details`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${m.credit ? "grad-brand" : "bg-[var(--line)]"}`}><Icon size={18} aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{m.label}</p>
        <p className="text-xs text-[var(--mut)]">
          {t.createdAt.toLocaleString("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          {!ok && <span className={`ml-2 rounded-full px-2 py-0.5 ${t.status === "PENDING" ? "bg-[var(--line)] text-[var(--mut)]" : "bg-red-500/15 text-red-500"}`}>{t.status === "PENDING" ? "Pending" : "Failed"}</span>}
        </p>
      </div>
      <p className={`font-semibold ${m.credit && ok ? "text-lime-givar" : ""} ${t.status === "FAILED" ? "line-through opacity-60" : ""}`}>{m.credit ? "+" : "−"}{fmt(t.amount, t.wallet.currency)}</p>
    </Link></li>
  );
}
