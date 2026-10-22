import { notFound } from "next/navigation";
import { getSession } from "./session";

/** Every admin page and action calls this. Non-admins get a 404, not a login hint. */
export async function requireAdmin() {
  const s = await getSession();
  if (s?.user.role !== "ADMIN") notFound();
  return s!;
}
export const PAGE_SIZE = 25;
export const pageNum = (v?: string) => Math.max(1, parseInt(v ?? "1", 10) || 1);
export const dt = (d: Date) => d.toLocaleString("en", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
export function ago(d: Date) {
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
