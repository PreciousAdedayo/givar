"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function Auth() {
  const r = useRouter();
  const [mode, setMode] = useState<"up" | "in">("up");
  const [f, setF] = useState({ name: "", identifier: "", password: "" });
  const [code, setCode] = useState(""); const [need2fa, setNeed2fa] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [ref, setRef] = useState("");
  useEffect(() => { const p = new URLSearchParams(location.search); const c = p.get("ref"); if (c) { setRef(c.toUpperCase()); setMode("up"); } }, []);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    if (mode === "up") {
      const res = await fetch("/api/register", { method: "POST", body: JSON.stringify({ ...f, ref: ref || undefined }) });
      if (!res.ok) { setErr((await res.json()).error); setBusy(false); return; }
    } else if (!need2fa) {
      const res = await fetch("/api/account/login-check", { method: "POST", body: JSON.stringify({ identifier: f.identifier, password: f.password }) });
      const j = await res.json();
      if (!res.ok) { setErr(j.error); setBusy(false); return; }
      if (j.needs2fa) { setNeed2fa(true); setBusy(false); return; }
    }
    const res = await signIn("credentials", { identifier: f.identifier, password: f.password, code: code || undefined, redirect: false });
    setBusy(false);
    if (res?.error) return setErr(need2fa ? "That code didn't work. Try the next one, or use a backup code." : "Wrong email, phone or password.");
    r.push("/"); r.refresh();
  }
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section className="grad-brand relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
        <span className="relative flex items-center gap-2 text-2xl font-bold"><svg width="34" height="34" viewBox="0 0 32 32" fill="none" stroke="#11160a" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>Givar</span>
        <div className="relative"><p className="text-6xl font-bold leading-[1.02] tracking-tight">Give.<br />Claim.<br />Win.</p>
          <ul className="mt-8 space-y-3 text-lg font-medium"><li>Your own naira and dollar account numbers</li><li>Giveaways by link or code, paid out instantly</li><li>Prize contests with automatic draws</li></ul></div>
        <p className="relative text-sm font-medium">Money is held in escrow until it is claimed.</p>
      </section>
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 lg:max-w-lg lg:px-10">
        <form onSubmit={submit} className="glass w-full space-y-4 rounded-2xl p-5 sm:p-6">
          <h1 className="text-2xl font-bold">{need2fa ? "Two-step check" : mode === "up" ? "Create your Givar account" : "Welcome back"}</h1>
          {mode === "up" && ref && <p className="grad-soft rounded-xl p-3 text-sm">You were invited with code <b>{ref}</b>. Your friend earns a bonus when you make your first deposit.</p>}
          {need2fa ? (
            <>
              <p className="text-sm text-[var(--mut)]">Enter the 6-digit code from your authenticator app, or one of your backup codes.</p>
              <input className={`${input} text-center text-xl tracking-[0.3em]`} inputMode="text" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
            </>
          ) : (
            <>
              {mode === "up" && <input className={input} placeholder="Full name" value={f.name} onChange={set("name")} required />}
              <input className={input} placeholder="Email or phone number" value={f.identifier} onChange={set("identifier")} required autoComplete="username" />
              <input className={input} type="password" placeholder="Password (8+ characters)" value={f.password} onChange={set("password")} required minLength={8} autoComplete={mode === "up" ? "new-password" : "current-password"} />
              {mode === "in" && <Link href="/auth/forgot" className="block text-center text-sm text-[var(--mut)] underline">Forgot password?</Link>}
            </>
          )}
          {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
          <button disabled={busy} className="bg-lime-givar w-full rounded-full py-3 font-semibold disabled:opacity-60">{busy ? "Please wait…" : need2fa ? "Verify and sign in" : mode === "up" ? "Create account" : "Sign in"}</button>
          {need2fa ? <button type="button" onClick={() => { setNeed2fa(false); setCode(""); setErr(""); }} className="w-full text-sm text-[var(--mut)]">← Back</button> : (
            <>
              <button type="button" onClick={() => signIn("google", { callbackUrl: "/" })} className="glass w-full rounded-full py-3 font-semibold">Continue with Google</button>
              <button type="button" onClick={() => setMode(mode === "up" ? "in" : "up")} className="w-full text-sm text-[var(--mut)]">{mode === "up" ? "Have an account? Sign in" : "New here? Create an account"}</button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
