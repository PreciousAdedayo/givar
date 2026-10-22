"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { fetch("/api/report", { method: "POST", body: JSON.stringify({ message: error.message.slice(0, 300), digest: error.digest, path: location.pathname }) }).catch(() => {}); }, [error]);
  return <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="text-[var(--mut)]">We've been told about it. Your money is safe. Try again.</p><button onClick={reset} className="rounded-full bg-lime-givar px-6 py-3 font-semibold text-black">Try again</button></main>;
}
