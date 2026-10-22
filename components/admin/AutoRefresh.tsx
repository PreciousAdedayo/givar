"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
/** Re-loads the server data every few seconds so a transcript stays current while an admin watches it. */
export default function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => { if (!document.hidden) r.refresh(); }, seconds * 1000); return () => clearInterval(t); }, [r, seconds]);
  return null;
}
