"use client";
import { useState } from "react";
type C = { code: string; amount: string; link: string; used: string | null };
/** The host's list of one-time codes: copy, share, or download them all. */
export default function CodeList({ codes, title }: { codes: C[]; title: string }) {
  const [copied, setCopied] = useState("");
  const copy = async (text: string, key: string) => { try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch {} };
  const download = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`${title}\nEach code can be used once.\n\n${codes.map((c) => `${c.code}  ${c.amount}  ${c.link}${c.used ? `  (${c.used})` : ""}`).join("\n")}\n`], { type: "text/plain" })); a.download = "givar-codes.txt"; a.click(); };
  return (
    <section className="glass space-y-3 rounded-2xl p-4 sm:p-5" aria-label="One-time codes">
      <div className="flex flex-wrap gap-2"><button onClick={() => copy(codes.filter((c) => !c.used).map((c) => c.code).join("\n"), "all")} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">{copied === "all" ? "Copied" : "Copy all unused codes"}</button><button onClick={download} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">Download list</button></div>
      <ul className="divide-y divide-[var(--line)]">
        {codes.map((c, i) => { const msg = encodeURIComponent(`Here is your one-time Givar code for "${title}": ${c.code}\nClaim it here: ${c.link}`); return (
          <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="min-w-0"><span className={`block font-mono text-lg tracking-wider ${c.used ? "text-[var(--mut)] line-through" : ""}`}>{c.code}</span><span className="block text-xs text-[var(--mut)]">{i + 1}. {c.amount}{c.used ? ` · ${c.used}` : " · not used yet"}</span></span>
            {!c.used && <span className="flex gap-2"><button onClick={() => copy(c.code, c.code)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold">{copied === c.code ? "Copied" : "Copy"}</button><a href={`https://wa.me/?text=${msg}`} className="bg-lime-givar rounded-full px-3 py-1.5 text-xs font-semibold">WhatsApp</a></span>}</li>); })}
      </ul>
    </section>
  );
}
