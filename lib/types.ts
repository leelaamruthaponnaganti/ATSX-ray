export type SkillCategory = "hard" | "soft" | "role";
export type Importance = "critical" | "important" | "nice-to-have";
export type MatchKind = "exact" | "semantic" | "partial";
export type SkillContext =
  | "experience"
  | "projects"
  | "achievements"
  | "hackathons"
  | "coursework"
  | "skills"
  | "personalSkills"
  | "summary"
  | "education"
  | "certifications"
  | "other"
  | "none";

export type ExperienceLevel = "Fresher / Graduate" | "1–3 Years" | "3+ Years";

export interface KeywordSpec {
  key: string;
  label: string;
  /** The term exactly as it appeared in the job description, when available. */
  source?: string;
  category: SkillCategory;
  importance: Importance;
  score: number;
}

export interface SkillMatch {
  keyword: string;
  canonical: string;
  category: SkillCategory;
  importance: Importance;
  match: MatchKind;
  confidence: number;
  context: SkillContext;
  contextProof: boolean;
  evidence?: string;
  note?: string;
}

export interface MissingKeyword {
  keyword: string;
  canonical: string;
  category: SkillCategory;
  importance: Importance;
  score: number;
  reason: string;
}

export interface BulletAnalysis {
  text: string;
  index: number;
  hasMetric: boolean;
  metrics: string[];
  strongVerb: string | null;
  weakPhrase: string | null;
  repeated: boolean;
  rating: "strong" | "medium" | "weak";
  tip?: string;
}

export interface StuffingFlag {
  keyword: string;
  count: number;
  densityPer500: number;
  reason: string;
  suggestion: string;
}

export interface SectionCheck {
  label: string;
  present: boolean;
  detail: string;
}

export interface ParsabilityCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface ExtractedMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  charCount: number;
  wordCount: number;
  lineCount: number;
  pages: number | null;
}

export interface XRayResult {
  rawText: string;
  metadata: ExtractedMetadata;
  checks: ParsabilityCheck[];
  layoutFlags: string[];
  parsability: "clean" | "minor-issues" | "poor";
}

export interface ImpactResult {
  bullets: BulletAnalysis[];
  stuffing: StuffingFlag[];
  sections: SectionCheck[];
  wordCount: number;
  wordCountStatus: "low" | "ideal" | "high";
  metricBulletCount: number;
  suggestions: string[];
}

/** The four enterprise ATS pillars. Their weights total 100%. */
export interface Breakdown {
  hardSkills: number;
  roleAlignment: number;
  contextImpact: number;
  parsability: number;
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  engine: "hybrid-local" | "llm";
  score: number;
  verdict: "Excellent" | "Good" | "Fair" | "Needs Work";
  breakdown: Breakdown;
  detectedRole: string | null;
  stuffingPenalty: number;
  skills: {
    matched: SkillMatch[];
    semantic: SkillMatch[];
    missing: MissingKeyword[];
    totalRequirements: number;
  };
  xray: XRayResult;
  impact: ImpactResult;
  warnings: string[];
  scoringNote: string;
}

export interface AnalysisInput {
  resumeText: string;
  rawText?: string;
  jobDescription: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  pages?: number | null;
}

export interface EnhanceRequest {
  resumeText: string;
  jobDescription: string;
  targetRole: string;
  targetCompany: string;
  experienceLevel: ExperienceLevel;
  missingKeywords: string[];
  beforeScore?: number;
}

export interface EnhanceResponse {
  enhancedText: string;
  beforeScore: number;
  projectedScore: number;
  changes: string[];
  keywordsWoven: string[];
  engine: "template" | "gemini" | "openai";
  warnings: string[];
}

export interface UserFacingErrorShape {
  error: {
    code: string;
    message: string;
  };
}
