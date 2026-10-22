"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
/** Presentation only: the winner was already picked server-side by the draw job. This just plays it back. */
export default function Reveal({ names, winner }: { names: string[]; winner: string }) {
  const [i, setI] = useState(0); const [done, setDone] = useState(false);
  useEffect(() => {
    if (names.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) { setDone(true); return; }
    let n = 0; const t = setInterval(() => { n++; if (n > 18) { clearInterval(t); setDone(true); } else setI(n % names.length); }, 120);
    return () => clearInterval(t);
  }, [names.length]);
  const shown = done ? winner : names[i];
  return (
    <div aria-live="polite" className="glass flex h-32 items-center justify-center overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.p key={`${shown}-${done}`} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.12 }} className={done ? "text-4xl font-bold text-lime-givar" : "text-3xl text-[var(--mut)]"}>{shown}</motion.p>
      </AnimatePresence>
    </div>
  );
}
