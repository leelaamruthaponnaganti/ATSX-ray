export const LIMITS = {
  maxFileBytes: 10 * 1024 * 1024,
  minJobDescriptionChars: 40,
  minResumeChars: 80,
  scannedPdfThreshold: 50,
  maxKeywords: 30,
  stuffingThreshold: 4,
} as const;

export const SCORE_WEIGHTS = {
  hardSkills: 0.45,
  roleAlignment: 0.15,
  contextImpact: 0.2,
  parsability: 0.2,
  maxStuffingPenalty: 5,
} as const;

export const STOPWORDS = new Set(
  `a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves also etc via per using use used work working role position candidate resume cv details summary professional year years experience experienced skills skill ability strong excellent good great team teams company companies project projects job jobs new include includes including ensure able across within well both must required requirement requirements preferred plus related`
    .split(/\s+/)
    .filter(Boolean),
);

export const STRONG_VERBS = [
  "achieved", "accelerated", "automated", "built", "created", "delivered", "designed",
  "developed", "drove", "engineered", "established", "improved", "increased", "launched",
  "led", "managed", "migrated", "optimized", "reduced", "shipped", "spearheaded",
  "streamlined", "transformed", "implemented", "deployed", "generated", "negotiated",
  "mentored", "scaled", "resolved", "cut", "grew", "owned", "introduced", "simplified",
];

export const WEAK_PHRASES = [
  "responsible for", "helped with", "worked on", "assisted with", "assisted in",
  "tasked with", "participated in", "involved in", "duties included", "was part of",
  "helped to", "tried to",
];

export const ACTION_VERB_STARTERS = [
  ...STRONG_VERBS,
  "analyzed", "coordinated", "maintained", "supported", "tested", "wrote", "planned",
  "collected", "presented", "trained", "documented", "researched", "configured",
];

export const SECTION_PATTERNS: { label: string; pattern: RegExp; detail: string }[] = [
  { label: "Contact", pattern: /[\w.+-]+@[\w-]+\.[\w.]+/, detail: "Email address detected" },
  { label: "Phone", pattern: /(?:\+?\d[\d\s().-]{7,}\d)/, detail: "Phone number detected" },
  {
    label: "Experience",
    pattern: /(work|professional|employment|relevant)\s+experience|experience\b/i,
    detail: "Work history section found",
  },
  {
    label: "Education",
    pattern: /education|academic|bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|university|college|diploma/i,
    detail: "Education section found",
  },
  {
    label: "Skills",
    pattern: /\bskills\b|technical|technologies|competencies|toolkit/i,
    detail: "Skills section found",
  },
  {
    label: "Projects",
    pattern: /\bprojects?\b|\bachievements?\b|\bhackathons?\b|\bcourse\s?work\b/i,
    detail: "Project, achievement, hackathon or coursework evidence found",
  },
];

/** Shared practical-evidence pattern for Freshers/Graduates. */
export const PRACTICAL_SECTION_PATTERN =
  /\bprojects?\b|\bachievements?\b|\bhackathons?\b|\bcourse\s?work\b/i;

export const IDEAL_WORD_RANGE = { min: 350, max: 850 } as const;

export const EXPERIENCE_LEVELS = ["Fresher / Graduate", "1–3 Years", "3+ Years"] as const;
