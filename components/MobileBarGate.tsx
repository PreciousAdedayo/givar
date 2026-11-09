"use client";
import { usePathname } from "next/navigation";
/** Hides the mobile top bar where a page already has its own header. */
export default function MobileBarGate({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  return p === "/" || p.startsWith("/auth") ? null : <>{children}</>;
}
