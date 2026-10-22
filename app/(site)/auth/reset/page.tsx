"use client";
import { useState } from "react";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function Reset() {
  const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [ok, setOk] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); const token = new URLSearchParams(location.search).get("token") ?? "";
    const r = await fetch("/api/account/reset", { method: "POST", body: JSON.stringify({ token, password: pw }) }); const j = await r.json();
    if (r.ok) setOk(true); else setMsg(j.error);
  }
  if (ok) return <main className="page max-w-md"><div className="glass rounded-2xl p-5 sm:p-6"><h1 className="text-2xl font-bold">Password updated</h1><a href="/auth" className="mt-3 inline-block underline">Sign in</a></div></main>;
  return <main className="page max-w-md"><form onSubmit={go} className="glass space-y-4 rounded-2xl p-5 sm:p-6"><h1 className="text-2xl font-bold">Choose a new password</h1>
    <input className={input} type="password" minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} required />{msg && <p role="alert" className="text-sm text-red-400">{msg}</p>}
    <button className="w-full rounded-full bg-lime-givar py-3 font-semibold text-black">Update password</button></form></main>;
}
