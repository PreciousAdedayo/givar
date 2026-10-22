import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
export const hashPassword = (pw: string) => { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(pw, s, 64).toString("hex")}`; };
export const verifyPassword = (pw: string, stored: string) => {
  const [s, h] = stored.split(":"); if (!s || !h) return false;
  const a = Buffer.from(h, "hex"), b = scryptSync(pw, s, 64); return a.length === b.length && timingSafeEqual(a, b);
};
