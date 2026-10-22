import { describe, expect, it } from "vitest";
import { base32, makeBackupCodes, totp, unbase32, useBackupCode, verifyTotp } from "@/lib/totp";

const secret = base32(Buffer.from("12345678901234567890")); // the RFC 6238 test key
describe("TOTP", () => {
  it("matches the official RFC 6238 test vectors", () => {
    expect(totp(secret, 59_000, 8)).toBe("94287082"); expect(totp(secret, 1_111_111_109_000, 8)).toBe("07081804"); expect(totp(secret, 2_000_000_000_000, 8)).toBe("69279037");
  });
  it("round-trips base32", () => { const b = Buffer.from([1, 2, 3, 250, 251, 252, 7]); expect(unbase32(base32(b)).equals(b)).toBe(true); });
  it("accepts the current code and one step of clock drift, rejects the rest", () => {
    const now = 1_700_000_000_000, c = totp(secret, now);
    expect(verifyTotp(secret, c, now)).toBe(true); expect(verifyTotp(secret, c, now + 30_000)).toBe(true); expect(verifyTotp(secret, c, now + 120_000)).toBe(false);
    expect(verifyTotp(secret, "000000", now)).toBe(false); expect(verifyTotp(secret, "12345", now)).toBe(false); expect(verifyTotp(secret, "abcdef", now)).toBe(false);
  });
});
describe("backup codes", () => {
  it("each code works exactly once", () => {
    const { codes, stored } = makeBackupCodes(3);
    const after = useBackupCode(stored, codes[1]); expect(after).not.toBeNull(); expect(JSON.parse(after!)).toHaveLength(2);
    expect(useBackupCode(after, codes[1])).toBeNull(); expect(useBackupCode(after, codes[0])).not.toBeNull(); expect(useBackupCode(stored, "nope-nope")).toBeNull(); expect(useBackupCode(null, codes[0])).toBeNull();
  });
  it("ignores case and the dash", () => { const { codes, stored } = makeBackupCodes(1); expect(useBackupCode(stored, codes[0].toUpperCase().replace("-", " "))).not.toBeNull(); });
});
