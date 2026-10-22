import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { limit } from "./ratelimit";
import { useBackupCode, verifyTotp } from "./totp";

export type LoginCheck = { ok: false } | { ok: true; user: { id: string; email: string | null; name: string | null; twoFactor: boolean } };
/** Checks identifier + password (rate-limited). Does NOT check the 2FA code. */
export async function checkCredentials(identifier: string, password: string): Promise<LoginCheck> {
  if (!(await limit(`login:${identifier.toLowerCase()}`, 10, 900))) return { ok: false }; // 10 tries / 15 min
  const u = await prisma.user.findFirst({ where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] } });
  if (!u?.passwordHash || u.banned || !verifyPassword(password, u.passwordHash)) return { ok: false };
  return { ok: true, user: { id: u.id, email: u.email, name: u.name, twoFactor: u.twoFactorEnabled } };
}
/** Accepts an authenticator code or a one-time backup code. */
export async function checkSecondFactor(userId: string, code: string) {
  if (!(await limit(`2fa:${userId}`, 10, 900))) return false;
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { twoFactorSecret: true, backupCodes: true } });
  if (u.twoFactorSecret && verifyTotp(u.twoFactorSecret, code.trim())) return true;
  const left = useBackupCode(u.backupCodes, code.trim());
  if (left === null) return false;
  await prisma.user.update({ where: { id: userId }, data: { backupCodes: left } });
  return true;
}
