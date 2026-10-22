/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";

export default function TwoFactorCard({ enabled, hasPassword, backupLeft }: { enabled: boolean; hasPassword: boolean; backupLeft: number }) {
  const r = useRouter(); const [step, setStep] = useState<"idle" | "scan" | "codes" | "off">("idle"); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null); const [code, setCode] = useState(""); const [pw, setPw] = useState(""); const [codes, setCodes] = useState<string[]>([]);
  async function call(url: string, body?: object) { setBusy(true); setErr(""); const res = await fetch(url, { method: "POST", body: JSON.stringify(body ?? {}) }); const j = await res.json().catch(() => ({})); setBusy(false); if (!res.ok) { setErr(j.error ?? "Something went wrong."); return null; } return j; }
  async function start() { const j = await call("/api/security/2fa/setup"); if (j) { setSetup(j); setStep("scan"); } }
  async function enable(e: React.FormEvent) { e.preventDefault(); const j = await call("/api/security/2fa/enable", { code }); if (j) { setCodes(j.backupCodes); setStep("codes"); } }
  async function disable(e: React.FormEvent) { e.preventDefault(); const j = await call("/api/security/2fa/disable", { code, password: pw || undefined }); if (j) { setStep("idle"); setCode(""); setPw(""); r.refresh(); } }
  const download = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`Givar backup codes\nEach code works once.\n\n${codes.join("\n")}\n`], { type: "text/plain" })); a.download = "givar-backup-codes.txt"; a.click(); };
  return (
    <section className="glass space-y-3 rounded-2xl p-5 sm:p-6" aria-labelledby="tfa">
      <div className="flex items-start justify-between gap-3"><div><h2 id="tfa" className="font-semibold">Two-factor authentication</h2><p className="text-sm text-[var(--mut)]">A code from an authenticator app, on top of your password. Stops anyone who steals your password.</p></div><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${enabled ? "grad-soft" : "bg-[var(--line)] text-[var(--mut)]"}`}>{enabled ? "On" : "Off"}</span></div>
      {step === "idle" && !enabled && <button onClick={start} disabled={busy} className="bg-lime-givar rounded-full px-5 py-2.5 font-semibold">Turn on</button>}
      {step === "idle" && enabled && <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-[var(--mut)]">{backupLeft} backup code{backupLeft === 1 ? "" : "s"} left</span><button onClick={() => setStep("off")} className="rounded-full border border-red-500/50 px-5 py-2 text-sm font-semibold text-red-500">Turn off</button></div>}
      {step === "scan" && setup && (
        <form onSubmit={enable} className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--mut)]"><li>Open an authenticator app (Google Authenticator, Authy, Microsoft Authenticator).</li><li>Scan this picture, or type the key by hand.</li><li>Enter the 6-digit code it shows.</li></ol>
          <div className="flex flex-wrap items-center gap-4"><img src={setup.qr} alt="QR code for your authenticator app" width={160} height={160} className="rounded-xl bg-white p-2" /><div className="min-w-0 text-sm"><p className="text-[var(--mut)]">Setup key</p><p className="break-all font-mono text-base tracking-wider">{setup.secret}</p></div></div>
          <input className={input} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required autoComplete="one-time-code" />
          {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
          <div className="flex gap-2"><button disabled={busy} className="bg-lime-givar rounded-full px-5 py-2.5 font-semibold">Verify and turn on</button><button type="button" onClick={() => { setStep("idle"); setErr(""); }} className="rounded-full border border-[var(--line)] px-5 py-2.5 font-semibold">Cancel</button></div>
        </form>)}
      {step === "codes" && (
        <div className="space-y-3"><p className="grad-soft rounded-xl p-3 text-sm font-semibold">Two-factor authentication is on. Save your backup codes now: they are shown only once.</p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm">{codes.map((c) => <li key={c} className="rounded-lg bg-[var(--line)] px-3 py-2 text-center">{c}</li>)}</ul>
          <p className="text-sm text-[var(--mut)]">If you lose your phone, each code lets you in once.</p>
          <div className="flex gap-2"><button onClick={download} className="rounded-full border border-[var(--line)] px-5 py-2.5 font-semibold">Download codes</button><button onClick={() => { setStep("idle"); r.refresh(); }} className="bg-lime-givar rounded-full px-5 py-2.5 font-semibold">I&apos;ve saved them</button></div></div>)}
      {step === "off" && (
        <form onSubmit={disable} className="space-y-3"><input className={input} placeholder="Code from your app (or a backup code)" value={code} onChange={(e) => setCode(e.target.value)} required />
          {hasPassword && <input className={input} type="password" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />}
          {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
          <div className="flex gap-2"><button disabled={busy} className="rounded-full border border-red-500/50 px-5 py-2.5 font-semibold text-red-500">Turn off</button><button type="button" onClick={() => { setStep("idle"); setErr(""); }} className="rounded-full border border-[var(--line)] px-5 py-2.5 font-semibold">Keep it on</button></div></form>)}
      {err && step === "idle" && <p role="alert" className="text-sm text-red-500">{err}</p>}
    </section>
  );
}
