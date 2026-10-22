"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Banknote, Gift, LifeBuoy, Megaphone, MessagesSquare, LayoutDashboard, Receipt, ScrollText, Search, ShieldCheck, Trophy, Users } from "lucide-react";

const items = [
  ["/admin", "Overview", LayoutDashboard], ["/admin/analytics", "Analytics", Activity], ["/admin/users", "Users", Users], ["/admin/support", "Support inbox", LifeBuoy], ["/admin/communities", "Community chats", MessagesSquare], ["/admin/kyc", "KYC reviews", ShieldCheck],
  ["/admin/giveaways", "Giveaways", Gift], ["/admin/contests", "Contests", Trophy], ["/admin/transactions", "Transactions", Receipt], ["/admin/withdrawals", "Withdrawals", Banknote], ["/admin/notifications", "Notifications", Megaphone], ["/admin/seo", "SEO tools", Search], ["/admin/logs", "Logs", ScrollText],
] as const;
export default function AdminNav({ pendingKyc, support = 0, row }: { pendingKyc: number; support?: number; row?: boolean }) {
  const p = usePathname();
  return (
    <nav aria-label="Admin" className={row ? "flex gap-2 overflow-x-auto px-4 pb-3" : "space-y-1"}>
      {items.map(([href, label, Icon]) => {
        const on = href === "/admin" ? p === "/admin" : p.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm ${on ? "grad-soft font-semibold" : "text-[var(--mut)] hover:bg-[var(--line)] hover:text-[var(--fg)]"} ${row ? "shrink-0 border border-[var(--line)]" : ""}`}>
            <Icon size={row ? 16 : 19} aria-hidden />{label}
            {href === "/admin/support" && support > 0 && <span className="grad-brand ml-auto rounded-full px-2 py-0.5 text-xs font-bold">{support}</span>}
            {href === "/admin/kyc" && pendingKyc > 0 && <span className="grad-brand ml-auto rounded-full px-2 py-0.5 text-xs font-bold">{pendingKyc}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
