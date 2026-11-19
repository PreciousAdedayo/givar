"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ReleasePublishButton({ id, published }: { id: string; published: boolean }) {
  const [busy,setBusy] = useState(false); const router = useRouter();
  async function change() { setBusy(true); const r = await fetch("/api/admin/apk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, published: !published }) }); setBusy(false); if (r.ok) router.refresh(); }
  return <button type="button" disabled={busy} onClick={change} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50">{busy ? "Saving…" : published ? "Unpublish" : "Publish"}</button>;
}
