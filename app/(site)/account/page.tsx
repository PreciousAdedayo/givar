import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Bell, BellRing, Gift, MessageCircle, UserPlus, ChevronRight, History, KeyRound, LifeBuoy, Mail, Palette, Phone, ShieldCheck, UserRound, Wallet, LayoutDashboard, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import Avatar from "@/components/Avatar";
import CopyButton from "@/components/CopyButton";
import ResendEmail from "@/components/ResendEmail";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Profile", robots: { index: false } };

function Row({ href, Icon, title, sub, right }: { href?: string; Icon: LucideIcon; title: string; sub?: string; right?: React.ReactNode }) {
  const body = (<>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--line)]"><Icon size={19} aria-hidden /></span>
    <span className="min-w-0 flex-1"><span className="block font-medium">{title}</span>{sub && <span className="block truncate text-xs text-[var(--mut)]">{sub}</span>}</span>
    {right ?? (href ? <ChevronRight size={18} className="text-[var(--mut)]" aria-hidden /> : null)}
  </>);
  return href && href.startsWith("mailto:") ? <li><a href={href} className="flex items-center gap-3 py-3">{body}</a></li>
    : href ? <li><Link href={href} className="flex items-center gap-3 py-3">{body}</Link></li> : <li className="flex items-center gap-3 py-3">{body}</li>;
}
const Group = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <section className={className}><h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--mut)]">{title}</h2><ul className="glass divide-y divide-[var(--line)] rounded-2xl px-4">{children}</ul></section>);
const Pill = ({ ok, text }: { ok: boolean; text: string }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? "grad-soft" : "bg-[var(--line)] text-[var(--mut)]"}`}>{text}</span>;

export default async function Account() {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const [me, accounts, made, won, entered] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.virtualAccount.findMany({ where: { userId } }),
    prisma.giveaway.count({ where: { creatorId: userId } }), prisma.claim.count({ where: { userId } }), prisma.contestEntry.count({ where: { userId } }),
  ]);
  const unread = await prisma.notification.count({ where: { userId, readAt: null } });
  const level = 1 + (me.phoneVerified ? 1 : 0) + (me.kyc === "VERIFIED" ? 1 : 0);
  const next = !me.phoneVerified ? { href: "/verify-phone", t: "Verify your phone to claim giveaways" } : me.kyc === "VERIFIED" ? null : me.kyc === "PENDING" ? { href: "/kyc", t: "ID review in progress" } : { href: "/kyc", t: "Verify your ID to withdraw" };
  const kycText = me.kyc === "VERIFIED" ? "Verified" : me.kyc === "PENDING" ? "In review" : me.kyc === "REJECTED" ? "Rejected, try again" : "Not started";
  return (
    <main className="page max-w-xl space-y-5 lg:grid lg:max-w-6xl lg:grid-cols-[380px_1fr] lg:items-start lg:gap-6 lg:space-y-0">
      <h1 className="sr-only">Your profile</h1>
      <div className="space-y-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <section className="grad-brand shadow-glow relative overflow-hidden rounded-3xl p-6 text-center">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
        <div className="relative mx-auto w-fit rounded-full bg-white/30 p-1"><Avatar name={me.name} image={me.image} size={84} /></div>
        <p className="relative mt-3 flex items-center justify-center gap-1.5 text-xl font-bold">{me.name ?? "Givar user"}{level === 3 && <BadgeCheck size={20} aria-label="Fully verified" />}</p>
        <p className="relative text-sm opacity-90">{me.email ?? me.phone}</p>
        <p className="relative mt-1 text-xs opacity-80">Member since {me.createdAt.toLocaleDateString("en", { month: "long", year: "numeric" })}</p>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          {[[made, "Created"], [won, "Won"], [entered, "Contests"]].map(([n, l]) => <div key={l} className="rounded-2xl bg-white/20 py-2"><p className="text-xl font-bold">{n}</p><p className="text-xs">{l}</p></div>)}
        </div>
      </section>

      <section className="glass rounded-2xl p-4" aria-labelledby="lv">
        <div className="flex items-center justify-between"><h2 id="lv" className="font-semibold">Verification level {level} of 3</h2><ShieldCheck size={20} className="text-lime-givar" aria-hidden /></div>
        <div className="my-3 flex gap-1.5" role="img" aria-label={`Level ${level} of 3`}>{[1, 2, 3].map((i) => <span key={i} className={`h-2 flex-1 rounded-full ${i <= level ? "grad-brand" : "bg-[var(--line)]"}`} />)}</div>
        <p className="text-xs text-[var(--mut)]">Level 2 lets you claim giveaways. Level 3 unlocks withdrawals and a permanent naira account.</p>
        {next ? <Link href={next.href} className="bg-lime-givar mt-3 inline-block rounded-full px-5 py-2 text-sm font-semibold">{next.t}</Link> : <p className="mt-3 text-sm font-semibold text-lime-givar">You're fully verified.</p>}
      </section>
      <SignOutButton />
      </div>
      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">

      {accounts.length > 0 && <Group title="My Givar accounts" className="lg:col-span-2">{accounts.map((a) => (
        <li key={a.id} className="flex items-center gap-3 py-3"><span className="min-w-0 flex-1"><span className="block text-xs text-[var(--mut)]">{a.currency} · {a.bankName}</span><span className="block font-mono text-lg tracking-wider">{a.accountNumber}</span><span className="block text-xs">{a.accountName}</span></span><CopyButton value={a.accountNumber} label={`Copy ${a.currency} account number`} /></li>))}</Group>}

      <Group title="Account">
        <Row href="/account/edit" Icon={UserRound} title="Personal information" sub="Name and country" />
        <Row Icon={Mail} title="Email" sub={me.email ?? "No email added"} right={me.email ? (me.emailVerified ? <Pill ok text="Verified" /> : <ResendEmail />) : undefined} />
        <Row href="/verify-phone" Icon={Phone} title="Phone number" sub={me.phoneVerified ? me.phone ?? "" : "Not verified"} right={<Pill ok={me.phoneVerified} text={me.phoneVerified ? "Verified" : "Verify"} />} />
        <Row href="/kyc" Icon={ShieldCheck} title="Identity verification (BVN / NIN)" sub={kycText} right={<Pill ok={me.kyc === "VERIFIED"} text={me.kyc === "VERIFIED" ? "Verified" : me.kyc === "PENDING" ? "In review" : "Start"} />} />
      </Group>
      <Group title="Security"><Row href="/account/security" Icon={KeyRound} title="Security" sub="2-step sign-in, PIN, devices and password" /></Group>
      <Group title="Giveaways">
          <Row href="/manage" Icon={Gift} title="My giveaways and contests" sub="Cancel, renew and open community chats" />
          <Row href="/referrals" Icon={UserPlus} title="Invite friends" sub="Earn a bonus for every friend who joins" />
        </Group>
      <Group title="Money">
        <Row href="/wallet" Icon={Wallet} title="Wallet" sub="Add money and withdraw" />
        <Row href="/transactions" Icon={History} title="Transaction history" sub="Everything in and out" />
      </Group>
      <Group title="Notifications"><Row href="/notifications" Icon={Bell} title="Notifications" sub="Money, giveaways and contests" right={unread > 0 ? <Pill ok text={`${unread} new`} /> : undefined} /><Row href="/notifications/settings" Icon={BellRing} title="Notification settings" sub="Choose which emails you get" /></Group>
      <Group title="Preferences"><Row Icon={Palette} title="Appearance" sub="Light or dark" right={<ThemeToggle />} /></Group>
      <Group title="Help"><Row href="/help" Icon={LifeBuoy} title="Help and support" sub="FAQs and live chat" /><Row href="/chats" Icon={MessageCircle} title="Chats" sub="Support and community chats" /></Group>
      {me.role === "ADMIN" && <Group title="Admin"><Row href="/admin" Icon={LayoutDashboard} title="Admin dashboard" sub="Analytics and moderation" /></Group>}
      </div>
    </main>
  );
}
