import Link from "next/link";
import { fmt } from "@/lib/money";
import { txMeta } from "@/lib/tx";
import type { TxItem } from "./TxRow";
/** Desktop transaction table. Phones use the TxRow list instead. */
export default function TxTable({ txs, linked = true }: { txs: TxItem[]; linked?: boolean }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-[var(--mut)]"><tr><th className="pb-2 font-medium">Transaction</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Status</th><th className="pb-2 text-right font-medium">Amount</th></tr></thead>
      <tbody>
        {txs.map((t) => { const m = txMeta[t.type], Icon = m.icon, ok = t.status === "SUCCESS"; return (
          <tr key={t.id} className={`relative border-t border-[var(--line)] ${linked ? "hover:bg-[var(--line)]/40" : ""}`}>
            <td className="py-3"><span className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full ${m.credit ? "grad-brand" : "bg-[var(--line)]"}`}><Icon size={16} aria-hidden /></span>{linked ? <Link href={`/transactions/${t.id}`} className="font-medium before:absolute before:inset-0">{m.label}</Link> : <span className="font-medium">{m.label}</span>}</span></td>
            <td className="py-3 text-[var(--mut)]">{t.createdAt.toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
            <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? "grad-soft" : t.status === "PENDING" ? "bg-[var(--line)] text-[var(--mut)]" : "bg-red-500/15 text-red-500"}`}>{ok ? "Successful" : t.status === "PENDING" ? "Pending" : "Failed"}</span></td>
            <td className={`py-3 text-right font-semibold ${m.credit && ok ? "text-lime-givar" : ""}`}>{m.credit ? "+" : "−"}{fmt(t.amount, t.wallet.currency)}</td>
          </tr>); })}
      </tbody>
    </table>
  );
}
