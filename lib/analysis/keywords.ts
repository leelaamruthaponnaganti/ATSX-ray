import { LIMITS } from "../constants";
import { normalizeForMatch } from "../text/normalize";
import {
  canonicalFor,
  categoryFor,
  displayLabel,
  isGenuineSkillTerm,
  isJunkSkillTerm,
  SYNONYM_GROUPS,
} from "../text/synonyms";
import { bigrams, splitLines, tokenize } from "../text/tokenize";
import type { KeywordSpec } from "../types";

interface Candidate {
  key: string;
  label: string;
  source: string;
  category: "hard" | "soft" | "role";
  known: boolean;
  phrase: boolean;
  rawScore: number;
}

function countIn(text: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = text.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(needle, index + needle.length);
  }
  return count;
}

/**
 * Turn a JD into a ranked list of genuine requirements. Unknown business nouns,
 * company names and boilerplate never become candidates — only curated skills,
 * tools, software and domain competencies are considered.
 */
export function extractKeywords(jobDescription: string): KeywordSpec[] {
  const normalized = normalizeForMatch(jobDescription);
  const lines = splitLines(jobDescription)
    .map(normalizeForMatch)
    .filter((line) => line.length > 3);
  const sentences = lines.length > 0 ? lines : [normalized];
  const header = sentences.slice(0, 3).join(" ");
  const tokens = tokenize(jobDescription);
  const candidates = new Map<string, Candidate>();

  const addCandidate = (raw: string, phrase: boolean) => {
    const rawNormalized = normalizeForMatch(raw);
    if (isJunkSkillTerm(rawNormalized)) return;

    const canonical = canonicalFor(rawNormalized);
    if (!canonical || !isGenuineSkillTerm(canonical)) return;

    const key = canonical;
    const count = countIn(normalized, rawNormalized);
    if (count === 0) return;

    const documentFrequency = sentences.filter((line) => line.includes(rawNormalized)).length;
    const coverage = documentFrequency / sentences.length;
    const headerBonus = header.includes(rawNormalized) ? 1.35 : 1;
    const requirementLine = sentences.some(
      (line) => line.includes(rawNormalized) && /required|must|minimum|preferred|requirement|responsible|you have|we need/.test(line),
    );
    const requirementBonus = requirementLine ? 1.22 : 1;
    const knownBonus = 1.4;
    const phraseBonus = phrase ? 1.15 : 1;
    const rawScore =
      (1 + Math.log(count)) *
      (0.5 + 0.5 * coverage) *
      headerBonus *
      requirementBonus *
      knownBonus *
      phraseBonus;

    const previous = candidates.get(key);
    const candidate: Candidate = {
      key,
      label: displayLabel(key),
      source: rawNormalized,
      category: categoryFor(key),
      known: true,
      phrase,
      rawScore,
    };
    if (!previous || rawScore > previous.rawScore) candidates.set(key, candidate);
  };

  // Single-token skills (React, Docker, Excel, ...).
  for (const token of tokens) addCandidate(token, false);

  // Every curated alias and multi-word phrase, including tools such as
  // "CI/CD", "customer service" and "version control".
  for (const aliases of Object.values(SYNONYM_GROUPS)) {
    for (const alias of aliases) {
      if (alias.length < 3) continue;
      const normalizedAlias = normalizeForMatch(alias);
      if (!normalizedAlias || countIn(normalized, normalizedAlias) === 0) continue;
      addCandidate(alias, /\s/.test(normalizedAlias));
    }
  }

  // Bigrams catch legitimate two-word domain phrases not yet in the dictionary.
  for (const phrase of bigrams(tokens)) {
    if (isGenuineSkillTerm(phrase)) addCandidate(phrase, true);
  }

  const usable = [...candidates.values()].filter((candidate) => !isJunkSkillTerm(candidate.key));

  const ranked = usable
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, LIMITS.maxKeywords);

  if (ranked.length === 0) return [];

  const maxScore = ranked[0].rawScore;
  return ranked.map((candidate, index) => ({
    key: candidate.key,
    label: candidate.label,
    source: candidate.source,
    category: candidate.category,
    importance: index < 8 ? "critical" : index < 18 ? "important" : "nice-to-have",
    score: Math.max(0.08, candidate.rawScore / maxScore),
  }));
}
