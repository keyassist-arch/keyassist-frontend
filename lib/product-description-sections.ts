/**
 * Splits long API descriptions (e.g. Apple scrapes with "Configurations:") into
 * a short lead + optional structured blocks for the PDP.
 */
export function splitProductDescription(raw: string | null | undefined): {
  summary: string;
  blocks: { title: string; body: string }[];
} {
  if (!raw?.trim()) return { summary: "", blocks: [] };

  const configMatch = raw.match(/\n\s*Configurations:\s*([\s\S]*)/i);
  if (!configMatch) {
    return { summary: raw.trim(), blocks: [] };
  }

  const idx = configMatch.index ?? raw.search(/\n\s*Configurations:\s*/i);
  const summary = raw.slice(0, idx).trim();
  const body = configMatch[1]?.trim() ?? "";
  return {
    summary: summary || raw.trim(),
    blocks: body ? [{ title: "Configurations", body }] : [],
  };
}
