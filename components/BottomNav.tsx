"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, House, Plus, Trophy, User } from "lucide-react";

const items = [["/", "Home", House], ["/giveaways", "Giveaways", Gift], ["/create", "Create", Plus], ["/contests", "Contests", Trophy], ["/account", "Me", User]] as const;
export default function BottomNav() {
  const p = usePathname();
  if (p.startsWith("/auth")) return null;
  return (
    <>
    <div className="h-24 lg:hidden" aria-hidden />
    <nav aria-label="Main" className="glass fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-x-0 border-b-0 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      {items.map(([href, label, Icon]) => {
        const on = href === "/" ? p === "/" : p.startsWith(href);
        if (href === "/create") return <Link key={href} href={href} aria-label="Create a giveaway" className="bg-lime-givar shadow-glow -mt-6 grid h-14 w-14 place-items-center rounded-full"><Icon size={26} aria-hidden /></Link>;
        return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex w-16 flex-col items-center gap-0.5 py-1 text-[11px] ${on ? "font-semibold text-lime-givar" : "text-[var(--mut)]"}`}><Icon size={22} aria-hidden />{label}</Link>;
      })}
    </nav>
    </>
  );
}
