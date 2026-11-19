"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const slots = [{ kind: "light", title: "Light-theme logo" }, { kind: "dark", title: "Dark-theme logo" }, { kind: "favicon", title: "Favicon" }] as const;
export default function BrandingUploads() {
  const router = useRouter(); const [busy, setBusy] = useState(""); const [message, setMessage] = useState("");
  async function upload(kind: string, file?: File) {
    if (!file) return; setBusy(kind); setMessage("");
    const fd = new FormData(); fd.append("kind", kind); fd.append("file", file);
    const res = await fetch("/api/admin/branding", { method: "POST", body: fd }); const data = await res.json().catch(() => ({}));
    setBusy(""); if (!res.ok) { setMessage(data.error ?? "Upload failed."); return; }
    setMessage(`${kind === "light" ? "Light logo" : kind === "dark" ? "Dark logo" : "Favicon"} updated.`); router.refresh();
  }
  return <div className="glass space-y-4 rounded-2xl p-5"><div><h2 className="font-semibold">Upload brand assets</h2><p className="mt-1 text-xs text-[var(--mut)]">PNG, WebP or JPG up to 3 MB. Uploads replace the corresponding theme asset.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">{slots.map((s) => <label key={s.kind} className="rounded-xl border border-[var(--line)] p-3 text-sm font-medium">{s.title}<input className="mt-2 block w-full text-xs" type="file" accept="image/png,image/webp,image/jpeg" disabled={!!busy} onChange={(e) => upload(s.kind, e.target.files?.[0])} />{busy === s.kind && <span className="mt-2 block text-xs text-[var(--mut)]">Uploading…</span>}</label>)}</div>
    {message && <p role="status" className="text-sm text-[var(--mut)]">{message}</p>}
  </div>;
}
