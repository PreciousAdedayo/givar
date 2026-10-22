import { afterEach, describe, expect, it, vi } from "vitest";
import { auditPath } from "@/lib/seo-audit";

const page = (head: string, body: string) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const mockFetch = (html: string, status = 200) => vi.stubGlobal("fetch", vi.fn(async () => new Response(html, { status })));
afterEach(() => vi.unstubAllGlobals());

describe("auditPath", () => {
  it("scores a well-optimised page highly", async () => {
    mockFetch(page(`<title>Givar.app - Global Giveaway Platform | Create, Claim &amp; Win</title><meta name="description" content="${"Create giveaway links and codes, claim cash instantly and win dinner contests on Givar worldwide."}"><link rel="canonical" href="https://givar.app/"><meta property="og:image" content="https://givar.app/og.png"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">{}</script>`, `<h1>Hello</h1><p>${words(200)}</p><img src="a.png" alt="a">`));
    const r = await auditPath("https://givar.app", "/");
    expect(r.score).toBeGreaterThanOrEqual(95); expect(r.h1).toBe(1); expect(r.title).toContain("Create, Claim & Win"); expect(r.issues.some((i) => i.level === "error")).toBe(false);
  });
  it("flags missing basics as errors", async () => {
    mockFetch(page("", `<p>${words(20)}</p><img src="a.png">`));
    const r = await auditPath("https://givar.app", "/x");
    const texts = r.issues.filter((i) => i.level === "error").map((i) => i.text).join("|");
    expect(texts).toContain("Missing <title>"); expect(texts).toContain("Missing meta description"); expect(texts).toContain("No <h1>");
    expect(r.imgNoAlt).toBe(1); expect(r.score).toBeLessThan(60);
  });
  it("detects noindex, duplicate h1 and treats HTTP errors as failures", async () => {
    mockFetch(page(`<title>T</title><meta name="robots" content="noindex, follow">`, "<h1>a</h1><h1>b</h1>"), 404);
    const r = await auditPath("https://givar.app", "/gone");
    expect(r.noindex).toBe(true); expect(r.h1).toBe(2); expect(r.issues[0].level).toBe("error"); expect(r.status).toBe(404);
  });
  it("never throws when the page can't be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connection refused"); }));
    const r = await auditPath("https://givar.app", "/");
    expect(r.score).toBe(0); expect(r.error).toContain("connection refused");
  });
});
