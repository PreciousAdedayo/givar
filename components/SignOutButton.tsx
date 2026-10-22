"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
export default function SignOutButton() {
  return <button onClick={() => signOut({ callbackUrl: "/" })} className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-red-500"><LogOut size={18} aria-hidden />Sign out</button>;
}
