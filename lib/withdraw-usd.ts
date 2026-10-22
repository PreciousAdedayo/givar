import { z } from "zod";
export const USD_MIN = 2000, USD_MAX = 500000; // $20 to $5,000 per request, in cents. Adjust to your provider and risk rules.
const name = z.string().trim().min(2).max(80);
export const UsdDetails = z.discriminatedUnion("method", [
  z.object({ method: z.literal("ACH"), accountName: name, bankName: name, routingNumber: z.string().regex(/^\d{9}$/, "A US routing number is 9 digits"), accountNumber: z.string().regex(/^\d{4,17}$/, "Account number is 4 to 17 digits"), accountType: z.enum(["checking", "savings"]) }),
  z.object({ method: z.literal("WIRE"), accountName: name, bankName: name, country: z.string().regex(/^[A-Za-z]{2}$/, "Use a 2-letter country code"), accountNumber: z.string().regex(/^[A-Za-z0-9 ]{8,34}$/, "Enter the IBAN or account number"), swift: z.string().regex(/^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/, "SWIFT/BIC is 8 or 11 characters") }),
  z.object({ method: z.literal("NG_DOM"), accountName: name, bankName: name, accountNumber: z.string().regex(/^\d{10}$/, "Account number is 10 digits") }),
]);
export type UsdDetails = z.infer<typeof UsdDetails>;
/** Hides all but the last 4 characters of an account number, for receipts and lists. */
export const maskAcct = (s?: string) => (s ? `••••${s.replace(/\s/g, "").slice(-4)}` : "");
