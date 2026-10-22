import { loadAnalytics, parseFilters } from "@/lib/analytics";
import { Card, PageHead } from "@/components/admin/ui";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsFilters from "@/components/admin/AnalyticsFilters";
import KpiGrid from "@/components/admin/Kpis";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const List = ({ title, rows, empty }: { title: string; rows: { k: string; n: number }[]; empty: string }) => (
  <Card title={title}>{rows.length === 0 ? <p className="text-sm text-[var(--mut)]">{empty}</p> : <ul className="space-y-2 text-sm">{rows.map((r) => <li key={r.k} className="flex justify-between gap-3"><span className="truncate">{r.k}</span><span className="text-[var(--mut)]">{r.n.toLocaleString()}</span></li>)}</ul>}</Card>
);
export default async function Analytics({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const f = parseFilters(searchParams);
  const a = await loadAnalytics(f);
  return (
    <>
      <PageHead title="Analytics" desc={`${f.fromStr} to ${f.toStr} · grouped by ${f.gran} · times are UTC`} />
      <AnalyticsFilters f={f} options={a.options} />
      <div className="space-y-5">
        <KpiGrid k={a.kpi} p={a.prev} />
        <AnalyticsCharts data={a} />
        <div className="grid gap-4 md:grid-cols-3">
          <List title="Top countries" rows={a.countries} empty="No visits in this period." />
          <List title="Traffic sources" rows={a.sources} empty="No visits in this period." />
          <List title="Top pages" rows={a.pages} empty="No visits in this period." />
        </div>
        <p className="text-xs text-[var(--mut)]">Source and country filters apply to visits. Country also filters signups. Currency filters giveaways, claims and deposits. Page views are counted by our own tracker and are indicative, not exact.</p>
      </div>
    </>
  );
}
