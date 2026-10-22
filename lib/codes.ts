import { randomInt } from "crypto";
const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alike chars (0/O, 1/I/L)
const pick = (n: number) => Array.from({ length: n }, () => A[randomInt(A.length)]).join("");
export const newClaimCode = () => `GV-${pick(6)}`;
export const newClaimSlug = () => pick(9);

const A2 = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const four = () => Array.from({ length: 4 }, () => A2[randomInt(A2.length)]).join("");
/** A one-time personal code like GV-7K2M-QX9P (about 850 billion possibilities, so it can't be guessed). */
export const newPersonalCode = () => `GV-${four()}-${four()}`;
export const PERSONAL_RE = /^GV-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;
/** Splits `total` (in minor units) into `n` amounts that add up exactly. Every amount is at least 1. */
export function splitAmounts(total: number, n: number, distribution: "EQUAL" | "RANDOM"): number[] {
  if (n <= 1) return [total];
  if (distribution === "EQUAL") { const base = Math.floor(total / n), rem = total - base * n; return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0)); }
  const w = Array.from({ length: n }, () => 0.5 + randomInt(1000) / 1000), sum = w.reduce((a, b) => a + b, 0);
  const out = w.map((x) => Math.max(1, Math.floor((total - n) * (x / sum)) + 1));
  let diff = total - out.reduce((a, b) => a + b, 0), i = 0;
  while (diff !== 0) { const k = i++ % n; if (diff > 0) { out[k]++; diff--; } else if (out[k] > 1) { out[k]--; diff++; } }
  return out;
}
