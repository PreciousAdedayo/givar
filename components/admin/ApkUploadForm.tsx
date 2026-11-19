"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ApkUploadForm() {
  const router = useRouter(); const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [success,setSuccess] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setSuccess(""); const form = e.currentTarget; const fd = new FormData(form); const file = fd.get("file");
    if (!(file instanceof File) || !file.size) return setError("Choose an APK file.");
    if (file.size > 150 * 1024 * 1024) return setError("APK must be 150 MB or smaller.");
    setBusy(true);
    try {
      const prep = await fetch("/api/admin/apk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: fd.get("version"), fileName: file.name, fileSize: file.size, notes: fd.get("notes"), minAndroidVersion: fd.get("minAndroidVersion"), published: fd.get("published") === "on" }) });
      const ticket = await prep.json(); if (!prep.ok) throw new Error(ticket.error ?? "Could not prepare upload.");
      const uploaded = await fetch(ticket.signedUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/vnd.android.package-archive", "x-upsert": "false" }, body: file }); if (!uploaded.ok) throw new Error("Storage upload failed. Check the bucket size limit and CORS settings.");
      const saved = await fetch("/api/admin/apk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ticket) }); const result = await saved.json();
      if (!saved.ok) throw new Error(result.error ?? "Could not save the release record.");
      form.reset(); setSuccess("APK uploaded and release saved."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5">
    <h2 className="font-semibold">Upload a new Android release</h2>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Version<input required name="version" placeholder="1.0.1" pattern="[0-9]+\.[0-9]+\.[0-9]+([+-][a-zA-Z0-9.-]+)?" className="mt-1 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2.5" /></label><label className="text-sm">Minimum Android version<input name="minAndroidVersion" placeholder="Android 8.0" className="mt-1 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2.5" /></label></div>
    <label className="block text-sm">APK file<input required name="file" type="file" accept=".apk,application/vnd.android.package-archive" className="mt-1 block w-full text-xs" /></label>
    <label className="block text-sm">Release notes<textarea name="notes" rows={3} maxLength={3000} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2.5" /></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" />Publish immediately as the current download</label>
    <p className="text-xs text-[var(--mut)]">Upload is sent directly to Supabase Storage, not through the app server. Keep the Android package ID and signing certificate identical between releases so existing installations can update.</p>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}{success && <p role="status" className="text-sm text-emerald-500">{success}</p>}
    <button disabled={busy} className="bg-lime-givar rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50">{busy ? "Uploading APK…" : "Upload release"}</button>
  </form>;
}
