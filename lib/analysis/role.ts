import { normalizeForMatch } from "../text/normalize";
import { splitResumeSections, sectionText, type ResumeSection } from "./sections";

export interface RoleAlignment {
  score: number;
  detectedRole: string | null;
  reasons: string[];
}

const TITLE_WORDS = new Set(
  `engineer developer manager analyst designer architect consultant specialist lead director recruiter
  scientist administrator coordinator executive officer associate intern programmer technician trainee
  representative supervisor`.split(/\s+/).filter(Boolean),
);

const SENIORITY_WORDS = new Set(
  `junior senior lead staff principal associate intern executive manager head chief new`.split(/\s+/).filter(Boolean),
);

const ROLE_CANONICAL: Record<string, string> = {
  "front-end": "frontend",
  front: "frontend",
  "back-end": "backend",
  back: "backend",
  fullstack: "fullstack",
  "full-stack": "fullstack",
  devops: "devops",
  ui: "ui",
  ux: "ux",
};

const isTitleLine = (value: string): boolean => {
  const normalized = normalizeForMatch(value);
  return normalized.split(/\s+/).some((token) => TITLE_WORDS.has(token));
};

/** Strip form labels without cutting the actual title short. */
function cleanTitle(line: string): string {
  return line
    .trim()
    .replace(/^[#*\s]+/, "")
    .replace(/^(?:[-•*●▪◦]|\d+[.)])\s+/, "")
    .replace(
      /^(?:designation|role|position|job\s+title|title|job\s+designation|current\s+designation)\s*[:\-–—]\s*/i,
      "",
    )
    .split(/\s+[—–|]\s+/)[0]
    .replace(/[.,;:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SKIP_LINE = /^(about|what you|who you|requirements?|responsibilities|the role|job description|company|overview|position|we are|you will|our |nice to have|qualifications|minimum|preferred|key skills|key responsibilities|location|job id|reward|benefits)/i;

export function detectJobTitle(jobDescription: string): string | null {
  const lines = jobDescription
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 12)) {
    const clean = cleanTitle(line);
    if (!clean || clean.length > 140 || SKIP_LINE.test(clean)) continue;
    if (isTitleLine(clean)) return clean;
  }

  const openingLines = jobDescription
    .slice(0, 1200)
    .split(/\n/)
    .slice(0, 12);
  for (const line of openingLines) {
    const clean = cleanTitle(line);
    if (clean && clean.length <= 140 && !SKIP_LINE.test(clean) && isTitleLine(clean)) return clean;
  }

  return null;
}

function roleTokens(value: string): string[] {
  return normalizeForMatch(value)
    .split(/\s+/)
    .map((token) => ROLE_CANONICAL[token] ?? token.replace(/[.]+$/, ""))
    .filter((token) => token.length > 1 && !/^\d+$/.test(token));
}

function overlapScore(expected: string[], actual: string[]): number {
  if (expected.length === 0) return 0;
  const actualSet = new Set(actual);
  const hits = expected.filter((token) => actualSet.has(token)).length;
  return Math.min(1, hits / expected.length);
}

/** Extract a leading title from prose such as "Senior Engineer candidate with 5 years...". */
function leadingTitleFrom(line: string): string | null {
  const clean = cleanTitle(line);
  if (!clean || clean.length > 2000) return null;
  const match =
    /^([A-Za-z][A-Za-z&/.-]*(?:\s+[A-Za-z&/.-]*)*?)\s+(?:candidate|with|at|who|having|profile|specializing|experienced)\b/i.exec(
      clean,
    );
  const title = match?.[1]?.trim() ?? "";
  return title.length > 2 && isTitleLine(title) ? title : null;
}

function resumeRoleCandidates(resumeText: string, sections: ResumeSection[]): { headline: string[]; roles: string[][] } {
  const rawLines = resumeText.split(/\n/);
  const firstHeadingIndex = sections.length > 0 ? Math.min(...sections.map((section) => section.startLine)) : rawLines.length;
  const headerTitle = rawLines
    .slice(0, Math.min(firstHeadingIndex, 8))
    .map((line) => line.trim())
    .find((line) => line.length > 2 && isTitleLine(line) && !/[\w.+-]+@/.test(line) && !/^https?:\/\//i.test(line));

  const summaryLines = sectionText(sections, ["summary"])
    .split(/\n/)
    .map((line) => cleanTitle(line))
    .filter((line) => line.length > 2);
  const summaryTitle =
    summaryLines.map(leadingTitleFrom).find((value): value is string => Boolean(value)) ??
    summaryLines.find((line) => line.length < 140 && isTitleLine(line));

  const experienceText = sectionText(sections, ["experience"]);
  const roles = experienceText
    .split(/\n/)
    .map((line) => line.replace(/^\s*[-•*●▪◦]\s+/, "").trim())
    .filter((line) => line.length > 3 && line.length < 130 && isTitleLine(line) && !/^\d{4}\b/.test(line));

  return {
    headline: summaryTitle ? roleTokens(summaryTitle) : headerTitle ? roleTokens(headerTitle) : [],
    roles: roles.map(roleTokens),
  };
}

/** Target-role and title alignment against the resume headline, summary and experience roles. */
export function analyzeRoleAlignment(jobDescription: string, resumeText: string): RoleAlignment {
  const detectedRole = detectJobTitle(jobDescription);
  if (!detectedRole) {
    return {
      score: 55,
      detectedRole: null,
      reasons: ["No clear target title was found in the job description, so role alignment is neutral."],
    };
  }

  const sections = splitResumeSections(resumeText);
  const { headline, roles } = resumeRoleCandidates(resumeText, sections);
  const expected = roleTokens(detectedRole).filter((token) => !SENIORITY_WORDS.has(token));
  const expectedSeniority = roleTokens(detectedRole).filter((token) => SENIORITY_WORDS.has(token));
  const normalizedResume = normalizeForMatch(resumeText);

  const headlineScore = headline.length > 0 ? overlapScore(expected, headline) : 0;
  const roleScore = roles.length > 0 ? Math.max(...roles.map((role) => overlapScore(expected, role))) : 0;
  const usedHeadline = headlineScore > 0 ? headlineScore : Math.max(headlineScore, roleScore);

  const exactPhrase = expected.length > 0 && expected.every((token) => normalizedResume.includes(token));
  const seniorityMatch =
    expectedSeniority.length === 0 ||
    expectedSeniority.some((token) => normalizeForMatch(resumeText).split(/\s+/).includes(token));

  const exactBonus = exactPhrase ? 0.1 : 0;
  const seniorityBonus = seniorityMatch ? 0.05 : 0;
  const scoreComponents =
    roles.length > 0
      ? usedHeadline * 0.45 + roleScore * 0.4 + exactBonus + seniorityBonus
      : headline.length > 0
        ? headlineScore * 0.8 + exactBonus * 1.5 + seniorityBonus
        : exactBonus + seniorityBonus;
  const score = Math.round(Math.min(100, Math.max(0, scoreComponents * 100)));

  const reasons = [
    `Detected target title: ${detectedRole}.`,
    headline.length > 0 ? `Headline or summary title overlap: ${Math.round(headlineScore * 100)}%.` : "No clear resume title signal found.",
    roles.length > 0 ? `Best experience-role overlap: ${Math.round(roleScore * 100)}%.` : "No role titles found in experience.",
  ];

  return { score, detectedRole, reasons };
}
