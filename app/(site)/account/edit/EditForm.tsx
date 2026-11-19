"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CountryPicker from "@/components/CountryPicker";
import Avatar from "@/components/Avatar";
const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-lime-givar";
export default function EditForm(p: { name: string; country: string; contact: string; image: string }) {
  const r = useRouter(); const [name, setName] = useState(p.name); const [country, setCountry] = useState(p.country || "NG"); const [image, setImage] = useState(p.image); const [selectedFile, setSelectedFile] = useState<File | null>(null); const [preview, setPreview] = useState(""); const [err, setErr] = useState(""); const [uploading, setUploading] = useState(false); const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await fetch("/api/account/profile", { method: "PATCH", body: JSON.stringify({ name, country }) });
    if (!res.ok) return setErr((await res.json()).error);
    r.push("/account"); r.refresh();
  }
  function selectAvatar(file?: File) {
    if (!file) return; if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) { setErr("Choose a JPG, PNG or WebP image under 3 MB."); return; }
    setErr(""); setSelectedFile(file); setPreview(URL.createObjectURL(file));
  }
  async function uploadAvatar() {
    if (!selectedFile) return; setUploading(true); setErr(""); const fd = new FormData(); fd.append("file", selectedFile); const res = await fetch("/api/account/avatar", { method: "POST", body: fd }); const j = await res.json().catch(() => ({})); setUploading(false);
    if (!res.ok) return setErr(j.error ?? "Profile picture upload failed."); setImage(j.image); setSelectedFile(null); setPreview(""); if (fileRef.current) fileRef.current.value = ""; r.refresh();
  }
  async function removeAvatar() { if (selectedFile) { setSelectedFile(null); setPreview(""); if (fileRef.current) fileRef.current.value = ""; return; } const res = await fetch("/api/account/avatar", { method: "DELETE" }); if (!res.ok) return setErr("Could not remove profile picture."); setImage(""); r.refresh(); }
  return (
    <main className="page max-w-md"><form onSubmit={save} className="glass space-y-4 rounded-2xl p-6">
      <h1 className="text-2xl font-bold">Personal information</h1>
      <div className="flex items-center gap-4">{preview ? <img src={preview} alt="Selected profile picture preview" className="h-16 w-16 rounded-full border border-[var(--line)] object-cover" /> : <Avatar name={name} image={image} size={64} />}<div className="min-w-0"><p className="font-medium">Profile picture</p><p className="text-xs text-[var(--mut)]">JPG, PNG or WebP · up to 3 MB</p><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-xs" disabled={uploading} onChange={(e) => selectAvatar(e.target.files?.[0])} /><div className="mt-2 flex flex-wrap gap-3">{selectedFile && <button type="button" onClick={uploadAvatar} disabled={uploading} className="text-xs font-semibold text-lime-givar">{uploading ? "Uploading…" : "Upload picture"}</button>}{(image || selectedFile) && <button type="button" onClick={removeAvatar} className="text-xs underline">Remove picture</button>}</div></div></div>
      <label className="block text-sm text-[var(--mut)]">Full name<input className={`${input} mt-1 text-[var(--fg)]`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} /></label>
      <label className="block text-sm text-[var(--mut)]">Country<div className="mt-1 text-[var(--fg)]"><CountryPicker className={input} value={country} onChange={setCountry} /></div></label>
      <label className="block text-sm text-[var(--mut)]">Sign-in details<input className={`${input} mt-1 opacity-60`} value={p.contact} disabled /></label>
      {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
      <button className="bg-lime-givar w-full rounded-full py-3 font-semibold">Save changes</button>
    </form></main>
  );
}
