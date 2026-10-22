/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COINS } from "@/lib/crypto";
import { searchBanks, type Bank } from "@/lib/banks";

const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
const Seg = ({ items, value, set }: { items: [string, string][]; value: string; set: (v: string) => void }) => (
  <div className="flex gap-2 overflow-x-auto" role="tablist">{items.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} type="button" onClick={() => set(k)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${value === k ? "bg-lime-givar" : "glass"}`}>{l}</button>)}</div>
);
const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-sm text-[var(--mut)]">{t}<div className="mt-1 text-[var(--fg)]">{children}</div></label>;
type Dep = { id: string; coin: string; network: string; usd: number; status: string };

export default function WalletActions() {
  const r = useRouter();
  const [tab, setTab] = useState("add"), [add, setAdd] = useState("naira"), [wd, setWd] = useState("ngn");
  const [msg, setMsg] = useState<{ t: string; ok?: boolean; link?: [string, string] } | null>(null); const [busy, setBusy] = useState(false);
  const [amt, setAmt] = useState("");
  // crypto
  const [coin, setCoin] = useState("USDT-TRC20"), [usd, setUsd] = useState("50"), [dep, setDep] = useState<{ id: string; address: string; coin: string; network: string; usd: number; payAmount: number | null; qr: string; dev: boolean } | null>(null), [recent, setRecent] = useState<Dep[]>([]), [copied, setCopied] = useState(false);
  // withdraw NGN
  const [banks, setBanks] = useState<Bank[]>([]), [bq, setBq] = useState(""), [w, setW] = useState({ amount: "", bankCode: "", accountNumber: "", pin: "" }), [holder, setHolder] = useState("");
  // withdraw USD
  const [m, setM] = useState<"ACH" | "WIRE" | "NG_DOM">("ACH"), [u, setU] = useState<Record<string, string>>({ accountType: "checking" }), [uAmt, setUAmt] = useState(""), [uPin, setUPin] = useState("");

  useEffect(() => { fetch("/api/banks").then((x) => x.json()).then(setBanks).catch(() => {}); }, []);
  useEffect(() => { if (add === "crypto") fetch("/api/wallet/crypto").then((x) => (x.ok ? x.json() : [])).then(setRecent).catch(() => {}); }, [add, dep]);
  useEffect(() => {
    setHolder(""); if (!w.bankCode || !/^\d{10}$/.test(w.accountNumber)) return;
    fetch("/api/banks/resolve", { method: "POST", body: JSON.stringify({ bankCode: w.bankCode, accountNumber: w.accountNumber }) }).then(async (x) => { const j = await x.json(); setHolder(x.ok ? j.name : ""); if (!x.ok) setMsg({ t: j.error }); });
  }, [w.bankCode, w.accountNumber]);

  async function post(url: string, body: object) {
    setBusy(true); setMsg(null);
    const res = await fetch(url, { method: "POST", body: JSON.stringify(body) }); const j = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) { setMsg({ t: j.error ?? "Something went wrong.", link: j.needsPin ? ["/account/security", "Set your PIN"] : j.needsKyc ? ["/kyc", "Verify your identity"] : undefined }); return null; }
    return j;
  }
  async function addNaira(e: React.FormEvent) { e.preventDefault(); const j = await post("/api/wallet/deposit", { amount: +amt }); if (!j) return; if (j.url) location.href = j.url; else { setMsg({ t: "Money added.", ok: true }); r.refresh(); } }
  async function getAddress(e: React.FormEvent) { e.preventDefault(); const j = await post("/api/wallet/crypto", { coinId: coin, amount: +usd }); if (j) setDep(j); }
  async function simulate() { if (!dep) return; const j = await post("/api/wallet/crypto/simulate", { id: dep.id }); if (j) { setMsg({ t: "Simulated payment received. Your dollar wallet was credited.", ok: true }); setDep(null); r.refresh(); } }
  async function withdrawNgn(e: React.FormEvent) { e.preventDefault(); const j = await post("/api/wallet/withdraw", { currency: "NGN", amount: +w.amount, bankCode: w.bankCode, accountNumber: w.accountNumber, pin: w.pin }); if (j) { setMsg({ t: "Withdrawal started.", ok: true }); setW({ ...w, amount: "", pin: "" }); r.refresh(); } }
  async function withdrawUsd(e: React.FormEvent) { e.preventDefault(); const j = await post("/api/wallet/withdraw", { currency: "USD", amount: +uAmt, pin: uPin, details: { method: m, ...u } }); if (j) { setMsg({ t: "Request received. Our team sends USD withdrawals within 1 to 2 business days.", ok: true }); setUAmt(""); setUPin(""); r.refresh(); } }
  const su = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setU({ ...u, [k]: e.target.value });
  const coinInfo = COINS.find((c) => c.id === coin)!;
  const filtered = searchBanks(banks, bq);

  return (
    <section className="glass space-y-4 rounded-2xl p-5 sm:p-6" aria-label="Add money or withdraw">
      <Seg items={[["add", "Add money"], ["withdraw", "Withdraw"]]} value={tab} set={(v) => { setTab(v); setMsg(null); }} />
      {tab === "add" && (
        <div id="add" className="scroll-mt-20 space-y-4">
          <Seg items={[["naira", "Naira (card, transfer, USSD)"], ["crypto", "Crypto (USD)"]]} value={add} set={(v) => { setAdd(v); setMsg(null); setDep(null); }} />
          {add === "naira" ? (
            <form onSubmit={addNaira} className="space-y-3"><L t="Amount in ₦"><input className={input} type="number" min="100" value={amt} onChange={(e) => setAmt(e.target.value)} required /></L><p className="text-xs text-[var(--mut)]">Pay by card, bank transfer or USSD. Or send money to your Givar account number.</p><button disabled={busy} className="bg-lime-givar w-full rounded-full py-3 font-semibold">Add money</button></form>
          ) : !dep ? (
            <form onSubmit={getAddress} className="space-y-3">
              <L t="Coin and network"><select className={input} value={coin} onChange={(e) => setCoin(e.target.value)}>{COINS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></L>
              <p className="text-xs text-[var(--mut)]">{coinInfo.note}. Credited to your dollar wallet at the USD value when the payment is confirmed.</p>
              <L t="Amount in US dollars (min $10)"><input className={input} type="number" min="10" max="5000" value={usd} onChange={(e) => setUsd(e.target.value)} required /></L>
              <button disabled={busy} className="bg-lime-givar w-full rounded-full py-3 font-semibold">Get deposit address</button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4"><img src={dep.qr} alt={`QR code for the ${dep.coin} deposit address`} width={150} height={150} className="rounded-xl bg-white p-2" />
                <div className="min-w-0 flex-1 space-y-1 text-sm"><p className="text-[var(--mut)]">Send exactly {dep.payAmount ? `${dep.payAmount} ${dep.coin}` : `about $${dep.usd} of ${dep.coin}`} on <b className="text-[var(--fg)]">{dep.network}</b> to:</p><p className="break-all font-mono text-sm">{dep.address}</p>
                  <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(dep.address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} className="rounded-full border border-[var(--line)] px-4 py-1.5 text-xs font-semibold">{copied ? "Copied" : "Copy address"}</button></div></div>
              <p className="rounded-xl bg-[var(--line)] p-3 text-xs">Only send <b>{dep.coin}</b> on the <b>{dep.network}</b> network to this address. Sending anything else, or the wrong network, can lose your money for good. This address is for one deposit.</p>
              <div className="flex flex-wrap gap-2">{dep.dev && <button onClick={simulate} className="rounded-full border border-lime-givar px-4 py-2 text-sm font-semibold text-lime-givar">Dev: simulate payment arriving</button>}<button onClick={() => setDep(null)} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">Start over</button></div>
            </div>)}
          {add === "crypto" && recent.length > 0 && <div><h3 className="mb-1 text-sm font-semibold">Your crypto deposits</h3><ul className="divide-y divide-[var(--line)] text-sm">{recent.map((d) => <li key={d.id} className="flex justify-between py-2"><span>{d.coin} · {d.network}</span><span className="text-[var(--mut)]">${d.usd.toFixed(2)} · {d.status.toLowerCase()}</span></li>)}</ul></div>}
        </div>)}
      {tab === "withdraw" && (
        <div id="withdraw" className="scroll-mt-20 space-y-4">
          <Seg items={[["ngn", "To a Nigerian bank (₦)"], ["usd", "In US dollars ($)"]]} value={wd} set={(v) => { setWd(v); setMsg(null); }} />
          {wd === "ngn" ? (
            <form onSubmit={withdrawNgn} className="space-y-3">
              <L t="Amount in ₦"><input className={input} type="number" min="500" value={w.amount} onChange={(e) => setW({ ...w, amount: e.target.value })} required /></L>
              <L t={`Bank (${filtered.length} of ${banks.length})`}><input className={`${input} mb-2`} placeholder="Search banks, e.g. Opay, Kuda, GTB" value={bq} onChange={(e) => setBq(e.target.value)} aria-label="Search banks" />
                <select className={input} value={w.bankCode} onChange={(e) => setW({ ...w, bankCode: e.target.value })} required><option value="">Choose bank</option>{filtered.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}</select></L>
              <L t="Account number"><input className={input} inputMode="numeric" maxLength={10} value={w.accountNumber} onChange={(e) => setW({ ...w, accountNumber: e.target.value.replace(/\D/g, "") })} required /></L>
              {holder && <p className="text-sm text-lime-givar">✓ {holder}</p>}
              <L t="Transaction PIN"><input className={`${input} tracking-[0.4em]`} type="password" inputMode="numeric" maxLength={4} value={w.pin} onChange={(e) => setW({ ...w, pin: e.target.value.replace(/\D/g, "") })} required autoComplete="off" /></L>
              <button disabled={busy || !holder} className="w-full rounded-full border border-lime-givar py-3 font-semibold text-lime-givar disabled:opacity-50">Withdraw</button>
            </form>
          ) : (
            <form onSubmit={withdrawUsd} className="space-y-3">
              <L t="How should we send it?"><select className={input} value={m} onChange={(e) => { setM(e.target.value as typeof m); setU({ accountType: "checking" }); }}><option value="ACH">US bank account (ACH)</option><option value="WIRE">International bank (wire / SWIFT)</option><option value="NG_DOM">Nigerian domiciliary (USD) account</option></select></L>
              <L t="Account holder name"><input className={input} value={u.accountName ?? ""} onChange={su("accountName")} required /></L>
              <L t="Bank name"><input className={input} value={u.bankName ?? ""} onChange={su("bankName")} required /></L>
              {m === "ACH" && <><L t="Routing number (9 digits)"><input className={input} inputMode="numeric" maxLength={9} value={u.routingNumber ?? ""} onChange={su("routingNumber")} required /></L><L t="Account type"><select className={input} value={u.accountType} onChange={su("accountType")}><option value="checking">Checking</option><option value="savings">Savings</option></select></L></>}
              {m === "WIRE" && <><L t="Country (2 letters, e.g. GB)"><input className={input} maxLength={2} value={u.country ?? ""} onChange={su("country")} required /></L><L t="SWIFT / BIC"><input className={input} maxLength={11} value={u.swift ?? ""} onChange={su("swift")} required /></L></>}
              <L t={m === "WIRE" ? "IBAN or account number" : m === "NG_DOM" ? "Account number (10 digits)" : "Account number"}><input className={input} value={u.accountNumber ?? ""} onChange={su("accountNumber")} required /></L>
              <L t="Amount in US dollars ($20 to $5,000)"><input className={input} type="number" min="20" max="5000" value={uAmt} onChange={(e) => setUAmt(e.target.value)} required /></L>
              <L t="Transaction PIN"><input className={`${input} tracking-[0.4em]`} type="password" inputMode="numeric" maxLength={4} value={uPin} onChange={(e) => setUPin(e.target.value.replace(/\D/g, ""))} required autoComplete="off" /></L>
              <p className="text-xs text-[var(--mut)]">USD withdrawals are checked and sent by our team within 1 to 2 business days. Double-check the details: a wrong account can delay or lose a transfer.</p>
              <button disabled={busy} className="w-full rounded-full border border-lime-givar py-3 font-semibold text-lime-givar">Request USD withdrawal</button>
            </form>)}
        </div>)}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-lime-givar" : "text-red-500"}`}>{msg.t} {msg.link && <Link href={msg.link[0]} className="font-semibold underline">{msg.link[1]}</Link>}</p>}
    </section>
  );
}
