import { describe, it, expect } from "vitest";
import { toMinor, fmt } from "@/lib/money";
import { newClaimCode, newClaimSlug } from "@/lib/codes";
import { hashPassword, verifyPassword } from "@/lib/password";
import { dailySeries } from "@/lib/series";

describe("money", () => {
  it("converts to minor units without float drift", () => { expect(toMinor(10.1)).toBe(1010); expect(toMinor(0.29)).toBe(29); expect(toMinor(1234.56)).toBe(123456); });
  it("formats currency", () => { expect(fmt(1000000)).toContain("10,000"); expect(fmt(500, "USD")).toContain("5.00"); });
});
describe("codes", () => {
  it("claim codes look right and avoid look-alike characters", () => { for (let i = 0; i < 200; i++) expect(newClaimCode()).toMatch(/^GV-[A-HJKMNP-Z2-9]{6}$/); });
  it("slugs are 9 chars and effectively unique", () => { const s = new Set(Array.from({ length: 1000 }, newClaimSlug)); expect(s.size).toBe(1000); expect([...s][0]).toHaveLength(9); });
});
describe("password", () => {
  it("verifies the right password only", () => { const h = hashPassword("correct horse"); expect(verifyPassword("correct horse", h)).toBe(true); expect(verifyPassword("wrong", h)).toBe(false); });
  it("rejects malformed hashes", () => { expect(verifyPassword("x", "")).toBe(false); expect(verifyPassword("x", "nocolon")).toBe(false); });
  it("salts: same password gives different hashes", () => { expect(hashPassword("a1234567")).not.toBe(hashPassword("a1234567")); });
});
describe("dailySeries", () => {
  it("buckets values into days", () => {
    const rows = dailySeries(3, { a: [{ at: new Date() }, { at: new Date(), v: 4 }] });
    expect(rows).toHaveLength(3); expect(rows[2].a).toBe(5); expect(rows[0].a).toBe(0);
  });
});

import { PERSONAL_RE, newPersonalCode, splitAmounts } from "@/lib/codes";
describe("personal codes", () => {
  it("look like GV-XXXX-XXXX and are practically unique", () => { const s = new Set(Array.from({ length: 2000 }, newPersonalCode)); expect(s.size).toBe(2000); for (const c of s) expect(PERSONAL_RE.test(c)).toBe(true); });
  it("don't match the other code formats", () => { expect(PERSONAL_RE.test("GV-8X2K91")).toBe(false); expect(PERSONAL_RE.test("gv-8x2k-91ab")).toBe(false); });
});
describe("splitAmounts", () => {
  it("equal shares add up exactly, even when they don't divide evenly", () => { const a = splitAmounts(10001, 3, "EQUAL"); expect(a.reduce((x, y) => x + y, 0)).toBe(10001); expect(Math.max(...a) - Math.min(...a)).toBeLessThanOrEqual(1); });
  it("random shares add up exactly and are never zero", () => { for (let i = 0; i < 200; i++) { const a = splitAmounts(5000, 7, "RANDOM"); expect(a.reduce((x, y) => x + y, 0)).toBe(5000); expect(Math.min(...a)).toBeGreaterThanOrEqual(1); expect(a).toHaveLength(7); } });
  it("handles one person and the smallest possible amounts", () => { expect(splitAmounts(777, 1, "RANDOM")).toEqual([777]); expect(splitAmounts(5, 5, "RANDOM")).toEqual([1, 1, 1, 1, 1]); });
});
