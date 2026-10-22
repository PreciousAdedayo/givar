/** Pure rules (no database), so they can be unit-tested. */
export type NType = "DEPOSIT" | "WITHDRAWAL" | "CLAIM" | "GIVEAWAY" | "CONTEST" | "KYC" | "SECURITY" | "SYSTEM" | "SUPPORT";
export type EmailPrefs = { emailMoney: boolean; emailGiveaways: boolean; emailContests: boolean; emailNews: boolean };
export const DEFAULT_PREFS: EmailPrefs = { emailMoney: true, emailGiveaways: false, emailContests: true, emailNews: false };
/** Account-safety emails can't be switched off. */
const ALWAYS: NType[] = ["KYC", "SECURITY", "SUPPORT"];

export function shouldEmail(type: NType, prefs: EmailPrefs): boolean {
  if (ALWAYS.includes(type)) return true;
  switch (type) {
    case "DEPOSIT": case "WITHDRAWAL": case "CLAIM": return prefs.emailMoney;
    case "GIVEAWAY": return prefs.emailGiveaways;
    case "CONTEST": return prefs.emailContests;
    case "SYSTEM": return prefs.emailNews;
    default: return false;
  }
}
/** Only same-site paths are allowed as a notification link: blocks open redirects. */
export function safeHref(href?: string | null): string {
  return href && href.startsWith("/") && !href.startsWith("//") && !href.includes("\\") ? href : "/notifications";
}
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
