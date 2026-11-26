import {
  ACTION_VERB_STARTERS,
  IDEAL_WORD_RANGE,
  LIMITS,
  SECTION_PATTERNS,
  STOPWORDS,
  STRONG_VERBS,
  WEAK_PHRASES,
} from "../constants";
import { countWords, normalizeForMatch, truncate } from "../text/normalize";
import { aliasesFor } from "../text/synonyms";
import { countOccurrences, tokenize } from "../text/tokenize";
import type { BulletAnalysis, ImpactResult, KeywordSpec, StuffingFlag } from "../types";

const METRIC_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:%|percent)/i,
  /\$\s?\d[\d,]*(?:\.\d+)?\s*[kmb]?/i,
  /\b\d[\d,]*\+?\s+(?:\w+\s+){0,3}(?:users|customers|clients|students|teams|projects|requests|transactions|orders|tickets|views|downloads|accounts|people|members|hours|days|minutes|seconds|apps|sites|features|tests|bugs|records|reports|stars|contributors|revenue|savings)\b/i,
  /\b[2-9]x\b/i,
  /\b\d+(?:[.,]\d+)?\s*[kmb]\b/i,
];

const BULLET_PREFIX = /^\s*(?:[-•*●▪◦]|\d+[.)])\s+(.+)$/;
const MAX_BULLETS = 40;

function extractMetrics(text: string): string[] {
  const metrics = new Set<string>();
  for (const pattern of METRIC_PATTERNS) {
    for (const match of text.match(pattern) ?? []) metrics.add(match.trim());
  }
  return [...metrics];
}

function detectBullets(resumeText: string): string[] {
  const lines = resumeText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const line of lines) {
    const prefixed = BULLET_PREFIX.exec(line);
    if (prefixed) {
      bullets.push(prefixed[1].trim());
      continue;
    }
    const firstWord = line.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    if (line.length >= 30 && line.length <= 320 && ACTION_VERB_STARTERS.includes(firstWord)) {
      bullets.push(line);
    }
    if (bullets.length >= MAX_BULLETS) break;
  }
  return bullets.slice(0, MAX_BULLETS);
}

function detectStuffing(resumeText: string, keywords: KeywordSpec[], wordCount: number): StuffingFlag[] {
  const normalized = normalizeForMatch(resumeText);
  const per500 = Math.max(wordCount, 100) / 500;
  const flags: StuffingFlag[] = [];
  const seen = new Set<string>();

  const consider = (label: string, rawNeedle: string) => {
    const needle = normalizeForMatch(rawNeedle);
    if (!needle || needle.length < 4 || STOPWORDS.has(needle) || seen.has(needle)) return;
    const count = countOccurrences(normalized, needle);
    if (count <= LIMITS.stuffingThreshold) return;
    seen.add(needle);
    const density = count / per500;
    flags.push({
      keyword: label,
      count,
      densityPer500: Number(density.toFixed(1)),
      reason: `“${needle}” appears ${count} times (more than ${LIMITS.stuffingThreshold}). Repetition this dense reads as keyword stuffing, not experience.`,
      suggestion: "Keep 2–3 natural mentions and replace extras with concrete outcomes or related terminology.",
    });
  };

  for (const keyword of keywords) {
    let bestCount = 0;
    let bestAlias = keyword.key;
    for (const alias of aliasesFor(keyword.key)) {
      const normalizedAlias = normalizeForMatch(alias);
      const count = countOccurrences(normalized, normalizedAlias);
      if (count > bestCount) {
        bestCount = count;
        bestAlias = normalizedAlias;
      }
    }
    consider(keyword.label, bestAlias);
  }

  // Also flag repeated meaningful JD language that is not in the synonym dictionary.
  const jdVocabulary = new Set(
    tokenize(resumeText)
      .filter((token) => token.length >= 5 && !STOPWORDS.has(token))
      .slice(0, 80),
  );
  for (const token of jdVocabulary) consider(token.replace(/\b\w/g, (letter) => letter.toUpperCase()), token);

  return flags.sort((a, b) => b.count - a.count || b.densityPer500 - a.densityPer500);
}

