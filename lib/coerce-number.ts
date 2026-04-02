/** API JSON often returns numeric fields as strings; normalize for math / .toFixed. */
export function coerceNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
