export const toMinor = (n: number) => Math.round(n * 100);
export const fmt = (minor: number, c: "NGN" | "USD" = "NGN") =>
  new Intl.NumberFormat(c === "NGN" ? "en-NG" : "en-US", { style: "currency", currency: c }).format(minor / 100);
