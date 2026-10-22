"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch {} }
  return <button onClick={copy} aria-label={label} className="grid h-8 w-8 place-items-center rounded-full bg-[var(--line)]">{done ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}<span className="sr-only" role="status">{done ? "Copied" : ""}</span></button>;
}
