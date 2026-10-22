import Link from "next/link";
export const metadata = { title: "Giveaway not found", robots: { index: false } };
export default function GiveawayNotFound() {
  return (
    <main className="page flex min-h-[60vh] max-w-md flex-col justify-center gap-4">
      <div className="glass space-y-3 rounded-2xl p-5 sm:p-6"><h1 className="text-2xl font-bold">We can&apos;t find that giveaway</h1><p className="text-[var(--mut)]">Check the code or link and try again, or browse what is live right now.</p><Link href="/giveaways" className="bg-lime-givar inline-block rounded-full px-5 py-2.5 font-semibold">Browse giveaways</Link></div>
    </main>
  );
}
