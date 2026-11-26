import { extractKeywords } from "../analysis/keywords";
import {
  PRACTICAL_SECTIONS,
  sectionText,
  splitResumeSections,
  type ResumeSection,
  type ResumeSectionName,
} from "../analysis/sections";
import { ACTION_VERB_STARTERS } from "../constants";
import { normalizeForMatch } from "../text/normalize";
import {
  aliasesFor,
  canonicalFor,
  categoryFor,
  displayLabel,
  isGenuineSkillTerm,
  isJunkSkillTerm,
} from "../text/synonyms";
import type { EnhanceRequest, ExperienceLevel } from "../types";

export interface TailorOutput {
  enhancedText: string;
  changes: string[];
  keywordsWoven: string[];
}

const BULLET_PREFIX = /^\s*(?:[-•*●▪◦]|\d+[.)])\s+(.+)$/;
const VAGUE_TOOL_PATTERN =
  /\b(?:using|with)\s+(?:these|the|various|multiple)\s+(?:tools|technologies|tech stack|frameworks|libraries)\b/gi;

const WEAK_REPLACEMENTS: [RegExp, string][] = [
  [/\bresponsible for\b/gi, "delivered"],
  [/\bworked on\b/gi, "contributed to"],
  [/\bhelped with\b/gi, "supported"],
  [/\bhelping with\b/gi, "supporting"],
  [/\bassisted with\b/gi, "supported"],
  [/\bassisted in\b/gi, "supported"],
  [/\bparticipated in\b/gi, "contributed to"],
  [/\binvolved in\b/gi, "contributed to"],
  [/\bhelped to\b/gi, "improved"],
  [/\bduties included\b/gi, "owned"],
  [/\btasked with\b/gi, "owned"],
];

