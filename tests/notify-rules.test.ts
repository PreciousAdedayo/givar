import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, esc, safeHref, shouldEmail } from "@/lib/notify-rules";

describe("shouldEmail", () => {
  it("follows the user's choices for money, giveaway, contest and news emails", () => {
    expect(shouldEmail("DEPOSIT", DEFAULT_PREFS)).toBe(true);
    expect(shouldEmail("WITHDRAWAL", { ...DEFAULT_PREFS, emailMoney: false })).toBe(false);
    expect(shouldEmail("CLAIM", { ...DEFAULT_PREFS, emailMoney: false })).toBe(false);
    expect(shouldEmail("GIVEAWAY", DEFAULT_PREFS)).toBe(false);
    expect(shouldEmail("GIVEAWAY", { ...DEFAULT_PREFS, emailGiveaways: true })).toBe(true);
    expect(shouldEmail("CONTEST", { ...DEFAULT_PREFS, emailContests: false })).toBe(false);
    expect(shouldEmail("SYSTEM", DEFAULT_PREFS)).toBe(false);
  });
  it("always emails KYC and security notices, even if everything is switched off", () => {
    const off = { emailMoney: false, emailGiveaways: false, emailContests: false, emailNews: false };
    expect(shouldEmail("KYC", off)).toBe(true); expect(shouldEmail("SECURITY", off)).toBe(true);
  });
});
describe("safeHref", () => {
  it("allows same-site paths", () => { expect(safeHref("/wallet")).toBe("/wallet"); expect(safeHref("/c/ABC123?x=1")).toBe("/c/ABC123?x=1"); });
  it("blocks other sites and tricks (open-redirect protection)", () => {
    for (const bad of ["https://evil.example", "//evil.example", "javascript:alert(1)", "/\\evil.example", "evil.example", "", null, undefined]) expect(safeHref(bad as string | null | undefined)).toBe("/notifications");
  });
});
describe("esc", () => { it("escapes HTML so a title can't inject markup into an email", () => { expect(esc('<img src=x onerror="a()">&')).toBe("&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;"); }); });
