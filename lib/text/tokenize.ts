import { STOPWORDS } from "../constants";
import { normalizeForMatch } from "./normalize";

export function tokenize(text: string, keepStopwords = false): string[] {
  return normalizeForMatch(text)
    .split(/\s+/)
    // Trailing periods come from sentence punctuation, not from skills like `.net`.
    .map((token) => token.replace(/[.]+$/, ""))
    .filter((token) => token.length > 1 && (keepStopwords || !STOPWORDS.has(token)));
}

export function bigrams(tokens: string[]): string[] {
  const result: string[] = [];
  for (let index = 0; index < tokens.length - 1; index += 1) {
    result.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  return result;
}

/** Lines are a good proxy for JD bullets and resume sections. */
export function splitLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-•*●▪◦]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const pattern = new RegExp(`(?:^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`, "g");
  return (haystack.match(pattern) ?? []).length;
}
