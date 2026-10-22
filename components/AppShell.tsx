"use client";
import { usePathname } from "next/navigation";
/** Sidebar + header on desktop for every page except the sign-in screen, which gets the full width. */
export default function AppShell({ sidebar, header, children }: { sidebar: React.ReactNode; header: React.ReactNode; children: React.ReactNode }) {
  const bare = usePathname().startsWith("/auth");
  if (bare) return <>{children}</>;
  return <div className="lg:flex">{sidebar}<div className="min-w-0 flex-1">{header}{children}</div></div>;
}
