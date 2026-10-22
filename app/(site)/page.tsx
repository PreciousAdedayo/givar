import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, ChevronRight, Gift, Landmark, Plus, Receipt, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/money";
import { DEFAULT_DESCRIPTION, SITE, getSeoSettings, managed, pageMetadata } from "@/lib/seo";
import { dailySeries } from "@/lib/series";
import { txMeta } from "@/lib/tx";
import ActivityChart from "@/components/ActivityChart";
import Avatar from "@/components/Avatar";
import BalanceCard from "@/components/BalanceCard";
import ClaimByCode from "@/components/ClaimByCode";
import CopyButton from "@/components/CopyButton";
import ThemeToggle from "@/components/ThemeToggle";
import BellSlot from "@/components/BellSlot";
import ChatSlot from "@/components/ChatSlot";
import TxRow from "@/components/TxRow";
import TxTable from "@/components/TxTable";

const faqs = [
  ["What is a giveaway link generator?", "Givar turns any amount of cash into a claim link and code you can share anywhere. Winners open the link and the money lands in their wallet."],
  ["How do I claim a giveaway by code?", "Sign in, enter the code (for example GV-8X2K91), and your wallet is credited instantly if prizes remain."],
  ["Is Givar an international giveaway platform?", "Yes. You get virtual account numbers to receive money from banks in Nigeria, the US, the UK and beyond."],
  ["Is the giveaway money safe?", "Funds are locked in escrow when a giveaway is created and released only as winners claim."],
];
const buildJsonLd = (sameAs: string[]) => ({ "@context": "https://schema.org", "@graph": [
  { "@type": "Organization", "@id": `${SITE}/#org`, name: "Givar", url: SITE, slogan: "Give. Claim. Win.", logo: `${SITE}/apple-icon`, description: DEFAULT_DESCRIPTION, ...(sameAs.length ? { sameAs } : {}) },
  { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE, name: "Givar", publisher: { "@id": `${SITE}/#org` }, inLanguage: "en" },
  { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
] });
export async function generateMetadata(): Promise<Metadata> { const m = managed("/"); return pageMetadata("/", { title: m.title, description: m.description, absolute: true }); }
const actions = [
  { href: "/wallet#add", label: "Add money", Icon: Plus, grad: "grad-brand" },
  { href: "/wallet#withdraw", label: "Withdraw", Icon: ArrowUpRight, grad: "grad-soft" },
  { href: "/create", label: "Create", Icon: Gift, grad: "grad-brand" },
  { href: "/giveaways", label: "Giveaways", Icon: Sparkles, grad: "grad-soft" },
  { href: "/contests", label: "Contests", Icon: Trophy, grad: "grad-soft" },
  { href: "/wallet", label: "Wallet", Icon: Landmark, grad: "grad-soft" },
  { href: "/transactions", label: "History", Icon: Receipt, grad: "grad-soft" },
  { href: "/kyc", label: "Verify ID", Icon: ShieldCheck, grad: "grad-soft" },
];

async function loadMe(uid: string) {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const since = new Date(Math.min(monthStart.getTime(), Date.now() - 14 * 864e5));
  const [me, wallets, accounts, txs, flow, made, won] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: uid } }),
    prisma.wallet.findMany({ where: { userId: uid } }),
    prisma.virtualAccount.findMany({ where: { userId: uid }, orderBy: { currency: "asc" } }),
    prisma.transaction.findMany({ where: { wallet: { userId: uid } }, orderBy: { createdAt: "desc" }, take: 6, include: { wallet: { select: { currency: true } } } }),
    prisma.transaction.findMany({ where: { wallet: { userId: uid, currency: "NGN" }, status: "SUCCESS", createdAt: { gte: since } }, select: { createdAt: true, amount: true, type: true } }),
    prisma.giveaway.count({ where: { creatorId: uid } }),
    prisma.claim.count({ where: { userId: uid } }),
  ]);
  const inn = flow.filter((t) => txMeta[t.type].credit), out = flow.filter((t) => !txMeta[t.type].credit);
  const month = (l: typeof flow) => l.filter((t) => t.createdAt >= monthStart).reduce((a, t) => a + t.amount, 0);
  const chart = dailySeries(14, { in: inn.map((t) => ({ at: t.createdAt, v: t.amount / 100 })), out: out.map((t) => ({ at: t.createdAt, v: t.amount / 100 })) });
  return { me, wallets, accounts, txs, made, won, monthIn: month(inn), monthOut: month(out), chart };
}

