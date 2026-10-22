"use client";
import { useState } from "react";
import { btnCls, ghostCls, inputCls } from "./ui";

type V = { path: string; title: string; description: string; ogImage: string; canonical: string; noindex: boolean };
const Count = ({ n, min, max }: { n: number; min: number; max: number }) => <span className={`text-xs ${n === 0 ? "text-[var(--mut)]" : n < min || n > max ? "text-red-500" : "text-lime-givar"}`}>{n} characters · aim for {min}–{max}</span>;
/** Editor with a live Google-style preview. Empty fields fall back to the built-in defaults shown as placeholders. */
export default function SeoPageForm({ initial, defaults, site, action, reset }: { initial: V; defaults: { title: string; description: string }; site: string; action: (fd: FormData) => void; reset: () => void }) {
  const [v, setV] = useState(initial);
  const set = (k: keyof V) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const title = v.title || defaults.title, desc = v.description || defaults.description, host = site.replace(/^https?:\/\//, "");
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <form action={action} className="glass space-y-4 rounded-2xl p-5">
        <input type="hidden" name="path" value={v.path} />
        <label className="block text-sm font-medium">Page title<input name="title" value={v.title} onChange={set("title")} placeholder={defaults.title} maxLength={120} className={`${inputCls} mt-1`} /><Count n={title.length} min={30} max={60} /></label>
        <label className="block text-sm font-medium">Meta description<textarea name="description" value={v.description} onChange={set("description")} placeholder={defaults.description} rows={4} maxLength={320} className={`${inputCls} mt-1`} /><Count n={desc.length} min={70} max={160} /></label>
        <label className="block text-sm font-medium">Social share image URL<input name="ogImage" value={v.ogImage} onChange={set("ogImage")} placeholder="https://… (1200×630 recommended). Blank uses the site default" className={`${inputCls} mt-1`} /></label>
        <label className="block text-sm font-medium">Canonical URL<input name="canonical" value={v.canonical} onChange={set("canonical")} placeholder={`${v.path} (leave blank unless you are sure)`} className={`${inputCls} mt-1`} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="noindex" checked={v.noindex} onChange={set("noindex")} />Hide this page from search engines (noindex)</label>
        <div className="flex flex-wrap gap-2"><button className={btnCls}>Save changes</button><button formAction={reset} formNoValidate className={ghostCls}>Reset to defaults</button></div>
      </form>
      <aside className="space-y-3" aria-label="Google preview">
        <p className="text-sm font-medium">How it may look on Google</p>
        <div className="rounded-xl bg-white p-4 text-[#202124]">
          <p className="truncate text-xs text-[#4d5156]">{host}{v.path === "/" ? "" : ` › ${v.path.slice(1)}`}</p>
          <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{title.length > 60 ? `${title.slice(0, 58)}…` : title}</p>
          <p className="mt-1 text-sm leading-snug text-[#4d5156]">{desc.length > 160 ? `${desc.slice(0, 157)}…` : desc}</p>
        </div>
        <p className="text-xs text-[var(--mut)]">Google may rewrite titles and descriptions. This is a guide to what fits, not a guarantee.</p>
      </aside>
    </div>
  );
}
