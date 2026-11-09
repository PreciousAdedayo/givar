import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

import { DAY, iso, parseFilters, sod, type Filters, type Gran, type Row } from "./analytics-filters";
export { parseFilters };
export type { Filters, Gran, Row };

function trunc(d: Date, g: Gran) { const x = sod(d); if (g === "week") return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * DAY); if (g === "month") return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), 1)); return x; }
function step(d: Date, g: Gran) { return g === "day" ? new Date(d.getTime() + DAY) : g === "week" ? new Date(d.getTime() + 7 * DAY) : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); }
const label = (d: Date, g: Gran) => d.toLocaleDateString("en", g === "month" ? { month: "short", year: "2-digit", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" });
function fill(f: Filters, maps: Record<string, Map<string, number>>): Row[] {
  const out: Row[] = [];
  for (let d = trunc(f.from, f.gran); d < f.to; d = step(d, f.gran)) { const r: Row = { day: label(d, f.gran) }; for (const [k, m] of Object.entries(maps)) r[k] = m.get(iso(d)) ?? 0; out.push(r); }
  return out;
}
const toMap = (rows: { d: Date; a: bigint | number }[], k = 1) => new Map(rows.map((r) => [iso(r.d), Number(r.a) / k]));
type Q = { d: Date; a: bigint; b?: bigint }[];

export type Kpis = { views: number; visitors: number; signups: number; created: number; claims: number; entries: number; depNGN: number; depUSD: number; feeNGN: number; feeUSD: number };
async function kpis(f: Filters, from: Date, to: Date): Promise<Kpis> {
  const range = { gte: from, lt: to };
  const ev: Prisma.AnalyticsEventWhereInput = { type: "pageview", createdAt: range, ...(f.source ? { source: f.source } : {}), ...(f.country ? { country: f.country } : {}) };
  const srcF = f.source ? Prisma.sql`AND "source" = ${f.source}` : Prisma.empty, ctyF = f.country ? Prisma.sql`AND "country" = ${f.country}` : Prisma.empty;
  const sum = (type: "DEPOSIT" | "FEE", currency: "NGN" | "USD") => prisma.transaction.aggregate({ _sum: { amount: true }, where: { type, status: "SUCCESS", createdAt: range, wallet: { currency } } });
  const [views, vis, signups, created, claims, entries, dN, dU, fN, fU] = await Promise.all([
    prisma.analyticsEvent.count({ where: ev }),
    prisma.$queryRaw<{ n: bigint }[]>(Prisma.sql`SELECT count(DISTINCT "visitorId") AS n FROM "AnalyticsEvent" WHERE type = 'pageview' AND "createdAt" >= ${from} AND "createdAt" < ${to} ${srcF} ${ctyF}`),
    prisma.user.count({ where: { createdAt: range, ...(f.country ? { country: f.country } : {}) } }),
    prisma.giveaway.count({ where: { createdAt: range, ...(f.currency ? { currency: f.currency } : {}) } }),
    prisma.claim.count({ where: { createdAt: range, ...(f.currency ? { giveaway: { currency: f.currency } } : {}) } }),
    prisma.contestEntry.count({ where: { createdAt: range } }),
    sum("DEPOSIT", "NGN"), sum("DEPOSIT", "USD"), sum("FEE", "NGN"), sum("FEE", "USD"),
  ]);
  return { views, visitors: Number(vis[0]?.n ?? 0), signups, created, claims, entries, depNGN: dN._sum.amount ?? 0, depUSD: dU._sum.amount ?? 0, feeNGN: fN._sum.amount ?? 0, feeUSD: fU._sum.amount ?? 0 };
}

export async function loadAnalytics(f: Filters) {
  const span = f.to.getTime() - f.from.getTime();
  const srcF = f.source ? Prisma.sql`AND "source" = ${f.source}` : Prisma.empty, ctyF = f.country ? Prisma.sql`AND "country" = ${f.country}` : Prisma.empty;
  const userCty = f.country ? Prisma.sql`AND "country" = ${f.country}` : Prisma.empty;
  const curG = f.currency ? Prisma.sql`AND "currency" = ${f.currency}::"Currency"` : Prisma.empty;
  const joinG = f.currency ? Prisma.sql`JOIN "Giveaway" g ON g.id = c."giveawayId"` : Prisma.empty, curC = f.currency ? Prisma.sql`AND g."currency" = ${f.currency}::"Currency"` : Prisma.empty;
  const curW = f.currency ? Prisma.sql`AND w."currency" = ${f.currency}::"Currency"` : Prisma.empty;
  const ev: Prisma.AnalyticsEventWhereInput = { type: "pageview", createdAt: { gte: f.from, lt: f.to }, ...(f.source ? { source: f.source } : {}), ...(f.country ? { country: f.country } : {}) };
  const [kpi, prev, views, signups, created, claimed, vol, entries, countries, sources, pages, srcOpts, ctyOpts] = await Promise.all([
    kpis(f, f.from, f.to), kpis(f, new Date(f.from.getTime() - span), f.from),
    prisma.$queryRaw<Q>(Prisma.sql`SELECT date_trunc(${f.gran}, "createdAt") AS d, count(*) AS a, count(DISTINCT "visitorId") AS b FROM "AnalyticsEvent" WHERE type = 'pageview' AND "createdAt" >= ${f.from} AND "createdAt" < ${f.to} ${srcF} ${ctyF} GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<Q>(Prisma.sql`SELECT date_trunc(${f.gran}, "createdAt") AS d, count(*) AS a FROM "User" WHERE "createdAt" >= ${f.from} AND "createdAt" < ${f.to} ${userCty} GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<Q>(Prisma.sql`SELECT date_trunc(${f.gran}, "createdAt") AS d, count(*) AS a FROM "Giveaway" WHERE "createdAt" >= ${f.from} AND "createdAt" < ${f.to} ${curG} GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<Q>(Prisma.sql`SELECT date_trunc(${f.gran}, c."createdAt") AS d, count(*) AS a FROM "Claim" c ${joinG} WHERE c."createdAt" >= ${f.from} AND c."createdAt" < ${f.to} ${curC} GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<{ d: Date; c: string; a: bigint }[]>(Prisma.sql`SELECT date_trunc(${f.gran}, t."createdAt") AS d, w."currency"::text AS c, sum(t.amount) AS a FROM "Transaction" t JOIN "Wallet" w ON w.id = t."walletId" WHERE t.type = 'DEPOSIT' AND t.status = 'SUCCESS' AND t."createdAt" >= ${f.from} AND t."createdAt" < ${f.to} ${curW} GROUP BY 1, 2 ORDER BY 1`),
    prisma.$queryRaw<Q>(Prisma.sql`SELECT date_trunc(${f.gran}, "createdAt") AS d, count(*) AS a FROM "ContestEntry" WHERE "createdAt" >= ${f.from} AND "createdAt" < ${f.to} GROUP BY 1 ORDER BY 1`),
    prisma.analyticsEvent.groupBy({ by: ["country"], where: { ...ev, country: { not: null } }, _count: true, orderBy: { _count: { country: "desc" } }, take: 8 }),
    prisma.analyticsEvent.groupBy({ by: ["source"], where: { ...ev, source: { not: null } }, _count: true, orderBy: { _count: { source: "desc" } }, take: 8 }),
    prisma.analyticsEvent.groupBy({ by: ["path"], where: { ...ev, path: { not: null } }, _count: true, orderBy: { _count: { path: "desc" } }, take: 8 }),
    prisma.analyticsEvent.groupBy({ by: ["source"], where: { type: "pageview", source: { not: null } }, _count: true, orderBy: { _count: { source: "desc" } }, take: 20 }),
    prisma.analyticsEvent.groupBy({ by: ["country"], where: { type: "pageview", country: { not: null } }, _count: true, orderBy: { _count: { country: "desc" } }, take: 40 }),
  ]);
  return {
    f, kpi, prev,
    visitors: fill(f, { views: toMap(views), unique: new Map(views.map((r) => [iso(r.d), Number(r.b ?? 0)])) }),
    signups: fill(f, { signups: toMap(signups) }),
    giveaways: fill(f, { created: toMap(created), claimed: toMap(claimed) }),
    volume: fill(f, { NGN: toMap(vol.filter((r) => r.c === "NGN"), 100), USD: toMap(vol.filter((r) => r.c === "USD"), 100) }),
    entries: fill(f, { entries: toMap(entries) }),
    countries: countries.map((r) => ({ k: r.country ?? "?", n: r._count })), sources: sources.map((r) => ({ k: r.source ?? "?", n: r._count })), pages: pages.map((r) => ({ k: r.path ?? "?", n: r._count })),
    options: { sources: srcOpts.map((r) => r.source ?? "").filter(Boolean), countries: ctyOpts.map((r) => r.country ?? "").filter(Boolean) },
  };
}
export type AnalyticsData = Awaited<ReturnType<typeof loadAnalytics>>;
