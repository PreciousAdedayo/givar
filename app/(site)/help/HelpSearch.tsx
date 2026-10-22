"use client";
import { useState } from "react";
import { Search } from "lucide-react";
type Item = { q: string; a: string; cat: string };
export default function HelpSearch({ items }: { items: Item[] }) {
  const [q, setQ] = useState(""); const s = q.trim().toLowerCase();
  const shown = items.filter((i) => !s || i.q.toLowerCase().includes(s) || i.a.toLowerCase().includes(s));
  const cats = Array.from(new Set(shown.map((i) => i.cat)));
  return (
    <div className="space-y-4">
      <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3"><Search size={18} className="text-[var(--mut)]" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help, e.g. withdraw, KYC, refund" aria-label="Search help" className="w-full bg-transparent outline-none" /></label>
      {shown.length === 0 && <p className="glass rounded-2xl p-6 text-center text-sm text-[var(--mut)]">Nothing matches. Chat with us and we will help.</p>}
      {cats.map((c) => <section key={c} aria-label={c}><h2 className="mb-1 text-sm font-semibold text-[var(--mut)]">{c}</h2><div className="glass divide-y divide-[var(--line)] rounded-2xl px-4">{shown.filter((i) => i.cat === c).map((i) => <details key={i.q} className="py-3"><summary className="cursor-pointer font-medium">{i.q}</summary><p className="mt-2 text-sm text-[var(--mut)]">{i.a}</p></details>)}</div></section>)}
    </div>
  );
}
