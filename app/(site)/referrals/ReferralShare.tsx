"use client";
import { useState } from "react";
export default function ReferralShare({ code, link }: { code: string; link: string }) {
  const [done, setDone] = useState(false);
  const msg = encodeURIComponent(`Join me on Givar: create and claim cash giveaways, with your own naira and dollar account numbers. ${link}`);
  async function copy() { try { await navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 1500); } catch {} }
  return (
    <section className="glass space-y-3 rounded-2xl p-5" aria-label="Your referral link">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--line)] px-4 py-3"><div className="min-w-0"><p className="text-xs text-[var(--mut)]">Your code</p><p className="font-mono text-xl tracking-widest">{code}</p></div><button onClick={copy} className="shrink-0 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">{done ? "Copied" : "Copy link"}</button></div>
      <p className="break-all text-xs text-[var(--mut)]">{link}</p>
      <div className="flex flex-wrap gap-2"><a className="bg-lime-givar rounded-full px-4 py-2 text-sm font-semibold" href={`https://wa.me/?text=${msg}`}>WhatsApp</a><a className="glass rounded-full px-4 py-2 text-sm font-semibold" href={`https://twitter.com/intent/tweet?text=${msg}`}>X</a><a className="glass rounded-full px-4 py-2 text-sm font-semibold" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${msg}`}>Telegram</a></div>
    </section>
  );
}
