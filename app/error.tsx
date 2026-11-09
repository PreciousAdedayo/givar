"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { fetch("/api/report", { method: "POST", body: JSON.stringify({ message: error.message.slice(0, 300), digest: error.digest, path: location.pathname }) }).catch(() => {}); }, [error]);
  return (
    <main className="mx-auto flex min-h-[85vh] max-w-md flex-col items-center justify-center gap-5 px-4 py-10 text-center"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="text-[var(--mut)]">We&apos;ve been told about it. Your money is safe. Try again.</p><div className="flex flex-wrap justify-center gap-3"><button onClick={reset} className="bg-lime-givar rounded-full px-6 py-3 font-semibold">Try again</button><a href="/" className="glass rounded-full px-6 py-3 font-semibold">Go home</a></div></main>
  );
}
