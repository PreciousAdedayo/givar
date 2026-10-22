"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CodeList from "@/components/CodeList";

const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export type CreateInitial = Partial<{ title: string; description: string; currency: string; amount: string; winners: string; distribution: string; claimType: string; expiresInHours: string; question: string; mode: string }>;
type Done = { claimCode: string; claimLink: string; mode: string; codes?: { code: string; amount: number; link: string }[] };
const Seg = ({ value, set, items }: { value: string; set: (v: string) => void; items: [string, string, string?][] }) => (
  <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">{items.map(([k, l, d]) => <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => set(k)} className={`rounded-xl border p-3 text-left ${value === k ? "border-lime-givar grad-soft" : "border-[var(--line)]"}`}><span className="block font-semibold">{l}</span>{d && <span className="mt-0.5 block text-xs text-[var(--mut)]">{d}</span>}</button>)}</div>
);

export default function CreateForm({ initial, renewing }: { initial?: CreateInitial; renewing?: string }) {
  const r = useRouter();
  const [f, setF] = useState({ title: "", description: "", currency: "NGN", amount: "", winners: "5", distribution: "EQUAL", expiresInHours: "24", question: "", ...initial });
  const [audience, setAudience] = useState(initial?.winners && initial.winners !== "1" ? "many" : initial?.winners === "1" ? "one" : "many");
  const [mode, setMode] = useState(initial?.mode === "PERSONAL" ? "PERSONAL" : "SHARED");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState<Done | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const n = audience === "one" ? 1 : Math.max(2, +f.winners || 2), amt = +f.amount || 0, fee = Math.round(amt * 5) / 100, sym = f.currency === "NGN" ? "₦" : "$";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/giveaways", { method: "POST", body: JSON.stringify({ title: f.title, description: f.description || undefined, currency: f.currency, amount: amt, winners: n, distribution: audience === "one" ? "EQUAL" : f.distribution, claimType: mode === "PERSONAL" ? "CODE" : "LINK", expiresInHours: +f.expiresInHours, question: f.question || undefined, mode }) });
    const j = await res.json(); setBusy(false);
    if (res.status === 401) return r.push("/auth");
    if (!res.ok) return setErr(j.error);
    setDone(j);
  }
  if (done) {
    const msg = encodeURIComponent(`Claim my giveaway on Givar: ${done.claimLink} (code ${done.claimCode})`);
    return (
      <main className="page max-w-md space-y-4">
        <div className="glass space-y-3 rounded-2xl p-5 sm:p-6"><h1 className="text-2xl font-bold">Giveaway is live</h1>
          {done.codes ? <p className="text-sm text-[var(--mut)]">{done.codes.length === 1 ? "Here is the one-time code for your person." : `Here are ${done.codes.length} one-time codes. Give each one to a different person.`} Each code works once, and you can always find them under My giveaways.</p> : <>
            <p className="font-mono text-2xl tracking-widest">{done.claimCode}</p><p className="break-all text-sm text-[var(--mut)]">{done.claimLink}</p>
            <div className="flex flex-wrap gap-2"><a className="bg-lime-givar rounded-full px-4 py-2 font-semibold" href={`https://wa.me/?text=${msg}`}>WhatsApp</a><a className="glass rounded-full px-4 py-2" href={`https://twitter.com/intent/tweet?text=${msg}`}>X</a><a className="glass rounded-full px-4 py-2" href={`https://t.me/share/url?url=${encodeURIComponent(done.claimLink)}&text=${msg}`}>Telegram</a><button className="glass rounded-full px-4 py-2" onClick={() => navigator.clipboard.writeText(done.claimLink)}>Copy link</button></div></>}
        </div>
        {done.codes && <CodeList title={f.title} codes={done.codes.map((c) => ({ code: c.code, amount: `${sym}${(c.amount / 100).toLocaleString()}`, link: c.link, used: null }))} />}
      </main>
    );
  }
  return (
    <main className="page max-w-lg lg:grid lg:max-w-6xl lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8">
      <h1 className="mb-4 hidden text-3xl font-bold lg:col-span-2 lg:block">{renewing ? "Renew giveaway" : "Create a giveaway"}</h1>
      <form onSubmit={submit} className="glass space-y-5 rounded-2xl p-5 sm:p-6">
        <h1 className="text-2xl font-bold lg:hidden">{renewing ? "Renew giveaway" : "Create a giveaway"}</h1>
        {renewing && <p className="grad-soft rounded-xl p-3 text-sm">Renewing &ldquo;{renewing}&rdquo;. Change anything, then publish. A new giveaway is created and funded from your wallet.</p>}
        <div className="space-y-3"><input className={input} placeholder="Title" value={f.title} onChange={set("title")} required minLength={3} /><textarea className={input} rows={2} placeholder="Description (optional)" value={f.description} onChange={set("description")} /></div>
        <div className="grid grid-cols-[96px_1fr] gap-3"><select className={input} value={f.currency} onChange={set("currency")} aria-label="Currency"><option>NGN</option><option>USD</option></select><input className={input} type="number" min="1" step="any" placeholder="Total amount" value={f.amount} onChange={set("amount")} required /></div>
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">Who is it for?</legend>
          <Seg value={audience} set={setAudience} items={[["one", "One person", "A single winner gets the whole amount"], ["many", "Multiple people", "Split between several winners"]]} />
          {audience === "many" && <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm text-[var(--mut)]">How many winners?<input className={`${input} mt-1 text-[var(--fg)]`} type="number" min="2" max="1000" value={f.winners} onChange={set("winners")} required /></label><label className="block text-sm text-[var(--mut)]">Split<select className={`${input} mt-1 text-[var(--fg)]`} value={f.distribution} onChange={set("distribution")}><option value="EQUAL">Equal shares</option><option value="RANDOM">Random amounts</option></select></label></div>}
        </fieldset>
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">How do they claim?</legend>
          <Seg value={mode} set={setMode} items={[["SHARED", "One shared link or code", "Anyone with it can claim. First come, first served."], ["PERSONAL", n === 1 ? "A personal one-time code" : "A unique code for each person", n === 1 ? "One random code, works once." : `${n} random codes. Each works once, for one person.`]]} />
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm text-[var(--mut)]">Expires<select className={`${input} mt-1 text-[var(--fg)]`} value={f.expiresInHours} onChange={set("expiresInHours")}><option value="1">In 1 hour</option><option value="24">In 1 day</option><option value="168">In 7 days</option><option value="720">In 30 days</option></select></label><label className="block text-sm text-[var(--mut)]">Question (optional)<input className={`${input} mt-1 text-[var(--fg)]`} placeholder="e.g. Favourite food?" value={f.question} onChange={set("question")} /></label></div>
        <p className="text-sm text-[var(--mut)]">A 5% Givar fee is added. The giveaway amount is held safely until people claim. Unclaimed money returns to you.</p>
        {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
        <button disabled={busy} className="bg-lime-givar w-full rounded-full py-3 font-semibold disabled:opacity-60">{busy ? "Creating…" : "Create giveaway"}</button>
      </form>
      <aside className="mt-5 space-y-4 lg:sticky lg:top-6 lg:mt-0" aria-label="Preview and cost">
        <div className="grad-brand shadow-glow rounded-2xl p-6"><p className="text-sm font-medium">{f.title || "Your giveaway title"}</p><p className="mt-1 text-4xl font-bold">{sym}{amt.toLocaleString()}</p><p className="mt-1 text-sm">{audience === "one" ? "For one person" : `${n} winners · about ${sym}${Math.floor(amt / n).toLocaleString()} each`}</p><p className="mt-1 text-xs">{mode === "PERSONAL" ? `${n} one-time code${n === 1 ? "" : "s"} will be created` : "One shared link and code"}</p></div>
        <dl className="glass space-y-2 rounded-2xl p-5 text-sm"><div className="flex justify-between"><dt className="text-[var(--mut)]">Giveaway amount</dt><dd>{sym}{amt.toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-[var(--mut)]">Givar fee (5%)</dt><dd>{sym}{fee.toLocaleString()}</dd></div><div className="flex justify-between border-t border-[var(--line)] pt-2 font-semibold"><dt>Total from wallet</dt><dd className="text-lime-givar">{sym}{(amt + fee).toLocaleString()}</dd></div></dl>
      </aside>
    </main>
  );
}
