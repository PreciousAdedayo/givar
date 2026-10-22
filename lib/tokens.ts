import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";
const h = (s: string) => createHash("sha256").update(s).digest("hex");
export async function createToken(userId: string, kind: "VERIFY" | "RESET", ttlMin: number) {
  const raw = randomBytes(32).toString("hex");
  await prisma.authToken.create({ data: { userId, kind, hash: h(raw), expiresAt: new Date(Date.now() + ttlMin * 60000) } });
  return raw; // only the hash is stored
}
/** One-time use: returns the userId if the token is valid, else null. */
export async function consumeToken(raw: string, kind: "VERIFY" | "RESET") {
  const t = await prisma.authToken.findUnique({ where: { hash: h(raw) } });
  if (!t || t.kind !== kind || t.usedAt || t.expiresAt < new Date()) return null;
  const r = await prisma.authToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
  return r.count === 1 ? t.userId : null;
}
