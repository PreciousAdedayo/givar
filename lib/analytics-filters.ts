export type Gran = "day" | "week" | "month";
export type Filters = { from: Date; to: Date; gran: Gran; source?: string; country?: string; currency?: "NGN" | "USD"; range: string; fromStr: string; toStr: string };
export type Row = Record<string, string | number>;
export const DAY = 864e5;
export const sod = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
export const iso = (d: Date) => d.toISOString().slice(0, 10);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Turns the URL's query string into validated filters. Anything invalid falls back to the last 14 days. */
export function parseFilters(sp: Record<string, string | undefined>): Filters {
  const today = sod(new Date()); const end = new Date(today.getTime() + DAY); // "to" is exclusive
  let range = sp.r ?? "14"; let from = new Date(today.getTime() - 13 * DAY); let to = end;
  if (range === "custom" && sp.from && sp.to && DATE_RE.test(sp.from) && DATE_RE.test(sp.to)) {
    const f = new Date(`${sp.from}T00:00:00Z`), t = new Date(new Date(`${sp.to}T00:00:00Z`).getTime() + DAY);
    if (!isNaN(+f) && !isNaN(+t) && t > f) { from = f; to = t; } else range = "14";
  } else if (range === "mtd") from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  else { const n = ["7", "14", "30", "90", "365"].includes(range) ? Number(range) : 14; range = String(n); from = new Date(today.getTime() - (n - 1) * DAY); }
  if (to.getTime() - from.getTime() > 366 * DAY) from = new Date(to.getTime() - 366 * DAY); // cap at one year
  const days = (to.getTime() - from.getTime()) / DAY;
  const gran: Gran = sp.g === "day" || sp.g === "week" || sp.g === "month" ? sp.g : days <= 45 ? "day" : days <= 200 ? "week" : "month";
  return { from, to, gran, range, source: sp.source || undefined, country: sp.country || undefined, currency: sp.currency === "NGN" || sp.currency === "USD" ? sp.currency : undefined, fromStr: iso(from), toStr: iso(new Date(to.getTime() - DAY)) };
}
