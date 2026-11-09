/**
 * Nike fit rows store `pdpUrl` as `https://www.nike.com/t/{styleColor}`.
 * Those short links render "product no longer available". The live PDP is
 * `/{locale}/t/{slug}-{groupKey}/{styleColor}`.
 */

const STYLE_COLOR = /^[A-Z0-9]{4,8}-\d{3}$/i;
const GROUP_KEY = /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9]{6,12}$/;

export type NikeFitListingInput = {
  sourceUrl: string;
  fitLabel: string;
  styleColor?: string | null;
  storedPdpUrl?: string | null;
};

type RequestedFit = "wide" | "big-kids" | "little-kids" | "baby-toddler" | null;

type ParsedPdp = {
  origin: string;
  locale: string;
  slug: string;
  styleColor: string;
  groupKey: string;
  base: string;
};

function requestedFit(label: string): RequestedFit {
  const key = label.trim().toLowerCase().replace(/\s+/g, " ");
  if (key === "wide") return "wide";
  if (key === "big kids") return "big-kids";
  if (key === "little kids") return "little-kids";
  if (key === "baby/toddler" || key === "baby toddler") return "baby-toddler";
  return null;
}

function currentFit(base: string): RequestedFit {
  if (/-wide$/.test(base)) return "wide";
  if (base.includes("-big-kids")) return "big-kids";
  if (base.includes("-little-kids")) return "little-kids";
  if (base.includes("-baby-toddler")) return "baby-toddler";
  return null;
}

function parseNikePdp(url: string): ParsedPdp | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (!/^www\.nike\.com$/i.test(parsed.hostname)) return null;
  const parts = parsed.pathname.split("/").filter(Boolean);
  const t = parts.indexOf("t");
  if (t < 0 || parts.length < t + 3) return null;
  const slug = parts[t + 1];
  const styleColor = parts[t + 2];
  if (!slug || !STYLE_COLOR.test(styleColor)) return null;
  const segments = slug.split("-");
  const groupKey = segments[segments.length - 1] ?? "";
  if (!GROUP_KEY.test(groupKey)) return null;
  const locale = t > 0 ? `/${parts.slice(0, t).join("/")}` : "";
  return {
    origin: parsed.origin,
    locale,
    slug,
    styleColor,
    groupKey,
    base: segments.slice(0, -1).join("-"),
  };
}

/** `https://www.nike.com/t/HV8150-003` — style code only, no product slug. */
export function isBareNikeStyleUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (!/^www\.nike\.com$/i.test(parsed.hostname)) return false;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const t = parts.indexOf("t");
    return t >= 0 && parts.length === t + 2 && STYLE_COLOR.test(parts[t + 1] ?? "");
  } catch {
    return false;
  }
}

function applyFit(base: string, fit: RequestedFit): string {
  let stem = base.replace(/-wide$/, "");
  stem = stem.replace(/-(?:big-kids|little-kids|baby-toddler)(?=-|$)/, "-mens");
  if (!fit) return stem;
  if (fit === "wide") return `${stem}-wide`;
  if (/-(?:mens|womens|women|men)(?=-|$)/.test(stem)) {
    return stem.replace(/-(?:mens|womens|women|men)(?=-|$)/, `-${fit}`);
  }
  if (stem.endsWith("-shoes")) return stem.replace(/-shoes$/, `-${fit}-shoes`);
  return `${stem}-${fit}`;
}

function buildPdp(parsed: ParsedPdp, fit: RequestedFit, styleColor: string): string {
  const base = applyFit(parsed.base, fit);
  return `${parsed.origin}${parsed.locale}/t/${base}-${parsed.groupKey}/${styleColor}`;
}

function sameListing(a: string, b: string): boolean {
  try {
    const left = new URL(a);
    const right = new URL(b);
    return left.origin === right.origin && left.pathname.replace(/\/$/, "") === right.pathname.replace(/\/$/, "");
  } catch {
    return a.trim() === b.trim();
  }
}

/**
 * URL for a Nike fit option. The fit the shopper is already viewing returns the
 * source PDP. Other fits return a full slug URL, never the bare style-code link.
 */
export function nikeFitListingUrl(input: NikeFitListingInput): string | null {
  const source = input.sourceUrl.trim();
  const parsed = parseNikePdp(source);
  const stored = input.storedPdpUrl?.trim() || "";
  const fit = requestedFit(input.fitLabel);

  if (!parsed) {
    if (stored && !isBareNikeStyleUrl(stored)) return stored;
    return null;
  }

  const active = currentFit(parsed.base);
  if (fit === active) return buildPdp(parsed, active, parsed.styleColor);

  if (stored && !isBareNikeStyleUrl(stored)) return stored;

  const styleColor = (input.styleColor?.trim() || styleFromBare(stored) || "").toUpperCase();
  if (!STYLE_COLOR.test(styleColor)) return null;
  const next = buildPdp(parsed, fit, styleColor);
  if (sameListing(next, source)) return buildPdp(parsed, active, parsed.styleColor);
  return next;
}

function styleFromBare(url: string): string | null {
  if (!url || !isBareNikeStyleUrl(url)) return null;
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

export function isSameNikeListing(a: string, b: string): boolean {
  return sameListing(a, b);
}
