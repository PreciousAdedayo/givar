import { fmt } from "@/lib/money";
import type { Kpis } from "@/lib/analytics";

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (cur === prev) return <span className="text-[var(--mut)]">no change vs previous period</span>;
  if (prev === 0) return <span className="text-lime-givar">new vs previous period</span>;
  const p = ((cur - prev) / prev) * 100;
  return <span className={p >= 0 ? "text-lime-givar" : "text-red-500"}>{p >= 0 ? "▲" : "▼"} {Math.abs(p).toFixed(0)}% vs previous period</span>;
}
export default function KpiGrid({ k, p }: { k: Kpis; p: Kpis }) {
  const items: [string, string, number, number][] = [
    ["Page views", k.views.toLocaleString(), k.views, p.views], ["Unique visitors", k.visitors.toLocaleString(), k.visitors, p.visitors], ["Signups", k.signups.toLocaleString(), k.signups, p.signups],
    ["Giveaways created", k.created.toLocaleString(), k.created, p.created], ["Claims", k.claims.toLocaleString(), k.claims, p.claims], ["Contest entries", k.entries.toLocaleString(), k.entries, p.entries],
    ["Deposits (NGN)", fmt(k.depNGN), k.depNGN, p.depNGN], ["Revenue (5% fees, NGN)", fmt(k.feeNGN), k.feeNGN, p.feeNGN],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([l, v, c, pr]) => <div key={l} className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p><p className="mt-1 text-xs"><Delta cur={c} prev={pr} /></p></div>)}
      <div className="glass col-span-2 rounded-2xl p-4 lg:col-span-4"><p className="text-sm text-[var(--mut)]">USD in this period</p><p className="mt-1 text-lg font-bold">{fmt(k.depUSD, "USD")} deposited · {fmt(k.feeUSD, "USD")} fees</p></div>
    </div>
  );
}
