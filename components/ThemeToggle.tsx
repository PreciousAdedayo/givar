"use client";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle() {
  function toggle() { const dark = document.documentElement.classList.toggle("dark"); try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {} }
  return <button onClick={toggle} aria-label="Switch between light and dark mode" className="glass grid h-10 w-10 place-items-center rounded-full"><Sun size={18} className="hidden dark:block" aria-hidden /><Moon size={18} className="dark:hidden" aria-hidden /></button>;
}
