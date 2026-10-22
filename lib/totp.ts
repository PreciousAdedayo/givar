import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
// Standard TOTP (RFC 6238): works with Google Authenticator, Authy, 1Password, Microsoft Authenticator.
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32(buf: Buffer) { let bits = 0, v = 0, out = ""; for (const b of buf) { v = (v << 8) | b; bits += 8; while (bits >= 5) { out += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(v << (5 - bits)) & 31]; return out; }
export function unbase32(s: string) { let bits = 0, v = 0; const out: number[] = []; for (const c of s.replace(/=+$/, "").toUpperCase()) { const i = B32.indexOf(c); if (i < 0) continue; v = (v << 5) | i; bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); }
export const newSecret = () => base32(randomBytes(20));
export function totp(secret: string, at = Date.now(), digits = 6, step = 30) {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / step)));
  const h = createHmac("sha1", unbase32(secret)).update(buf).digest(), o = h[h.length - 1] & 15;
  const bin = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}
const eq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
/** Accepts the current code and one step either side, to allow for clock drift. */
export function verifyTotp(secret: string, code: string, at = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  return [-1, 0, 1].some((w) => eq(totp(secret, at + w * 30000), code));
}
export const otpauthUri = (secret: string, account: string, issuer = "Givar") => `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

// ---- backup codes: shown once, stored only as hashes, each works once ----
const hashCode = (c: string) => createHash("sha256").update(c.replace(/[^a-z0-9]/gi, "").toLowerCase()).digest("hex");
export function makeBackupCodes(n = 8) { const codes = Array.from({ length: n }, () => { const h = randomBytes(4).toString("hex"); return `${h.slice(0, 4)}-${h.slice(4)}`; }); return { codes, stored: JSON.stringify(codes.map(hashCode)) }; }
/** Returns the remaining stored hashes if the code was valid (and is now used up), otherwise null. */
export function useBackupCode(stored: string | null, code: string): string | null {
  if (!stored) return null; let list: string[]; try { list = JSON.parse(stored); } catch { return null; }
  const h = hashCode(code), i = list.indexOf(h); if (i < 0) return null; list.splice(i, 1); return JSON.stringify(list);
}
