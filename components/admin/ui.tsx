import Link from "next/link";

export const Card = ({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={`glass rounded-2xl p-4 sm:p-5 ${className}`}>
    {(title || action) && <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">{title}</h2>{action}</div>}
    {children}
  </section>
);
export const PageHead = ({ title, desc, right }: { title: string; desc?: string; right?: React.ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold lg:text-3xl">{title}</h1>{desc && <p className="mt-1 text-sm text-[var(--mut)]">{desc}</p>}</div>{right}</div>
);
export function Stat({ label, value, sub, href, tone }: { label: string; value: string; sub?: React.ReactNode; href?: string; tone?: "brand" }) {
  const body = (<div className={`${tone === "brand" ? "grad-brand" : "glass"} h-full rounded-2xl p-4`}><p className={`text-sm ${tone === "brand" ? "" : "text-[var(--mut)]"}`}>{label}</p><p className="mt-1 text-2xl font-bold">{value}</p>{sub && <div className="mt-1 text-xs">{sub}</div>}</div>);
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
export const Pill = ({ tone = "mute", children }: { tone?: "ok" | "bad" | "mute"; children: React.ReactNode }) => (
  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone === "ok" ? "grad-soft" : tone === "bad" ? "bg-red-500/15 text-red-500" : "bg-[var(--line)] text-[var(--mut)]"}`}>{children}</span>
);
export const Empty = ({ children }: { children: React.ReactNode }) => <p className="py-8 text-center text-sm text-[var(--mut)]">{children}</p>;
export const inputCls = "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-lime-givar";
export const btnCls = "bg-lime-givar rounded-full px-4 py-2 text-sm font-semibold";
export const ghostCls = "rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold";

export function Pager({ page, total, size, path, params }: { page: number; total: number; size: number; path: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / size)); if (pages <= 1) return null;
  const href = (p: number) => { const q = new URLSearchParams(); for (const [k, v] of Object.entries(params)) if (v) q.set(k, v); q.set("page", String(p)); return `${path}?${q}`; };
  return (
    <div className="mt-4 flex items-center justify-between text-sm"><span className="text-[var(--mut)]">Page {page} of {pages} · {total} total</span>
      <span className="flex gap-2">{page > 1 && <Link href={href(page - 1)} className={ghostCls}>← Prev</Link>}{page < pages && <Link href={href(page + 1)} className={ghostCls}>Next →</Link>}</span></div>
  );
}
