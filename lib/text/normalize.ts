/** Clean layout artifacts while preserving the line structure used by the X-Ray view. */
export function normalizeText(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Aggressive normalization for comparisons: keeps `.`, `+` and `#` so tokens
 * such as `c++`, `ci/cd` and `.net` survive as distinguishable skills.
 */
export function normalizeForMatch(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.+#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const matches = text.match(/\b[\w+#.@'-]+\b/g);
  return matches ? matches.length : 0;
}

export function truncate(text: string, max = 150): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
