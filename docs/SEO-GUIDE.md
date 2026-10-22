# SEO guide

Nobody can promise page-one rankings. What this project gives you is a solid technical base, tools to manage it, and a plan for the parts only you can do.

## Built into the website
- **Unique titles and descriptions** for the home page, giveaways list, contests list and sign-up, editable in Admin > SEO > Page SEO. Each has a canonical URL and region tags (`en-NG`, `en-US`, `en-GB`).
- **Sitemap** (`/sitemap.xml`) built live from the database: only live giveaways and open contests, and any page you mark noindex is left out. **robots.txt** is generated too, and blocks private areas (admin, wallet, account, API).
- **Ended giveaways and finished contests are marked noindex** so Google does not fill up with dead pages. **Filtered or searched** giveaway lists are noindex too (duplicate content).
- **Real 404s.** A wrong giveaway code returns an HTTP 404, not a friendly page that says 200 (a "soft 404", which Google penalises).
- **Share pictures.** Every giveaway and contest link gets its own image (amount, title, prizes left) for WhatsApp, X and Telegram, which is where your traffic will come from.
- **Structured data** (JSON-LD): organisation with logo and your social links, website, FAQ, breadcrumbs, and contest events.
- **Content for the keywords you want**: giveaway app, giveaway link generator, claim giveaway by code, international giveaway platform, Nigeria / USA / UK, with one H1 per page and clear headings.
- **Basics**: favicon and app icon, web manifest, theme colour, fast font loading, proper `lang`, no accidental canonical-to-home on every page (an earlier bug, now fixed).

## Admin > SEO tools
- **Overview**: setup checklist and the state of each page.
- **Page SEO**: edit title, description, share image, canonical and noindex with a live Google-style preview and character counters.
- **SEO audit**: fetches your own pages and scores them out of 100 (title and description length, H1, canonical, social tags, structured data, alt text, thin content, speed, noindex). It also checks robots.txt and counts sitemap URLs. It uses simple text matching, so treat it as a fast first pass.
- **Site settings**: title template, default description, share image, X handle, Google and Bing verification codes, social profile links, extra robots rules.

## What you must do yourself
1. Add the site to **Google Search Console** and **Bing Webmaster Tools** (paste the codes in Site settings), then submit `/sitemap.xml`.
2. Run the audit, fix warnings, run again.
3. Get **links and mentions**: share giveaways in WhatsApp groups, X, Telegram and Nigerian tech or campus communities, and get blogs to cover you. This matters more than any setting here.
4. Publish **helpful content** (for example "how to run a safe giveaway on WhatsApp") on pages that can be indexed. Right now the site has only the home page text and the FAQ.
5. Watch **Search Console** (real impressions and clicks) and **PageSpeed Insights** (real speed on real phones). The numbers in Admin > Analytics come from our own tracker and are a rough guide.

## Honest limits
- Google shows FAQ rich results only for a small set of sites, so the FAQ markup will probably not produce a visible result. It still helps Google understand the page.
- All regions share one English page. The region tags tell Google you serve them; ranking in each country still depends on local links and demand.
- A new domain takes weeks to months to rank, whatever the setup.
