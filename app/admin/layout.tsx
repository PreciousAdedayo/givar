import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";
import { supportNeedsReply } from "@/lib/chat";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
const Logo = () => <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>;

/** The admin area has its OWN frame. It never shows the public website's sidebar, header or bottom bar. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdmin();
  const pendingKyc = await prisma.kycSubmission.count({ where: { status: "PENDING" } }).catch(() => 0);
  const support = await supportNeedsReply().catch(() => 0);
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--card)] p-5 backdrop-blur lg:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2 text-xl font-bold"><Logo />Givar <span className="grad-brand rounded-md px-1.5 py-0.5 text-xs">Admin</span></Link>
        <AdminNav pendingKyc={pendingKyc} support={support} />
        <div className="mt-auto space-y-3">
          <Link href="/" className="glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"><ExternalLink size={16} aria-hidden />View website</Link>
          <p className="truncate text-center text-xs text-[var(--mut)]">Signed in as {s.user.email ?? s.user.name}</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2 text-lg font-bold"><Logo />Admin</Link>
          <span className="flex items-center gap-2"><Link href="/" className="glass rounded-full px-3 py-2 text-xs font-semibold">Website</Link><ThemeToggle /></span>
        </header>
        <div className="pt-3 lg:hidden"><AdminNav pendingKyc={pendingKyc} support={support} row /></div>
        <main className="page max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
