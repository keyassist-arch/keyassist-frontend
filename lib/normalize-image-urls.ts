/**
 * Some scraped sources (e.g. eBay's schema.org ImageObject listings) return
 * `images` as an array of `{ url, "@type", width, height }` objects instead
 * of plain URL strings, even though the API type declares `string[]`. This
 * normalizes any such entries so callers always get real, non-empty URLs.
 */
export function normalizeImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        if (typeof obj.url === "string") return obj.url.trim();
        if (typeof obj.src === "string") return obj.src.trim();
      }
      return "";
    })
    .filter((url): url is string => url.length > 0);
}
