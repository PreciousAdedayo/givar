import Link from "next/link";
const tabs = [["/admin/seo", "Overview"], ["/admin/seo/pages", "Page SEO"], ["/admin/seo/audit", "SEO audit"], ["/admin/seo/settings", "Site settings"]] as const;
export default function SeoTabs({ active }: { active: string }) {
  return <nav aria-label="SEO sections" className="mb-5 flex gap-2 overflow-x-auto">{tabs.map(([h, l]) => <Link key={h} href={h} aria-current={active === h ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${active === h ? "bg-lime-givar" : "glass"}`}>{l}</Link>)}</nav>;
}
