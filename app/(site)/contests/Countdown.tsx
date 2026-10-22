"use client";
import { useEffect, useState } from "react";
export default function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now === null) return <span>&nbsp;</span>;
  const s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  if (s === 0) return <span>Ended</span>;
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return <span>{d > 0 ? `${d}d ` : ""}{h}h {m}m {s % 60}s left</span>;
}
