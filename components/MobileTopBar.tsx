import Link from "next/link";
import { getSession } from "@/lib/session";
import BellSlot from "./BellSlot";
import ChatSlot from "./ChatSlot";
import MobileBarGate from "./MobileBarGate";

/** A slim top bar on phones for every page except Home (which has its own): logo on the left, chat and bell on the right. */
export default async function MobileTopBar() {
  const s = await getSession();
  return (
    <MobileBarGate>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/85 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold"><svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="#D8F24A" strokeWidth="2" aria-hidden><path d="M16 2 30 16 16 30 2 16Z" /><path d="M16 9 23 16 16 23 9 16Z" /></svg>Givar</Link>
        {s ? <span className="flex items-center gap-2"><ChatSlot /><BellSlot /></span> : <Link href="/auth" className="bg-lime-givar rounded-full px-5 py-2 text-sm font-semibold">Sign in</Link>}
      </div>
    </MobileBarGate>
  );
}
