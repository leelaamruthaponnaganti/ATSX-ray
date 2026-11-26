import { SCORE_WEIGHTS } from "../constants";
import type {
  Breakdown,
  ImpactResult,
  KeywordSpec,
  MissingKeyword,
  SkillMatch,
  XRayResult,
} from "../types";
import type { RoleAlignment } from "./role";

export interface ScoreInput {
  keywords: KeywordSpec[];
  matched: SkillMatch[];
  semantic: SkillMatch[];
  missing: MissingKeyword[];
  impact: ImpactResult;
  xray: XRayResult;
  role: RoleAlignment;
}

export interface ScoreOutput {
  score: number;
  verdict: "Excellent" | "Good" | "Fair" | "Needs Work";
  breakdown: Breakdown;
  stuffingPenalty: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function skillContextMultiplier(match: SkillMatch): number {
  if (match.contextProof) return 1;
  switch (match.context) {
    case "skills":
    case "personalSkills":
      return 0.88;
    case "summary":
      return 0.78;
    case "education":
    case "certifications":
      return 0.72;
    case "other":
      return 0.6;
    default:
      return 0.65;
  }
}

function hardSkillScore(input: ScoreInput): number {
  const relevant = input.keywords.filter((keyword) => keyword.category !== "soft");
  if (relevant.length === 0) return 55;
  const byCanonical = new Map([...input.matched, ...input.semantic].map((match) => [match.canonical, match]));
  const total = relevant.reduce((sum, keyword) => sum + keyword.score, 0);
  const earned = relevant.reduce((sum, keyword) => {
    const match = byCanonical.get(keyword.key);
    if (!match) return sum;
    return sum + keyword.score * match.confidence * skillContextMultiplier(match);
  }, 0);
  return clamp((earned / Math.max(total, 0.001)) * 100);
}

function contextImpactScore(input: ScoreInput): number {
  const { impact } = input;
  const bulletCount = impact.bullets.length;
  const ratio = (count: number) => (bulletCount > 0 ? count / bulletCount : 0);
  const metricRatio = ratio(impact.bullets.filter((bullet) => bullet.hasMetric).length);
  const strongRatio = ratio(impact.bullets.filter((bullet) => bullet.strongVerb).length);
  const weakRatio = ratio(impact.bullets.filter((bullet) => bullet.rating === "weak").length);
  const matches = [...input.matched, ...input.semantic];
  const proofRatio = matches.length > 0 ? matches.filter((match) => match.contextProof).length / matches.length : 0;
  const coverageComponent = matches.length === 0 ? 6 : 12 + proofRatio * 18;
  const base = metricRatio * 25 + strongRatio * 35 + coverageComponent + 8 - weakRatio * 12;
  return clamp(base);
}

function parsabilityScore(xray: XRayResult): number {
  const points = xray.checks.map((item) => (item.status === "pass" ? 100 : item.status === "warn" ? 62 : 20));
  const average = points.reduce((sum, point) => sum + point, 0) / Math.max(points.length, 1);
  return clamp(average);
}

export function scoreAnalysis(input: ScoreInput): ScoreOutput {
  const breakdown: Breakdown = {
    hardSkills: Math.round(hardSkillScore(input)),
    roleAlignment: Math.round(clamp(input.role.score)),
    contextImpact: Math.round(contextImpactScore(input)),
    parsability: Math.round(parsabilityScore(input.xray)),
  };

  const stuffingPenalty = Math.min(
    SCORE_WEIGHTS.maxStuffingPenalty,
    input.impact.stuffing.length * 1.5,
  );

  const weighted =
    breakdown.hardSkills * SCORE_WEIGHTS.hardSkills +
    breakdown.roleAlignment * SCORE_WEIGHTS.roleAlignment +
    breakdown.contextImpact * SCORE_WEIGHTS.contextImpact +
    breakdown.parsability * SCORE_WEIGHTS.parsability;

  const score = Math.round(clamp(weighted - stuffingPenalty));
  const verdict: ScoreOutput["verdict"] =
    score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Fair" : "Needs Work";

  return { score, verdict, breakdown, stuffingPenalty };
}
