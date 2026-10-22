import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { DEFAULT_PREFS } from "@/lib/notify-rules";
import { savePrefs } from "../actions";

export const metadata = { title: "Notification settings", robots: { index: false } };
export const dynamic = "force-dynamic";
const OPTIONS = [
  ["emailMoney", "Money", "Deposits, withdrawals and giveaway winnings"], ["emailGiveaways", "Your giveaways", "When one of your giveaways is fully claimed or refunded"],
  ["emailContests", "Contests", "When you win a contest or your contest is drawn"], ["emailNews", "News and offers", "Occasional product news from Givar"],
] as const;

export default async function NotificationSettings({ searchParams }: { searchParams: { saved?: string } }) {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, notificationPref: true } });
  const prefs = { ...DEFAULT_PREFS, ...(me.notificationPref ?? {}) };
  return (
    <main className="page max-w-lg space-y-5">
      <Link href="/notifications" className="text-sm text-[var(--mut)]">← Notifications</Link>
      <h1 className="text-2xl font-bold">Notification settings</h1>
      {searchParams.saved && <p role="status" className="grad-soft rounded-xl p-3 text-sm">Saved.</p>}
      <form action={savePrefs} className="glass space-y-1 rounded-2xl p-5 sm:p-6">
        <h2 className="font-semibold">Email me about</h2>
        <p className="pb-2 text-sm text-[var(--mut)]">{me.email ? `Emails go to ${me.email}.` : "You signed up with a phone number, so emails are not available. In-app notifications always work."}</p>
        {OPTIONS.map(([k, t, d]) => (
          <label key={k} className="flex items-start gap-3 border-t border-[var(--line)] py-3"><input type="checkbox" name={k} defaultChecked={prefs[k]} disabled={!me.email} className="mt-1 h-5 w-5" /><span><span className="block font-medium">{t}</span><span className="block text-sm text-[var(--mut)]">{d}</span></span></label>))}
        <div className="border-t border-[var(--line)] pt-3 text-sm text-[var(--mut)]">Identity verification and security emails (like a password change) are always sent. Everything also shows in the app.</div>
        <button disabled={!me.email} className="bg-lime-givar mt-3 w-full rounded-full py-3 font-semibold disabled:opacity-50">Save settings</button>
      </form>
    </main>
  );
}
