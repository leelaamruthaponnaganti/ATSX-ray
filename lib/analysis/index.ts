import { normalizeText } from "../text/normalize";
import type { AnalysisInput, AnalysisResult } from "../types";
import { analyzeImpact } from "./impact";
import { extractKeywords } from "./keywords";
import { matchSkills } from "./matching";
import { analyzeRoleAlignment } from "./role";
import { scoreAnalysis } from "./scoring";
import { analyzeXRay } from "./structure";

/** Deterministic, explainable, offline ATS engine. */
export function analyzeResume(input: AnalysisInput): AnalysisResult {
  const rawText = input.rawText ?? input.resumeText;
  const resumeText = normalizeText(input.resumeText);
  const jobDescription = input.jobDescription.trim();

  const keywords = extractKeywords(jobDescription);
  const matches = matchSkills(keywords, resumeText);
  const role = analyzeRoleAlignment(jobDescription, resumeText);
  const xray = analyzeXRay(rawText, {
    fileName: input.fileName ?? "Pasted resume text",
    fileType: input.fileType ?? "text",
    fileSize: input.fileSize ?? Buffer.byteLength(rawText, "utf8"),
    charCount: rawText.length,
    wordCount: rawText.split(/\s+/).filter(Boolean).length,
    lineCount: rawText.split(/\n/).length,
    pages: input.pages ?? null,
  });
  const impact = analyzeImpact(resumeText, keywords);
  const scored = scoreAnalysis({ keywords, ...matches, impact, xray, role });

  const warnings: string[] = [];
  if (xray.parsability !== "clean") warnings.push("The extracted text shows formatting issues — inspect the X-Ray view.");
  if (keywords.length < 6) warnings.push("The job description is quite short, so keyword coverage may be limited.");
  if (impact.wordCountStatus !== "ideal") warnings.push(`Resume length is outside the ideal 350–850 word range (${impact.wordCount} words).`);
  if (matches.missing.some((item) => item.importance === "critical")) {
    warnings.push("One or more critical job requirements were not detected.");
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    engine: "hybrid-local",
    ...scored,
    detectedRole: role.detectedRole,
    skills: { ...matches, totalRequirements: keywords.length },
    xray,
    impact,
    warnings,
    scoringNote:
      "Score = hard skills & domain 45% + role/title alignment 15% + contextual experience & quantified impact 20% + ATS parsability 20%, minus a capped keyword-stuffing penalty.",
  };
}
