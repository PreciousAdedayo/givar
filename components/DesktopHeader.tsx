import Link from "next/link";
import { getSession } from "@/lib/session";
import Avatar from "./Avatar";
import ClaimByCode from "./ClaimByCode";
import ThemeToggle from "./ThemeToggle";
import BellSlot from "./BellSlot";
import ChatSlot from "./ChatSlot";
/** Top strip on desktop: claim-by-code is always one click away. */
export default async function DesktopHeader() {
  const s = await getSession();
  return (
    <div className="hidden px-8 pt-6 lg:block"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <div className="w-full max-w-md"><ClaimByCode /></div>
      <div className="flex items-center gap-3"><ChatSlot /><BellSlot /><ThemeToggle />{s ? <Link href="/account" aria-label="Your profile"><Avatar name={s.user.name} size={40} /></Link> : <Link href="/auth" className="bg-lime-givar rounded-full px-5 py-2 text-sm font-semibold">Sign in</Link>}</div>
    </div></div>
  );
}
