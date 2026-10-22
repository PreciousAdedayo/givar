import { describe, expect, it } from "vitest";
import { buildReceipt, plainMoney } from "@/lib/receipt";

describe("receipt PDF", () => {
  it("produces a real PDF, even with symbols the PDF font can't print", async () => {
    const bytes = await buildReceipt({ reference: "wd_abc-123", label: "Withdrawal", status: "Pending", amount: 1234500, currency: "NGN", credit: false, at: new Date("2026-10-04T16:12:00Z"), customer: "Ada Obi ₦ 😀", rows: [["Bank", "Wema Bank"], ["Account number", "••••6789"]] });
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-"); expect(bytes.length).toBeGreaterThan(1500);
  });
  it("formats amounts without the naira sign", () => { expect(plainMoney(1000050, "NGN")).toBe("NGN 10,000.50"); expect(plainMoney(500, "USD")).toBe("USD 5.00"); });
});
