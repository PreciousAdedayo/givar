import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MANAGED_PAGES, SITE } from "@/lib/seo";
import { PageHead } from "@/components/admin/ui";
import SeoPageForm from "@/components/admin/SeoPageForm";
import SeoTabs from "@/components/admin/SeoTabs";
import { resetSeoPage, saveSeoPage } from "../../actions";

export const metadata = { title: "Page SEO" };
export const dynamic = "force-dynamic";

export default async function PageSeo({ searchParams }: { searchParams: { path?: string; saved?: string; err?: string } }) {
  const page = MANAGED_PAGES.find((p) => p.path === searchParams.path) ?? MANAGED_PAGES[0];
  const row = await prisma.seoPage.findUnique({ where: { path: page.path } });
  return (
    <>
      <PageHead title="Page SEO" desc="Edit the title, description and sharing image for each public page." />
      <SeoTabs active="/admin/seo/pages" />
      <div className="mb-4 flex flex-wrap gap-2">{MANAGED_PAGES.map((p) => <Link key={p.path} href={`/admin/seo/pages?path=${encodeURIComponent(p.path)}`} aria-current={p.path === page.path ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${p.path === page.path ? "bg-lime-givar" : "glass"}`}>{p.label}</Link>)}</div>
      {searchParams.saved && <p role="status" className="grad-soft mb-4 rounded-xl p-3 text-sm">{searchParams.saved === "reset" ? "Reset to defaults." : "Saved. The change is live."}</p>}
      {searchParams.err && <p role="alert" className="mb-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-500">{searchParams.err === "canonical" ? "Canonical must start with / or https://" : "Image URL must start with / or https://"}</p>}
      <SeoPageForm key={page.path} site={SITE} action={saveSeoPage} reset={resetSeoPage.bind(null, page.path)} defaults={{ title: page.title, description: page.description }}
        initial={{ path: page.path, title: row?.title ?? "", description: row?.description ?? "", ogImage: row?.ogImage ?? "", canonical: row?.canonical ?? "", noindex: row?.noindex ?? false }} />
    </>
  );
}
