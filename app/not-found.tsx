import Link from "next/link";
export default function NotFound() {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center"><h1 className="text-2xl font-bold">Page not found</h1><Link href="/giveaways" className="rounded-full bg-lime-givar px-6 py-3 font-semibold text-black">Browse giveaways</Link></main>;
}
