"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export type ContestInitial = Partial<{ prize: string; image: string; entryFee: string; maxEntries: string; partner: string }>;
export default function ContestForm({ initial, renewing }: { initial?: ContestInitial; renewing?: string }) {
  const r = useRouter(); const [err, setErr] = useState("");
  const [f, setF] = useState({ prize: "", image: "", entryFee: "0", maxEntries: "100", endsAt: "", partner: "", ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/contests", { method: "POST", body: JSON.stringify({ prize: f.prize, image: f.image || undefined, partner: f.partner || undefined, entryFee: +f.entryFee, maxEntries: +f.maxEntries, endsAt: new Date(f.endsAt).toISOString() }) });
    if (res.status === 401) return r.push("/auth"); const j = await res.json(); if (!res.ok) return setErr(j.error); r.push("/contests");
  }
  return (
    <main className="page max-w-lg"><form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5 sm:p-6">
      <h1 className="text-2xl font-bold">{renewing ? "Run this contest again" : "Host a contest"}</h1>{renewing && <p className="grad-soft rounded-xl p-3 text-sm">Running &ldquo;{renewing}&rdquo; again. Pick a new draw date and publish.</p>}
      <input className={input} placeholder="Prize (e.g. Dinner for 2 at Eko Hotel)" value={f.prize} onChange={set("prize")} required />
      <input className={input} type="url" placeholder="Image URL (optional)" value={f.image} onChange={set("image")} />
      <input className={input} placeholder="Restaurant partner (optional)" value={f.partner} onChange={set("partner")} />
      <div className="grid grid-cols-2 gap-3"><input className={input} type="number" min="0" placeholder="Entry fee (0 = free)" value={f.entryFee} onChange={set("entryFee")} /><input className={input} type="number" min="2" placeholder="Max entries" value={f.maxEntries} onChange={set("maxEntries")} /></div>
      <label className="block text-sm text-[var(--mut)]">Draw date<input className={`${input} mt-1`} type="datetime-local" value={f.endsAt} onChange={set("endsAt")} required /></label>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <button className="w-full rounded-full bg-lime-givar py-3 font-semibold text-black">Publish contest</button>
    </form></main>
  );
}
