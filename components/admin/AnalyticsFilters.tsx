import Link from "next/link";
import type { Filters } from "@/lib/analytics";
import { btnCls, ghostCls, inputCls } from "./ui";

const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-xs font-medium text-[var(--mut)]">{t}<div className="mt-1">{children}</div></label>;
/** Plain GET form: every filter lives in the URL, so a filtered view can be bookmarked or shared with another admin. */
export default function AnalyticsFilters({ f, options, path = "/admin/analytics" }: { f: Filters; options: { sources: string[]; countries: string[] }; path?: string }) {
  return (
    <form action={path} className="glass mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Analytics filters">
      <L t="Date range"><select name="r" defaultValue={f.range} className={inputCls}><option value="7">Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option><option value="mtd">This month so far</option><option value="custom">Custom (use dates)</option></select></L>
      <L t="From (custom)"><input type="date" name="from" defaultValue={f.fromStr} className={inputCls} /></L>
      <L t="To (custom)"><input type="date" name="to" defaultValue={f.toStr} className={inputCls} /></L>
      <L t="Group by"><select name="g" defaultValue={f.gran} className={inputCls}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></L>
      <L t="Traffic source"><select name="source" defaultValue={f.source ?? ""} className={inputCls}><option value="">All sources</option>{options.sources.map((s) => <option key={s}>{s}</option>)}</select></L>
      <L t="Country"><select name="country" defaultValue={f.country ?? ""} className={inputCls}><option value="">All countries</option>{options.countries.map((s) => <option key={s}>{s}</option>)}</select></L>
      <L t="Currency (giveaways, deposits)"><select name="currency" defaultValue={f.currency ?? ""} className={inputCls}><option value="">NGN + USD</option><option>NGN</option><option>USD</option></select></L>
      <div className="flex items-end gap-2"><button className={btnCls}>Apply filters</button><Link href={path} className={ghostCls}>Reset</Link></div>
    </form>
  );
}
