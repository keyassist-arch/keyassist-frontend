import { coerceNumber } from "@/lib/coerce-number";

const DEFAULT_LOCALE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_STORE_LOCALE
    ? process.env.NEXT_PUBLIC_STORE_LOCALE
    : "en-US";

/** Format API decimal string/number for display using Intl (BCP 47 locale). */
export function formatApiMoney(amount: unknown, currencyCode: string | undefined, locale = DEFAULT_LOCALE): string {
  const code = (currencyCode || "USD").toUpperCase();
  const n = coerceNumber(amount, NaN);
  if (!Number.isFinite(n)) return `${code} —`;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(n);
  } catch {
    return `${code} ${n.toFixed(2)}`;
  }
}

/** True when retailer list price and sale price are the same (no fake discount). */
export function pricesAreEqual(a: unknown, b: unknown): boolean {
  const na = coerceNumber(a, NaN);
  const nb = coerceNumber(b, NaN);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return Math.abs(na - nb) < 0.005;
}
