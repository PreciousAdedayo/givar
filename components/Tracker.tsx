"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function source() {
  const u = new URLSearchParams(location.search).get("utm_source"); if (u) return u.toLowerCase();
  let h = ""; try { h = new URL(document.referrer).hostname; } catch {}
  if (!h || h.endsWith(location.hostname)) return "direct";
  if (/wa\.me|whatsapp/.test(h)) return "whatsapp"; if (/t\.co|twitter|x\.com/.test(h)) return "x";
  if (/t\.me|telegram/.test(h)) return "telegram"; if (/google/.test(h)) return "google"; return "other";
}
export default function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    try {
      let vid = localStorage.getItem("givar_vid"); if (!vid) { vid = crypto.randomUUID(); localStorage.setItem("givar_vid", vid); }
      navigator.sendBeacon("/api/track", new Blob([JSON.stringify({ path, visitorId: vid, source: source() })], { type: "application/json" }));
    } catch {}
  }, [path]);
  return null;
}