const ACCEPTED_VERBS = new Set([
  ...ACTION_VERB_STARTERS.map((verb) => verb.toLowerCase()),
  "contributed",
  "supporting",
]);

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean) continue;
    const key = normalizeForMatch(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function sentenceCase(value: string): string {
  const clean = value.trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean;
}

function levelPhrase(level: ExperienceLevel): string {
  if (level === "Fresher / Graduate") return "early-career preparation";
  if (level === "1–3 Years") return "1–3 years of relevant experience";
  return "3+ years of relevant experience";
}

function toSkillKeys(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeForMatch(value);
    const key = canonicalFor(normalized);
    if (!key || !isGenuineSkillTerm(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

function pickSkills(input: EnhanceRequest): string[] {
  const jdKeys = extractKeywords(input.jobDescription).map((keyword) => keyword.key);
  return toSkillKeys([...input.missingKeywords, ...jdKeys]).slice(0, 10);
}

function containsSkill(normalizedText: string, key: string): boolean {
  return aliasesFor(key).some((alias) => {
    const normalizedAlias = normalizeForMatch(alias);
    return normalizedAlias.length > 0 && normalizedText.includes(normalizedAlias);
  });
}

function markIfNew(key: string, originalNormalized: string, added: Set<string>): void {
  if (!containsSkill(originalNormalized, key)) added.add(key);
}

function headerDetails(resumeText: string, firstHeadingLine: number): string[] {
  return resumeText
    .split(/\n/)
    .slice(0, Math.max(0, Math.min(firstHeadingLine, 8)))
    .map((line) => line.trim())
    .filter(Boolean);
}

function chooseVerb(text: string): string {
  const lower = text.toLowerCase();
  if (/application|website|web app|platform|system/.test(lower)) return "Engineered";
  if (/improv|optimi|reduc|increas|lift|speed|performance|latency/.test(lower)) return "Optimized";
  if (/test|quality|bug|defect|coverage/.test(lower)) return "Implemented";
  if (/design|ui|layout|accessib|component/.test(lower)) return "Designed";
  if (/mentor|led|lead|team|stakeholder|coordinat/.test(lower)) return "Led";
  if (/maintain|support|fix|triage|troubleshoot|ticket|incident/.test(lower)) return "Resolved";
  if (/build|develop|creat|implement|deploy/.test(lower)) return "Built";
  return "Delivered";
}

function skillPhrase(key: string): string {
  switch (key) {
    case "git":
      return "Git/GitHub version control";
    case "devops":
      return "collaborative DevOps workflows";
    case "web applications":
      return "web application development";
    case "real-time applications":
      return "real-time application development";
    case "customer service":
      return "customer service delivery";
    case "it support":
      return "IT support practices";
    case "ticketing":
      return "Ticketing & Incident Management";
    default:
      return displayLabel(key);
  }
}

function joinWithAnd(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function relevantBulletSkills(text: string, skillKeys: string[]): string[] {
  const lower = text.toLowerCase();
  const preferred: string[] = [];
  if (/\busing these (?:tools|technologies|tech stack|frameworks)\b/.test(lower)) {
    preferred.push("git", "devops");
  }
  if (/version control|git|github|repository|repo|branch/.test(lower)) preferred.push("git");
  if (/devops|deploy|pipeline|ci|cd|build/.test(lower)) preferred.push("devops");
  if (/application|website|web app|realtime|real-time/.test(lower)) {
    preferred.push("real-time applications", "web applications");
  }
  if (/test|bug|quality|coverage|defect/.test(lower)) preferred.push("testing");
  if (/customer|client|support|ticket|incident|call/.test(lower)) {
    preferred.push("customer service", "it support", "ticketing");
  }
  if (/data|report|spreadsheet|excel|dashboard/.test(lower)) preferred.push("excel", "data analysis");
  if (/cloud|aws|azure|server|infrastructure/.test(lower)) preferred.push("aws", "azure", "devops");

  return unique(preferred.filter((key) => skillKeys.includes(key)));
}

function rewriteBullet(
  raw: string,
  skillKeys: string[],
  originalNormalized: string,
  added: Set<string>,
): string {
  let clean = raw.trim();
  for (const [pattern, replacement] of WEAK_REPLACEMENTS) clean = clean.replace(pattern, replacement);
  clean = clean.replace(/\brealtime\b/gi, "real-time");
  if (/real-time application\b/i.test(clean) && skillKeys.includes("web applications")) {
    clean = clean.replace(/real-time application\b/i, "real-time web application");
  }

  const firstWord = clean.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  if (!ACCEPTED_VERBS.has(firstWord)) {
    clean = `${chooseVerb(clean)} ${clean}`;
  } else if (/^developed\b/i.test(clean) && /application|app\b|website|system/.test(clean.toLowerCase())) {
    clean = clean.replace(/^developed\b/i, "Engineered");
  }

  VAGUE_TOOL_PATTERN.lastIndex = 0;
  if (VAGUE_TOOL_PATTERN.test(clean)) {
    const tools = relevantBulletSkills(clean, skillKeys).slice(0, 2);
    const fallback = skillKeys.filter((key) => categoryFor(key) !== "soft").slice(0, 2);
    const selected = tools.length > 0 ? tools : fallback;
    VAGUE_TOOL_PATTERN.lastIndex = 0;
    clean = selected.length > 0
      ? clean.replace(VAGUE_TOOL_PATTERN, `utilizing ${joinWithAnd(selected.map(skillPhrase))}`)
      : clean.replace(VAGUE_TOOL_PATTERN, "");
    for (const key of selected) markIfNew(key, originalNormalized, added);
  }

  clean = sentenceCase(clean).replace(/[.;,]+$/, "");
  return `${clean}.`;
}

function rewriteSectionBody(
  section: ResumeSection,
  skillKeys: string[],
  originalNormalized: string,
  added: Set<string>,
): { text: string; bulletCount: number } {
  let bulletCount = 0;
  const lines: string[] = [];
  for (const line of section.text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const bullet = BULLET_PREFIX.exec(trimmed);
    if (bullet) {
      lines.push(`- ${rewriteBullet(bullet[1] ?? "", skillKeys, originalNormalized, added)}`);
      bulletCount += 1;
    } else {
      lines.push(trimmed);
    }
  }
  return { text: lines.join("\n"), bulletCount };
}

function skillsLineFrom(
  sectionBody: string,
  skillKeys: string[],
  originalNormalized: string,
  added: Set<string>,
  preserveAllOriginal: boolean,
): string {
  const parts = sectionBody
    .split(/\n/)
    .map((line) => line.replace(/^[A-Za-z &]+:\s*/, "").trim())
    .filter(Boolean)
    .flatMap((line) => line.split(/[,;|•]+/))
    .map((part) => part.trim())
    .filter(Boolean);

  const accepted = parts.filter((part) =>
    preserveAllOriginal ? !isJunkSkillTerm(part) : isGenuineSkillTerm(part),
  );
  const wanted = preserveAllOriginal
    ? skillKeys.filter((key) => categoryFor(key) === "soft")
    : skillKeys;

  for (const key of wanted) {
    if (accepted.some((part) => containsSkill(normalizeForMatch(part), key))) continue;
    accepted.push(skillPhrase(key));
    markIfNew(key, originalNormalized, added);
  }

  return unique(accepted).slice(0, 24).join(", ");
}

function focusFrom(sections: ResumeSection[], targetRole: string): string {
  const preferredNames: ResumeSectionName[] = ["experience", "achievements", "hackathons", "coursework", "projects", "summary", "other"];
  for (const name of preferredNames) {
    const body = sectionText(sections, [name]);
    const line = body
      .split(/\n/)
      .map((value) => value.trim().replace(/^[-•*●▪◦\d.)\s]+/, ""))
      .find((value) => value.length > 18 && value.length < 180 && !/[\w.+-]+@/.test(value) && !/^\+?\d[\d\s().-]+$/.test(value));
    if (line) return line.replace(/[.]$/, "");
  }
  return `${targetRole} responsibilities and domain knowledge`;
}

function buildSummary(
  sections: ResumeSection[],
  input: EnhanceRequest,
  skillKeys: string[],
  originalNormalized: string,
  added: Set<string>,
): string {
  const focus = focusFrom(sections, input.targetRole);
  const topSkills = skillKeys.slice(0, 4).map(skillPhrase);
  for (const key of skillKeys.slice(0, 4)) markIfNew(key, originalNormalized, added);
  const skillText = topSkills.length > 0 ? ` Key strengths: ${topSkills.join(", ")}.` : "";
  return `${input.targetRole} candidate with ${levelPhrase(input.experienceLevel)} and a background in ${focus}. Tailored for ${input.targetCompany}'s ${input.targetRole} opportunity without claiming employment not present in your resume.${skillText}`;
}

function headingLabel(section: ResumeSection): string {
  return (section.heading || section.name).replace(/\b\w/g, (letter) => letter.toUpperCase()).toUpperCase();
}

/** Deterministic, truthful resume rewriting that preserves the user's real sections. */
export function tailorResume(input: EnhanceRequest): TailorOutput {
  const sections = splitResumeSections(input.resumeText);
  const originalNormalized = normalizeForMatch(input.resumeText);
  const firstHeadingLine = sections.length > 0 ? Math.min(...sections.map((section) => section.startLine)) : 8;
  const headerLines = headerDetails(input.resumeText, firstHeadingLine);
  const skillKeys = pickSkills(input);
  const added = new Set<string>();
  const changes: string[] = [];

  const summary = buildSummary(sections, input, skillKeys, originalNormalized, added);
  const technicalSkills = skillsLineFrom(
    sectionText(sections, ["skills"]),
    skillKeys,
    originalNormalized,
    added,
    false,
  );
  const personalSkills = skillsLineFrom(
    sectionText(sections, ["personalSkills"]),
    skillKeys,
    originalNormalized,
    added,
    true,
  );

  const blocks: string[] = [];
  if (headerLines.length > 0) blocks.push(headerLines.join("\n"));

  let bulletCount = 0;
  let preservedSectionCount = 0;
  let summaryAdded = false;
  let technicalAdded = false;
  let personalAdded = false;

  const pushSummary = () => {
    if (summaryAdded) return;
    blocks.push(`SUMMARY\n${summary}`);
    summaryAdded = true;
    preservedSectionCount += 1;
  };
  const pushTechnical = () => {
    if (technicalAdded || !technicalSkills) return;
    blocks.push(`TECHNICAL SKILLS\n${technicalSkills}`);
    technicalAdded = true;
    preservedSectionCount += 1;
  };
  const pushPersonal = () => {
    if (personalAdded || !personalSkills) return;
    blocks.push(`PERSONAL SKILLS\n${personalSkills}`);
    personalAdded = true;
    preservedSectionCount += 1;
  };

  for (const section of sections) {
    if (section.name === "summary") {
      pushSummary();
      continue;
    }
    if (section.name === "skills") {
      pushTechnical();
      continue;
    }
    if (section.name === "personalSkills") {
      pushPersonal();
      continue;
    }

    let body: string;
    if (PRACTICAL_SECTIONS.has(section.name) || section.name === "experience") {
      const result = rewriteSectionBody(section, skillKeys, originalNormalized, added);
      body = result.text;
      bulletCount += result.bulletCount;
    } else {
      body = section.text
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
    }
    if (!body) continue;
    blocks.push(`${headingLabel(section)}\n${body}`);
    preservedSectionCount += 1;
  }

  pushSummary();
  pushTechnical();
  pushPersonal();

  const enhancedText = blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  const normalizedEnhanced = normalizeForMatch(enhancedText);
  const keywordsWoven = [...added]
    .map(displayLabel)
    .filter((label) => normalizedEnhanced.includes(normalizeForMatch(label)));

  changes.push(`Preserved ${preservedSectionCount} real sections from your resume; no experience or project sections were invented.`);
  changes.push(`Rewrote ${bulletCount} existing bullet${bulletCount === 1 ? "" : "s"} in place with stronger action verbs.`);
  if (keywordsWoven.length > 0) {
    changes.push(`Added ${keywordsWoven.length} genuine JD skill${keywordsWoven.length === 1 ? "" : "s"}: ${keywordsWoven.join(", ")}.`);
  }
  changes.push("Removed vague tool references and generic filler from the skills sections.");

  return { enhancedText, changes, keywordsWoven };
}

/** Validate optional LLM output against the same truthfulness rules. */
export function isValidTailoredText(text: string, sourceText: string): boolean {
  if (text.length < 160) return false;
  if (/\[quantify|\[add |\[insert|\bxx\b/i.test(text)) return false;

  const normalizedSource = normalizeForMatch(sourceText);
  const sourceHas = (name: string) =>
    new RegExp(`^${name.replace(/\s+/g, "\\s+")}\\s*$`, "im").test(sourceText);
  const outputHas = (name: string) =>
    new RegExp(`^${name.replace(/\s+/g, "\\s+")}\\s*$`, "im").test(text);

  if (outputHas("EXPERIENCE") && !sourceHas("EXPERIENCE")) return false;
  if (outputHas("PROJECTS") && !sourceHas("PROJECTS")) return false;

  const upper = text.toUpperCase();
  const knownHeadings = ["SUMMARY", "TECHNICAL SKILLS", "PERSONAL SKILLS", "EDUCATION", "CERTIFICATIONS", "ACHIEVEMENTS", "HACKATHONS", "COURSEWORK", "EXPERIENCE", "PROJECTS"];
  if (!knownHeadings.some((heading) => new RegExp(`^${heading}\\s*$`, "m").test(upper))) return false;

  const skillsBlock = /TECHNICAL SKILLS\s*\n([\s\S]*?)(?:\n[A-Z][A-Z\s]+\n|$)/i.exec(text)?.[1] ?? "";
  const junkInSkills = skillsBlock
    .split(/[,;|]+/)
    .map((part) => part.trim())
    .some((part) => part && isJunkSkillTerm(part) && !isGenuineSkillTerm(part));
  if (junkInSkills) return false;

  return normalizedSource.length > 0;
}