export default async function Home() {
  const s = await getSession();
  const data = s ? await loadMe(s.user.id) : null;
  const settings = await getSeoSettings().catch(() => null);
  const jsonLd = buildJsonLd((settings?.sameAs ?? "").split("\n").filter(Boolean));
  const [giveaways, contests] = await Promise.all([
    prisma.giveaway.findMany({ where: { flagged: false, expiresAt: { gt: new Date() }, winnersLeft: { gt: 0 } }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.contest.findMany({ where: { drawnAt: null, endsAt: { gt: new Date() } }, orderBy: { endsAt: "asc" }, take: 2, include: { _count: { select: { entries: true } } } }),
  ]);
  const bal = (c: "NGN" | "USD") => data?.wallets.find((w) => w.currency === c);
  const nudge = data && (!data.me.phoneVerified ? { href: "/verify-phone", t: "Verify your phone", d: "Needed to claim giveaways." } : data.me.kyc !== "VERIFIED" ? { href: "/kyc", t: "Verify your identity", d: data.me.kyc === "PENDING" ? "Under review. We'll let you know." : "Unlock withdrawals and a permanent naira account." } : null);
  const first = data?.me.name?.split(" ")[0] ?? "there";

  const giveawayCards = giveaways.map((g) => (
    <li key={g.id}><Link href={`/c/${g.claimSlug}`} className="glass block rounded-2xl p-4">
      <div className="flex items-start justify-between"><span className="font-medium">{g.title}</span><span className="text-xl font-bold">{fmt(g.totalAmount, g.currency)}</span></div>
      <div className="my-3 h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="grad-brand h-full rounded-full" style={{ width: `${((g.winners - g.winnersLeft) / g.winners) * 100}%` }} /></div>
      <div className="flex items-center justify-between text-xs text-[var(--mut)]"><span>{g.winnersLeft} of {g.winners} left</span><span className="bg-lime-givar rounded-full px-3 py-1 text-sm font-semibold">Claim</span></div>
    </Link></li>));
  const contestCards = contests.length === 0 ? <li className="glass rounded-2xl p-4 text-sm text-[var(--mut)]">No open contests. <Link href="/contests/create" className="text-lime-givar underline">Host one</Link>.</li> : contests.map((c) => (
    <li key={c.id}><Link href={`/contests/${c.id}`} className="grad-dark flex items-center gap-3 rounded-2xl p-4"><Trophy size={26} aria-hidden /><span className="flex-1"><b className="block">{c.prize}</b><span className="text-sm opacity-90">{c.entryFee ? `Entry ${fmt(c.entryFee, c.currency)}` : "Free entry"} · {c._count.entries}/{c.maxEntries} joined</span></span><ChevronRight aria-hidden /></Link></li>));

  return (
    <main className="page max-w-6xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {data && (
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <Link href="/account" className="flex items-center gap-3"><Avatar name={data.me.name} image={data.me.image} size={44} /><span><span className="block text-xs text-[var(--mut)]">Welcome back</span><span className="font-semibold">{first}</span></span></Link>
          <span className="flex items-center gap-2"><ChatSlot /><BellSlot /><ThemeToggle /></span>
        </div>
      )}
      {data && <div className="mb-5"><h1 className="sr-only text-3xl font-bold lg:not-sr-only lg:block">Welcome back, {first}</h1><p className="hidden text-[var(--mut)] lg:block">Here's what's happening with your money and giveaways.</p></div>}

      <div className="grid gap-5 lg:grid-cols-12">
        {nudge && <Link href={nudge.href} className="grad-dark flex items-center gap-3 rounded-2xl p-4 lg:order-first lg:col-span-12"><ShieldCheck size={26} aria-hidden /><span className="flex-1"><b className="block">{nudge.t}</b><span className="text-sm opacity-90">{nudge.d}</span></span><ChevronRight aria-hidden /></Link>}

        {data ? (
          <div className="lg:order-1 lg:col-span-8"><BalanceCard ngn={fmt(bal("NGN")?.balance ?? 0)} usd={fmt(bal("USD")?.balance ?? 0, "USD")} held={fmt(bal("NGN")?.locked ?? 0)} /></div>
        ) : (
          <section className="grad-brand shadow-glow relative overflow-hidden rounded-3xl p-6 lg:col-span-12 lg:p-10">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/30 blur-2xl" />
            <div className="relative mb-5 flex items-center justify-between lg:hidden">
              <span className="flex items-center gap-2 text-lg font-bold"><svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="#11160a" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>Givar</span>
              <span className="flex items-center gap-3"><Link href="/auth" className="text-sm font-semibold underline">Sign in</Link><ThemeToggle /></span>
            </div>
            <h1 className="relative text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:max-w-3xl lg:text-5xl">The Global Giveaway Platform - Create, Share &amp; Claim Cash in Seconds</h1>
            <p className="relative mt-3 max-w-[52ch] text-sm font-medium lg:text-base">Give. Claim. Win. Get your own naira and dollar account numbers and receive money from any bank worldwide.</p>
            <div className="relative mt-5 flex gap-3"><Link href="/auth" className="rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-[#D8F24A]">Create free account</Link><Link href="/giveaways" className="rounded-full bg-white/50 px-6 py-3 text-sm font-semibold">Browse giveaways</Link></div>
          </section>
        )}

        <nav aria-label="Quick actions" className={`glass grid grid-cols-4 gap-y-5 rounded-3xl p-4 ${data ? "lg:order-5 lg:col-span-4 lg:content-start" : "lg:col-span-12 lg:grid-cols-8"}`}>
          {actions.map((a) => (
            <Link key={a.label} href={data || ["/giveaways", "/contests"].includes(a.href) ? a.href : "/auth"} className="flex flex-col items-center gap-2 text-center text-xs font-medium">
              <span className={`${a.grad} grid h-12 w-12 place-items-center rounded-2xl shadow-lg`}><a.Icon size={22} aria-hidden /></span>{a.label}
            </Link>
          ))}
        </nav>

        <div className="lg:hidden"><ClaimByCode /></div>

        {data && (
          <section aria-labelledby="acc" className="lg:order-2 lg:col-span-4"><h2 id="acc" className="mb-2 font-semibold">Receive money</h2>
            <p className="mb-3 text-xs text-[var(--mut)]">Your Givar accounts. Receive money from any bank in Nigeria, US, UK, Worldwide.</p>
            <div className="flex snap-x gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {data.accounts.length === 0 && <p className="glass rounded-2xl p-4 text-sm text-[var(--mut)]">Your accounts are being set up. Refresh in a moment.</p>}
              {data.accounts.map((a) => (
                <div key={a.id} className={`${a.currency === "NGN" ? "grad-brand" : "grad-dark"} min-w-[250px] snap-start rounded-2xl p-4 lg:min-w-0`}>
                  <div className="flex items-center justify-between text-xs opacity-90"><span>{a.currency} · {a.bankName}</span><CopyButton value={a.accountNumber} label={`Copy ${a.currency} account number`} /></div>
                  <p className="mt-1 font-mono text-2xl tracking-wider">{a.accountNumber}</p><p className="text-xs opacity-90">{a.accountName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data && (
          <div className="hidden gap-4 lg:order-3 lg:col-span-12 lg:grid lg:grid-cols-4">
            {[["Money in this month", fmt(data.monthIn)], ["Money out this month", fmt(data.monthOut)], ["Giveaways created", String(data.made)], ["Giveaways won", String(data.won)]].map(([l, v]) => (
              <div key={l} className="glass rounded-2xl p-4"><p className="text-sm text-[var(--mut)]">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>))}
          </div>
        )}
        {data && <section className="glass hidden rounded-3xl p-5 lg:order-4 lg:col-span-8 lg:block"><h2 className="mb-3 font-semibold">Wallet activity · last 14 days</h2><ActivityChart data={data.chart} /></section>}

        {data && (
          <section className="glass rounded-3xl p-4 lg:order-6 lg:col-span-8 lg:p-5" aria-labelledby="rt">
            <div className="flex items-center justify-between"><h2 id="rt" className="font-semibold">Recent transactions</h2><Link href="/transactions" className="flex items-center text-sm text-lime-givar">See all<ChevronRight size={16} aria-hidden /></Link></div>
            {data.txs.length === 0
              ? <p className="py-6 text-center text-sm text-[var(--mut)]">No transactions yet. <Link href="/wallet#add" className="text-lime-givar underline">Add money</Link> to get started.</p>
              : <><ul className="mt-1 divide-y divide-[var(--line)] lg:hidden">{data.txs.map((t) => <TxRow key={t.id} t={t} />)}</ul><div className="mt-3 hidden lg:block"><TxTable txs={data.txs} /></div></>}
          </section>
        )}

        <div className={data ? "space-y-5 lg:order-7 lg:col-span-4" : "space-y-5 lg:col-span-12 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0"}>
          <section aria-labelledby="lg" className={data ? "" : "lg:col-span-2"}><div className="mb-2 flex items-center justify-between"><h2 id="lg" className="font-semibold">Live giveaways</h2><Link href="/giveaways" className="text-sm text-lime-givar">See all</Link></div>
            {giveaways.length === 0 ? <p className="glass rounded-2xl p-4 text-sm text-[var(--mut)]">No live giveaways right now. <Link href="/create" className="text-lime-givar underline">Start one</Link>.</p> : <ul className={data ? "space-y-3" : "space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"}>{giveawayCards}</ul>}
          </section>
          <section aria-labelledby="lc"><div className="mb-2 flex items-center justify-between"><h2 id="lc" className="font-semibold">Win a prize</h2><Link href="/contests" className="text-sm text-lime-givar">See all</Link></div><ul className="space-y-3">{contestCards}</ul></section>
        </div>
      </div>

      {!data && (
        <>
          <section className="mt-10" aria-labelledby="how"><h2 id="how" className="text-2xl font-bold">How it works</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">{[["Create", "Set an amount and winners. The money is locked in escrow."], ["Share", "Get a link and code like GV-8X2K91. Post it anywhere."], ["Claim", "Winners are paid to their wallet the moment they claim."]].map(([t, d], i) => (
              <li key={t} className="glass rounded-2xl p-4"><span className="text-sm font-semibold text-lime-givar">Step {i + 1}</span><h3 className="mt-1 font-semibold">{t}</h3><p className="mt-1 text-sm text-[var(--mut)]">{d}</p></li>))}</ol></section>
          <section className="mt-10" aria-labelledby="feat"><h2 id="feat" className="text-2xl font-bold">The giveaway app that keeps everyone honest</h2>
            <dl className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2">
              {[["Giveaway link generator", "Turn any amount of cash into a claim link and a code like GV-8X2K91. Share it on WhatsApp, X or Telegram in one tap."], ["Claim a giveaway by code", "Winners enter the code or open the link and the money lands in their Givar wallet the moment they claim."], ["Money held in escrow", "The full amount is locked when you create a giveaway. Whatever nobody claims comes back to you when it expires."], ["Prize contests", "Enter raffle contests for dinners and other prizes, free or with a small entry fee. Winners are drawn automatically."]].map(([t, d]) => <div key={t}><dt className="font-semibold">{t}</dt><dd className="mt-1 text-[var(--mut)]">{d}</dd></div>)}
            </dl></section>
          <section className="mt-10" aria-labelledby="global"><h2 id="global" className="text-2xl font-bold">An international giveaway platform: Nigeria, the USA, the UK and worldwide</h2>
            <p className="mt-3 max-w-[70ch] text-[var(--mut)]">Every Givar user gets a naira account number and a dollar account number. Receive money from any bank in Nigeria, the United States, the United Kingdom or anywhere else, and withdraw to a Nigerian bank account whenever you like. <Link href="/auth" className="text-lime-givar underline">Create your free account</Link> or <Link href="/giveaways" className="text-lime-givar underline">browse live giveaways</Link>.</p></section>
          <section className="mt-10 max-w-3xl" aria-labelledby="faq"><h2 id="faq" className="text-2xl font-bold">Questions</h2>
            <div className="mt-3 divide-y divide-[var(--line)]">{faqs.map(([q, a]) => <details key={q} className="py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-[var(--mut)]">{a}</p></details>)}</div></section>
          <footer className="mt-10 border-t border-[var(--line)] pt-6 text-center text-sm text-[var(--mut)]"><nav aria-label="Footer" className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-2"><Link href="/giveaways" className="hover:text-[var(--fg)]">Live giveaways</Link><Link href="/contests" className="hover:text-[var(--fg)]">Prize contests</Link><Link href="/auth" className="hover:text-[var(--fg)]">Create account</Link><a href="#faq" className="hover:text-[var(--fg)]">FAQ</a><a href="mailto:support@givar.app" className="hover:text-[var(--fg)]">Support</a></nav>© {new Date().getFullYear()} Givar.app · Give. Claim. Win.</footer>
        </>
      )}
    </main>
  );
}
