import { describe, expect, it } from "vitest";
import { isListedAdmin, parseAdminEmails } from "@/lib/admin-list";
describe("ADMIN_EMAILS", () => {
  it("parses a comma list, ignoring spaces, case and blanks", () => { expect(parseAdminEmails(" Me@Example.com, ,other@x.io ,")).toEqual(["me@example.com", "other@x.io"]); expect(parseAdminEmails(undefined)).toEqual([]); expect(parseAdminEmails("")).toEqual([]); });
  it("matches an email case-insensitively and never matches empty input", () => { const l = parseAdminEmails("me@example.com"); expect(isListedAdmin("ME@example.com ", l)).toBe(true); expect(isListedAdmin("evil@example.com", l)).toBe(false); expect(isListedAdmin(null, l)).toBe(false); expect(isListedAdmin("", l)).toBe(false); expect(isListedAdmin("me@example.com", [])).toBe(false); });
});
