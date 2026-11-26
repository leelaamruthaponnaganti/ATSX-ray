import { escapeRegExp, normalizeForMatch, truncate } from "../text/normalize";
import { similarity, stemsMatch } from "../text/fuzzy";
import { aliasesFor } from "../text/synonyms";
import { tokenize } from "../text/tokenize";
import { PRACTICAL_SECTIONS, sectionText, splitResumeSections, type ResumeSectionName } from "./sections";
import type { KeywordSpec, MissingKeyword, SkillContext, SkillMatch } from "../types";

export interface SkillMatchResult {
  matched: SkillMatch[];
  semantic: SkillMatch[];
  missing: MissingKeyword[];
}

interface SectionIndex {
  name: ResumeSectionName;
  text: string;
  normalized: string;
}

function findOccurrence(normalizedText: string, aliases: string[]): { alias: string; count: number } | null {
  let best: { alias: string; count: number } | null = null;
  for (const alias of aliases) {
    if (!alias) continue;
    const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(alias)}(?:$|[^a-z0-9])`, "g");
    const count = (normalizedText.match(pattern) ?? []).length;
    if (count > 0 && (!best || count > best.count)) best = { alias, count };
  }
  return best;
}

function findEvidence(rawText: string, needle: string): string | undefined {
  const escaped = escapeRegExp(needle).replace(/\\?\s+/g, "\\s+");
  try {
    const match = new RegExp(escaped, "i").exec(rawText);
    if (match) {
      const start = Math.max(0, match.index - 55);
      return truncate(rawText.slice(start, match.index + needle.length + 80), 190);
    }
  } catch {
    // fall through to the loose line lookup
  }
  const token = needle.split(/\s+/)[0]?.replace(/[^a-z0-9+#.]/gi, "");
  const line = rawText.split(/\n/).find((candidate) => candidate.toLowerCase().includes(token?.toLowerCase() ?? ""));
  return line ? truncate(line, 190) : undefined;
}

function missingReason(keyword: KeywordSpec): string {
  if (keyword.importance === "critical") {
    return keyword.category === "soft"
      ? "Important role-behaviour signal is absent from the resume."
      : "Must-have requirement from the job description was not found.";
  }
  if (keyword.category === "soft") return "Related collaboration or ownership signal could be added.";
  return "Related skill or terminology was not detected.";
}

function buildSectionIndex(resumeText: string): SectionIndex[] {
  const sections = splitResumeSections(resumeText);
  const index: SectionIndex[] = [];
  const sectionOrder: ResumeSectionName[] = [
    "experience",
    "projects",
    "achievements",
    "hackathons",
    "coursework",
    "skills",
    "personalSkills",
    "summary",
    "education",
    "certifications",
    "other",
  ];
  for (const name of sectionOrder) {
    const text = sectionText(sections, [name]);
    if (text) index.push({ name, text, normalized: normalizeForMatch(text) });
  }
  return index;
}

function locate(aliases: string[], sectionIndex: SectionIndex[]): { context: SkillContext; proof: boolean; text: string } {
  for (const section of sectionIndex) {
    if (findOccurrence(section.normalized, aliases)) {
      const proof = section.name === "experience" || PRACTICAL_SECTIONS.has(section.name);
      return { context: section.name, proof, text: section.text };
    }
  }
  return { context: "none", proof: false, text: "" };
}

function displayAlias(normalizedAlias: string, keyword: KeywordSpec): string {
  return aliasesFor(keyword.key).find((alias) => normalizeForMatch(alias) === normalizedAlias) ?? normalizedAlias;
}

/** Exact + synonym + context-aware matching against the extracted resume text. */
export function matchSkills(keywords: KeywordSpec[], resumeText: string): SkillMatchResult {
  const normalizedResume = normalizeForMatch(resumeText);
  const resumeTokens = tokenize(resumeText, true).filter((token) => token.length >= 4);
  const sectionIndex = buildSectionIndex(resumeText);
  const matched: SkillMatch[] = [];
  const semantic: SkillMatch[] = [];
  const missing: MissingKeyword[] = [];

  for (const keyword of keywords) {
    const aliases = aliasesFor(keyword.key).map(normalizeForMatch).filter(Boolean);
    const occurrence = findOccurrence(normalizedResume, aliases);

    if (occurrence) {
      const jdTerm = keyword.source?.trim() || keyword.label;
      const exactNames = new Set([normalizeForMatch(jdTerm)]);
      const isExact = exactNames.has(occurrence.alias);
      const location = locate([occurrence.alias], sectionIndex);
      const item: SkillMatch = {
        keyword: jdTerm,
        canonical: keyword.key,
        category: keyword.category,
        importance: keyword.importance,
        match: isExact ? "exact" : "semantic",
        confidence: isExact ? 1 : 0.82,
        context: location.context,
        contextProof: location.proof,
        evidence: findEvidence(location.text || resumeText, occurrence.alias),
        note: isExact
          ? location.proof
            ? "Exact term found inside experience, project or practical evidence."
            : "Exact term found, but not inside experience or project evidence."
          : `Matched “${jdTerm}” via “${displayAlias(occurrence.alias, keyword)}”.`,
      };
      (isExact ? matched : semantic).push(item);
      continue;
    }

    let bestToken = "";
    let bestSimilarity = 0;
    for (const alias of aliases) {
      if (alias.includes(" ") || alias.length < 4) continue;
      for (const token of resumeTokens) {
        const score = stemsMatch(alias, token) ? 0.86 : similarity(alias, token);
        if (score > bestSimilarity) {
          bestSimilarity = score;
          bestToken = token;
        }
      }
    }

    if (bestToken && bestSimilarity >= 0.82) {
      const location = locate([bestToken], sectionIndex);
      semantic.push({
        keyword: keyword.source?.trim() || keyword.label,
        canonical: keyword.key,
        category: keyword.category,
        importance: keyword.importance,
        match: "partial",
        confidence: Math.min(0.72, 0.5 + (bestSimilarity - 0.82) * 1.6),
        context: location.context,
        contextProof: location.proof,
        evidence: findEvidence(location.text || resumeText, bestToken),
        note: `Matched “${keyword.source?.trim() || keyword.label}” via close variant “${bestToken}”.`,
      });
      continue;
    }

    missing.push({
      keyword: keyword.source?.trim() || keyword.label,
      canonical: keyword.key,
      category: keyword.category,
      importance: keyword.importance,
      score: keyword.score,
      reason: missingReason(keyword),
    });
  }

  const priority = { critical: 0, important: 1, "nice-to-have": 2 };
  const sortable = (item: SkillMatch) =>
    priority[item.importance] - item.confidence / 100 - (item.contextProof ? 0.05 : 0);
  matched.sort((a, b) => sortable(a) - sortable(b));
  semantic.sort((a, b) => sortable(a) - sortable(b));
  missing.sort(
    (a, b) => priority[a.importance] - priority[b.importance] || b.score - a.score,
  );

  return { matched, semantic, missing };
}
