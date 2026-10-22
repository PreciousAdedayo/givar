/** Buckets dates into the last `n` days: returns [{day:'Sep 29', ...keys}] */
export function dailySeries(n: number, sets: Record<string, { at: Date; v?: number }[]>) {
  const days = Array.from({ length: n }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1 - i)); return d; });
  return days.map((d) => {
    const end = d.getTime() + 864e5; const row: Record<string, string | number> = { day: d.toLocaleDateString("en", { month: "short", day: "numeric" }) };
    for (const [k, list] of Object.entries(sets)) row[k] = list.filter((x) => x.at.getTime() >= d.getTime() && x.at.getTime() < end).reduce((a, x) => a + (x.v ?? 1), 0);
    return row;
  });
}
