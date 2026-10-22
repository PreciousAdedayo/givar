"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Gift, MessageCircle, LifeBuoy, History, House, LayoutDashboard, Trophy, User, Wallet } from "lucide-react";

const items = [["/", "Home", House], ["/giveaways", "Giveaways", Gift], ["/contests", "Contests", Trophy], ["/wallet", "Wallet", Wallet], ["/transactions", "Transactions", History], ["/chats", "Chats", MessageCircle], ["/notifications", "Notifications", Bell], ["/help", "Help", LifeBuoy], ["/account", "Profile", User]] as const;
export default function SidebarNav({ signedIn, admin, unread = 0, chats = 0 }: { signedIn: boolean; admin: boolean; unread?: number; chats?: number }) {
  const p = usePathname();
  const list = [...(signedIn ? items : items.slice(0, 3)), ...(admin ? ([["/admin", "Admin", LayoutDashboard]] as const) : [])];
  return (
    <nav aria-label="Main" className="space-y-1">
      {list.map(([href, label, Icon]) => {
        const on = href === "/" ? p === "/" : p.startsWith(href);
        return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${on ? "grad-soft font-semibold" : "text-[var(--mut)] hover:bg-[var(--line)] hover:text-[var(--fg)]"}`}><Icon size={19} aria-hidden />{label}{href === "/chats" && chats > 0 && <span className="grad-brand ml-auto rounded-full px-2 py-0.5 text-xs font-bold">{chats > 99 ? "99+" : chats}</span>}{href === "/notifications" && unread > 0 && <span className="grad-brand ml-auto rounded-full px-2 py-0.5 text-xs font-bold">{unread > 99 ? "99+" : unread}</span>}</Link>;
      })}
    </nav>
  );
}
