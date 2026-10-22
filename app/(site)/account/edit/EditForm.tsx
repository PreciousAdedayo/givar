"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function EditForm(p: { name: string; country: string; contact: string }) {
  const r = useRouter(); const [name, setName] = useState(p.name); const [country, setCountry] = useState(p.country || "NG"); const [err, setErr] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/account/profile", { method: "PATCH", body: JSON.stringify({ name, country }) });
    if (!res.ok) return setErr((await res.json()).error);
    r.push("/account"); r.refresh();
  }
  return (
    <main className="page max-w-md"><form onSubmit={save} className="glass space-y-4 rounded-2xl p-6">
      <h1 className="text-2xl font-bold">Personal information</h1>
      <label className="block text-sm text-[var(--mut)]">Full name<input className={`${input} mt-1 text-[var(--fg)]`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} /></label>
      <label className="block text-sm text-[var(--mut)]">Country<select className={`${input} mt-1 text-[var(--fg)]`} value={country} onChange={(e) => setCountry(e.target.value)}><option value="NG">Nigeria</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="OTHER">Other</option></select></label>
      <label className="block text-sm text-[var(--mut)]">Sign-in details<input className={`${input} mt-1 opacity-60`} value={p.contact} disabled /></label>
      {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
      <button className="bg-lime-givar w-full rounded-full py-3 font-semibold">Save changes</button>
    </form></main>
  );
}
