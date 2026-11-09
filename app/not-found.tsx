import Link from "next/link";
export const metadata = { title: "Page not found", robots: { index: false } };
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[85vh] max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold"><svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>Givar</Link>
      <div><p className="text-6xl font-bold text-lime-givar">404</p><h1 className="mt-2 text-2xl font-bold">Page not found</h1><p className="mt-2 text-[var(--mut)]">That page doesn&apos;t exist, or you don&apos;t have access to it.</p></div>
      <div className="flex flex-wrap justify-center gap-3"><Link href="/" className="bg-lime-givar rounded-full px-6 py-3 font-semibold">Go home</Link><Link href="/giveaways" className="glass rounded-full px-6 py-3 font-semibold">Browse giveaways</Link></div>
    </main>
  );
}
