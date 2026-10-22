/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
const MAX = 1_800_000;
const KINDS: [string, string, string][] = [["BVN", "BVN (Nigeria)", "NG"], ["NIN", "NIN (Nigeria)", "NG"], ["PASSPORT", "International passport", ""], ["NATIONAL_ID", "National ID card", ""], ["DRIVERS_LICENSE", "Driver's licence", ""]];
const L = ({ t, hint, children }: { t: string; hint?: string; children: React.ReactNode }) => <label className="block text-sm text-[var(--mut)]">{t}<div className="mt-1 text-[var(--fg)]">{children}</div>{hint && <span className="mt-1 block text-xs">{hint}</span>}</label>;
const NAMES = ["Your ID", "About you", "Photos", "Review"];

export default function KycWizard({ defaultName }: { defaultName: string }) {
  const r = useRouter(); const [step, setStep] = useState(0); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ country: "NG", kind: "BVN", idNumber: "", legalName: defaultName, dob: "", address: "", agree: false });
  const [idFront, setIdFront] = useState<File | null>(null), [selfie, setSelfie] = useState<File | null>(null);
  const urls = useMemo(() => [idFront, selfie].map((x) => (x && x.type.startsWith("image/") ? URL.createObjectURL(x) : null)), [idFront, selfie]);
  useEffect(() => () => urls.forEach((u) => u && URL.revokeObjectURL(u)), [urls]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const ng = f.kind === "BVN" || f.kind === "NIN";
  const adult = f.dob && Date.now() - new Date(f.dob).getTime() > 18 * 31557600000;
  function check(): string {
    if (step === 0) { if (ng && !/^\d{11}$/.test(f.idNumber)) return "A BVN or NIN is exactly 11 digits."; if (!ng && f.idNumber.trim().length < 5) return "Enter your ID number."; }
    if (step === 1) { if (f.legalName.trim().length < 3) return "Enter your full legal name."; if (!adult) return "You must be 18 or older. Check your date of birth."; if (f.address.trim().length < 8) return "Enter your home address."; }
    if (step === 2) { if (!idFront) return "Add a photo of your ID."; if (!selfie) return "Add a selfie holding your ID."; }
    if (step === 3 && !f.agree) return "Please confirm the details are correct.";
    return "";
  }
  const pick = (set: (x: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0] ?? null; if (file && file.size > MAX) { setErr("That file is over 1.8 MB. Try a smaller photo."); e.target.value = ""; return; } setErr(""); set(file); };
  const next = () => { const e = check(); setErr(e); if (!e) setStep(step + 1); };
  async function submit() {
    const e = check(); setErr(e); if (e) return; setBusy(true);
    const fd = new FormData(); (["country", "kind", "idNumber", "legalName", "dob", "address"] as const).forEach((k) => fd.append(k, f[k])); fd.append("idFront", idFront!); fd.append("selfie", selfie!);
    const res = await fetch("/api/kyc", { method: "POST", body: fd }); const j = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) return setErr(j.error ?? "Something went wrong. Try again.");
    r.refresh();
  }
  return (
    <section className="glass space-y-5 rounded-2xl p-5 sm:p-6" aria-label="Verification form">
      <ol className="flex items-center gap-2" aria-label="Steps">{NAMES.map((n, i) => <li key={n} className="flex flex-1 items-center gap-2"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${i < step ? "grad-brand" : i === step ? "grad-soft" : "bg-[var(--line)] text-[var(--mut)]"}`} aria-current={i === step ? "step" : undefined}>{i < step ? "✓" : i + 1}</span><span className={`hidden text-xs sm:block ${i === step ? "font-semibold" : "text-[var(--mut)]"}`}>{n}</span><span className="h-px flex-1 bg-[var(--line)]" /></li>)}</ol>
      <h2 className="text-lg font-semibold">{NAMES[step]}</h2>
      {step === 0 && <div className="space-y-4">
        <L t="Country"><select className={input} value={f.country} onChange={(e) => { const c = e.target.value; setF({ ...f, country: c, kind: c === "NG" ? "BVN" : "PASSPORT" }); }}><option value="NG">Nigeria</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="OTHER">Other</option></select></L>
        <L t="ID type"><select className={input} value={f.kind} onChange={set("kind")}>{KINDS.filter((k) => !k[2] || f.country === "NG").map((k) => <option key={k[0]} value={k[0]}>{k[1]}</option>)}</select></L>
        <L t="ID number" hint={ng ? "11 digits. Dial *565*0# to get your BVN." : undefined}><input className={input} inputMode={ng ? "numeric" : "text"} maxLength={ng ? 11 : 24} value={f.idNumber} onChange={set("idNumber")} autoComplete="off" /></L></div>}
      {step === 1 && <div className="space-y-4">
        <L t="Full legal name" hint="Exactly as it appears on your ID."><input className={input} value={f.legalName} onChange={set("legalName")} maxLength={80} /></L>
        <L t="Date of birth"><input className={input} type="date" value={f.dob} onChange={set("dob")} /></L>
        <L t="Home address"><textarea className={input} rows={2} value={f.address} onChange={set("address")} maxLength={200} /></L></div>}
      {step === 2 && <div className="space-y-4">
        {([["Photo of your ID (front)", idFront, setIdFront, "image/jpeg,image/png,image/webp,application/pdf", 0], ["Selfie holding your ID", selfie, setSelfie, "image/jpeg,image/png,image/webp", 1]] as const).map(([t, file, setter, accept, i]) => (
          <div key={t} className="space-y-2"><L t={t} hint="JPG, PNG or WebP under 1.8 MB (PDF allowed for the ID)."><input type="file" accept={accept} onChange={pick(setter)} className="text-sm" capture={i === 1 ? "user" : undefined} /></L>
            {urls[i] ? <img src={urls[i]!} alt={`Preview of ${t.toLowerCase()}`} className="max-h-48 rounded-xl border border-[var(--line)] object-contain" /> : file && <p className="text-xs text-[var(--mut)]">{file.name} added</p>}</div>))}
        <ul className="space-y-1 rounded-xl bg-[var(--line)] p-3 text-xs text-[var(--mut)]"><li>• Use good light, no glare, all four corners visible.</li><li>• Your name, photo and ID number must be readable.</li><li>• In the selfie, your face and the ID are both clear.</li></ul></div>}
      {step === 3 && <div className="space-y-4">
        <dl className="text-sm">{([["Country", f.country], ["ID type", KINDS.find((k) => k[0] === f.kind)?.[1] ?? f.kind], ["ID number", `•••••••${f.idNumber.slice(-4)}`], ["Legal name", f.legalName], ["Date of birth", f.dob], ["Address", f.address], ["ID photo", idFront?.name ?? ""], ["Selfie", selfie?.name ?? ""]] as [string, string][]).map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-t border-[var(--line)] py-2 first:border-0"><dt className="text-[var(--mut)]">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} className="mt-1 h-5 w-5" />I confirm these details are mine and are correct.</label></div>}
      {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
      <div className="flex gap-3">{step > 0 && <button type="button" onClick={() => { setErr(""); setStep(step - 1); }} className="rounded-full border border-[var(--line)] px-6 py-3 font-semibold">Back</button>}
        {step < 3 ? <button type="button" onClick={next} className="bg-lime-givar flex-1 rounded-full py-3 font-semibold">Continue</button> : <button type="button" onClick={submit} disabled={busy} className="bg-lime-givar flex-1 rounded-full py-3 font-semibold disabled:opacity-60">{busy ? "Uploading…" : "Submit for review"}</button>}</div>
    </section>
  );
}
