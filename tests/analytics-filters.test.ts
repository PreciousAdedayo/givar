import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseFilters } from "@/lib/analytics-filters";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-10T15:30:00Z")); });
afterEach(() => vi.useRealTimers());

describe("parseFilters", () => {
  it("defaults to the last 14 days, grouped by day, ending today", () => {
    const f = parseFilters({});
    expect(f.range).toBe("14"); expect(f.gran).toBe("day"); expect(f.fromStr).toBe("2026-09-27"); expect(f.toStr).toBe("2026-10-10");
  });
  it("supports preset ranges and picks a sensible grouping", () => {
    expect(parseFilters({ r: "7" }).fromStr).toBe("2026-10-04");
    expect(parseFilters({ r: "90" }).gran).toBe("week");
    expect(parseFilters({ r: "365" }).gran).toBe("month");
  });
  it("supports month-to-date and custom ranges (end date is inclusive)", () => {
    expect(parseFilters({ r: "mtd" }).fromStr).toBe("2026-10-01");
    const c = parseFilters({ r: "custom", from: "2026-08-01", to: "2026-08-31" });
    expect(c.fromStr).toBe("2026-08-01"); expect(c.toStr).toBe("2026-08-31"); expect(c.to.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
  it("falls back safely on garbage or backwards dates", () => {
    expect(parseFilters({ r: "custom", from: "nope", to: "2026-08-31" }).range).toBe("14");
    expect(parseFilters({ r: "custom", from: "2026-09-01", to: "2026-08-01" }).range).toBe("14");
    expect(parseFilters({ r: "'; DROP TABLE users;--" }).range).toBe("14");
  });
  it("caps any range at one year", () => {
    const f = parseFilters({ r: "custom", from: "2020-01-01", to: "2026-10-10" });
    expect((f.to.getTime() - f.from.getTime()) / 864e5).toBeLessThanOrEqual(366);
  });
  it("only accepts known grouping and currency values", () => {
    expect(parseFilters({ g: "year" }).gran).toBe("day"); expect(parseFilters({ g: "week" }).gran).toBe("week");
    expect(parseFilters({ currency: "EUR" }).currency).toBeUndefined(); expect(parseFilters({ currency: "USD" }).currency).toBe("USD");
  });
});
