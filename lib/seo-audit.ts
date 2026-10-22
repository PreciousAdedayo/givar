export type Issue = { level: "error" | "warn" | "ok"; text: string };
export type Audit = { path: string; status: number; ms: number; kb: number; title: string; description: string; canonical: string; h1: number; imgNoAlt: number; noindex: boolean; ogImage: boolean; twitter: boolean; jsonld: number; words: number; issues: Issue[]; score: number; error?: string };

const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? "";
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
function meta(html: string, key: "name" | "property", value: string) { for (const t of html.match(/<meta\b[^>]*>/gi) ?? []) if (attr(t, key).toLowerCase() === value) return decode(attr(t, "content")); return ""; }
function link(html: string, rel: string) { for (const t of html.match(/<link\b[^>]*>/gi) ?? []) if (attr(t, "rel").toLowerCase() === rel) return attr(t, "href"); return ""; }

/** Fetches one of our own pages and checks the things search engines care about. Regex based, so treat it as a fast first pass, not a replacement for Search Console. */
export async function auditPath(base: string, path: string): Promise<Audit> {
  const t0 = Date.now();
  const empty: Audit = { path, status: 0, ms: 0, kb: 0, title: "", description: "", canonical: "", h1: 0, imgNoAlt: 0, noindex: false, ogImage: false, twitter: false, jsonld: 0, words: 0, issues: [], score: 0 };
  try {
    const r = await fetch(base + path, { redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "GivarSEOAudit/1.0" } });
    const html = await r.text(); const ms = Date.now() - t0;
    const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""), description = meta(html, "name", "description"), canonical = link(html, "canonical");
    const robots = meta(html, "name", "robots").toLowerCase();
    const h1 = (html.match(/<h1[\s>]/gi) ?? []).length, imgNoAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
    const words = (text.match(/\b[\p{L}\p{N}']+\b/gu) ?? []).length;
    const a: Audit = { path, status: r.status, ms, kb: Math.round(html.length / 1024), title, description, canonical, h1, imgNoAlt, noindex: robots.includes("noindex"), ogImage: !!meta(html, "property", "og:image"), twitter: !!meta(html, "name", "twitter:card"), jsonld: (html.match(/application\/ld\+json/gi) ?? []).length, words, issues: [], score: 100 };
    const add = (level: Issue["level"], text: string, cost = 0) => { a.issues.push({ level, text }); a.score -= cost; };
    if (r.status !== 200) add("error", `Page returned HTTP ${r.status}`, 30); else add("ok", "Page loads (HTTP 200)");
    if (!title) add("error", "Missing <title>", 20); else if (title.length < 30 || title.length > 65) add("warn", `Title is ${title.length} characters. Aim for 30 to 60 so it is not cut off in results`, 5); else add("ok", `Title length is good (${title.length})`);
    if (!description) add("error", "Missing meta description", 15); else if (description.length < 70 || description.length > 165) add("warn", `Meta description is ${description.length} characters. Aim for 70 to 160`, 5); else add("ok", `Meta description length is good (${description.length})`);
    if (!canonical) add("warn", "No canonical URL set", 8); else add("ok", "Canonical URL present");
    if (h1 === 0) add("error", "No <h1> heading", 10); else if (h1 > 1) add("warn", `${h1} <h1> headings. Use one per page`, 5); else add("ok", "Exactly one <h1>");
    if (a.noindex) add("warn", "Page is set to noindex, so search engines will not list it", 10); else add("ok", "Page can be indexed");
    if (!a.ogImage) add("warn", "No og:image, so shared links have no preview picture", 5); else add("ok", "og:image present");
    if (!a.twitter) add("warn", "No twitter:card tag", 3); else add("ok", "Twitter card present");
    if (imgNoAlt > 0) add("warn", `${imgNoAlt} image(s) without alt text`, 5);
    if (a.jsonld === 0) add("warn", "No structured data (JSON-LD)", 3); else add("ok", `${a.jsonld} structured data block(s)`);
    if (words < 150) add("warn", `Only ${words} words of visible text. Thin pages rank poorly`, 8); else add("ok", `${words} words of visible text`);
    if (ms > 1500) add("warn", `Slow response (${ms} ms)`, 5); else add("ok", `Fast response (${ms} ms)`);
    a.score = Math.max(0, a.score); return a;
  } catch (e) {
    return { ...empty, ms: Date.now() - t0, error: e instanceof Error ? e.message : "Request failed", issues: [{ level: "error", text: `Could not fetch the page: ${e instanceof Error ? e.message : "unknown error"}` }] };
  }
}
export async function fileCheck(base: string, path: string) {
  try { const r = await fetch(base + path, { cache: "no-store", signal: AbortSignal.timeout(8000) }); const t = r.ok ? await r.text() : ""; return { ok: r.ok, status: r.status, urls: (t.match(/<loc>/g) ?? []).length, text: t.slice(0, 1500) }; }
  catch { return { ok: false, status: 0, urls: 0, text: "" }; }
}
