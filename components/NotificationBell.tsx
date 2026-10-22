"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

/** Bell with an unread badge. Refreshes every minute and whenever the tab regains focus. */
export default function NotificationBell({ initial }: { initial: number }) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    let alive = true;
    const load = async () => { try { const r = await fetch("/api/notifications/count", { cache: "no-store" }); if (r.ok && alive) setN((await r.json()).unread); } catch {} };
    const t = setInterval(load, 60000); window.addEventListener("focus", load);
    return () => { alive = false; clearInterval(t); window.removeEventListener("focus", load); };
  }, []);
  return (
    <Link href="/notifications" aria-label={n > 0 ? `Notifications, ${n} unread` : "Notifications"} className="glass relative grid h-10 w-10 place-items-center rounded-full">
      <Bell size={18} aria-hidden />
      {n > 0 && <span className="grad-brand absolute -right-1 -top-1 grid min-w-[20px] place-items-center rounded-full px-1 text-[11px] font-bold leading-5">{n > 99 ? "99+" : n}</span>}
    </Link>
  );
}