/** Bullet quality, stuffing detection, section checklist and word-count health. */
export function analyzeImpact(resumeText: string, keywords: KeywordSpec[]): ImpactResult {
  const wordCount = countWords(resumeText);
  const rawBullets = detectBullets(resumeText);
  const openerCounts = new Map<string, number>();
  for (const bullet of rawBullets) {
    const opener = normalizeForMatch(bullet).split(/\s+/).slice(0, 3).join(" ");
    openerCounts.set(opener, (openerCounts.get(opener) ?? 0) + 1);
  }

  const bullets: BulletAnalysis[] = rawBullets.map((text, index) => {
    const lower = text.toLowerCase();
    const metrics = extractMetrics(text);
    const firstWord = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    const strongVerb = STRONG_VERBS.includes(firstWord) ? firstWord : null;
    const weakPhrase = WEAK_PHRASES.find((phrase) => lower.includes(phrase)) ?? null;
    const opener = normalizeForMatch(text).split(/\s+/).slice(0, 3).join(" ");
    const repeated = (openerCounts.get(opener) ?? 0) >= 3;
    const hasMetric = metrics.length > 0;

    let rating: BulletAnalysis["rating"] = "medium";
    let tip: string | undefined;
    if (hasMetric && strongVerb && !weakPhrase) {
      rating = "strong";
    } else if (weakPhrase || repeated || (!hasMetric && !strongVerb)) {
      rating = "weak";
      tip = hasMetric
        ? "The number is good — swap the opening for a strong action verb."
        : weakPhrase
          ? `Replace “${weakPhrase}” with a verb such as “delivered” or “improved”.`
          : repeated
            ? "Vary the phrasing — three bullets start the same way."
            : "Add a measurable result (%, $, count) and lead with an action verb.";
    } else {
      tip = hasMetric ? "Strong evidence. Add an action verb to make ownership explicit." : "Try adding a measurable outcome.";
    }

    return { text: truncate(text, 260), index: index + 1, hasMetric, metrics, strongVerb, weakPhrase, repeated, rating, tip };
  });

  const sections = SECTION_PATTERNS.map(({ label, pattern, detail }) => ({
    label,
    present: pattern.test(resumeText),
    detail: pattern.test(resumeText) ? detail : `${label} could not be detected.`,
  }));

  const wordCountStatus: ImpactResult["wordCountStatus"] =
    wordCount < IDEAL_WORD_RANGE.min ? "low" : wordCount > IDEAL_WORD_RANGE.max ? "high" : "ideal";
  const stuffing = detectStuffing(resumeText, keywords, wordCount);
  const metricBulletCount = bullets.filter((bullet) => bullet.hasMetric).length;

  const suggestions: string[] = [];
  if (metricBulletCount < 2) suggestions.push("Add at least 2 quantified achievements (%, $, or counts) to your experience bullets.");
  if (bullets.some((bullet) => bullet.rating === "weak")) suggestions.push("Rewrite weak bullets using the action-verb hints shown above.");
  if (stuffing.length > 0) suggestions.push("Reduce repeated keywords — one clear mention per section is enough.");
  const missingSections = sections.filter((section) => !section.present).map((section) => section.label);
  if (missingSections.length > 0) suggestions.push(`Add missing sections: ${missingSections.join(", ")}.`);
  if (wordCountStatus === "low") suggestions.push(`Resume is ${wordCount} words; aim for ${IDEAL_WORD_RANGE.min}–${IDEAL_WORD_RANGE.max} words.`);
  if (wordCountStatus === "high") suggestions.push(`Resume is ${wordCount} words; tighten it toward ${IDEAL_WORD_RANGE.min}–${IDEAL_WORD_RANGE.max} words.`);
  if (suggestions.length === 0) suggestions.push("Impact looks solid — keep bullets metric-led and tailored per role.");

  return { bullets, stuffing, sections, wordCount, wordCountStatus, metricBulletCount, suggestions };
}
