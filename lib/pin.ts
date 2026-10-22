import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";
import { notify } from "./notify";
export const PIN_RE = /^\d{4}$/;
export const hashPin = (pin: string) => hashPassword(pin);
export type PinResult = { ok: true } | { ok: false; error: string; code?: "NO_PIN" | "LOCKED" };
/** Checks a transaction PIN. 5 wrong tries lock it for 30 minutes (and the user is told). */
export async function checkPin(userId: string, pin: string): Promise<PinResult> {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { pinHash: true, pinFails: true, pinLockedUntil: true } });
  if (!u.pinHash) return { ok: false, error: "Set a transaction PIN first.", code: "NO_PIN" };
  if (u.pinLockedUntil && u.pinLockedUntil > new Date()) return { ok: false, code: "LOCKED", error: `Too many wrong PINs. Try again in ${Math.ceil((u.pinLockedUntil.getTime() - Date.now()) / 60000)} minutes.` };
  if (PIN_RE.test(pin) && verifyPassword(pin, u.pinHash)) { if (u.pinFails) await prisma.user.update({ where: { id: userId }, data: { pinFails: 0, pinLockedUntil: null } }); return { ok: true }; }
  const fails = u.pinFails + 1, lock = fails >= 5;
  await prisma.user.update({ where: { id: userId }, data: { pinFails: lock ? 0 : fails, pinLockedUntil: lock ? new Date(Date.now() + 30 * 60000) : null } });
  if (lock) { await notify(userId, { type: "SECURITY", title: "Transaction PIN locked", body: "Someone entered the wrong transaction PIN 5 times. It is locked for 30 minutes. If this wasn't you, change your password.", href: "/account/security" }); return { ok: false, code: "LOCKED", error: "Too many wrong PINs. Locked for 30 minutes." }; }
  return { ok: false, error: `Wrong PIN. ${5 - fails} attempt${5 - fails === 1 ? "" : "s"} left.` };
}
