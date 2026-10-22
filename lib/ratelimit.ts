import { prisma } from "./prisma";
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
/** Database-backed limiter (works on serverless, unlike in-memory counters). Returns true if the call is allowed. */
export async function limit(key: string, max: number, windowSec: number) {
  const n = await prisma.rateHit.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowSec * 1000) } } });
  if (n >= max) return false;
  await prisma.rateHit.create({ data: { key } });
  return true;
}
