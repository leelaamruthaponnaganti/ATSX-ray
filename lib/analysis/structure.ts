import { IDEAL_WORD_RANGE, LIMITS, PRACTICAL_SECTION_PATTERN, SECTION_PATTERNS } from "../constants";
import { countWords } from "../text/normalize";
import type { ExtractedMetadata, ParsabilityCheck, XRayResult } from "../types";

function check(label: string, status: ParsabilityCheck["status"], detail: string): ParsabilityCheck {
  return { label, status, detail };
}

const CLEAN_DATE =
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b|\b(?:0?[1-9]|1[0-2])\/(?:19|20)?\d{2}\b|\b(?:19|20)\d{2}\b/i;
const AMBIGUOUS_DATE = /\b\d{1,2}[.-]\d{1,2}[.-]\d{2,4}\b/;

/** The "Recruiter's Eye" checks: did the parser preserve what a human would read? */
export function analyzeXRay(rawText: string, metadata: ExtractedMetadata): XRayResult {
  const checks: ParsabilityCheck[] = [];
  const layoutFlags: string[] = [];
  const lines = rawText.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const wordCount = countWords(rawText);

  if (rawText.replace(/\s/g, "").length < LIMITS.scannedPdfThreshold) {
    checks.push(check("Selectable text", "fail", "Almost no text was extracted — this looks like a scanned image."));
    layoutFlags.push("Image-only / scanned document");
  } else if (rawText.length < 400) {
    checks.push(check("Selectable text", "warn", `Only ${rawText.length} characters extracted; the resume may be incomplete.`));
  } else {
    checks.push(check("Selectable text", "pass", `${rawText.length} characters extracted successfully.`));
  }

  const longLines = lines.filter((line) => line.length > 180).length;
  const longLineRatio = lines.length > 0 ? longLines / lines.length : 0;
  if (longLineRatio > 0.12) {
    checks.push(check("Column & table layout", "warn", `${longLines} overly long lines suggest columns or tables were flattened.`));
    layoutFlags.push("Possible column / table flattening");
  } else {
    checks.push(check("Column & table layout", "pass", "Line lengths look natural and readable."));
  }

  if (lines.length < 5 && rawText.length > 500) {
    checks.push(check("Line structure", "warn", "Text arrived in very few lines — headings and bullets may be merged."));
    layoutFlags.push("Merged headings or bullets");
  } else {
    checks.push(check("Line structure", "pass", `${lines.length} readable lines detected.`));
  }

  const replacementChars = (rawText.match(/\uFFFD/g) ?? []).length;
  const controlChars = (rawText.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) ?? []).length;
  const garbledRatio = rawText.length > 0 ? (replacementChars + controlChars) / rawText.length : 0;
  if (garbledRatio > 0.005) {
    checks.push(check("Character integrity", "warn", `${replacementChars + controlChars} garbled characters found in extraction.`));
    layoutFlags.push("Garbled or non-standard characters");
  } else {
    checks.push(check("Character integrity", "pass", "No significant encoding damage detected."));
  }

  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(rawText);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(rawText);
  if (hasEmail && hasPhone) {
    checks.push(check("Contact details", "pass", "Email and phone survived parsing."));
  } else {
    checks.push(check("Contact details", "warn", `${!hasEmail ? "Email" : "Phone"} was not detected in the extracted text.`));
    layoutFlags.push("Contact details may be in an image or header");
  }

  const hasExperienceOrProjects =
    /(?:professional|work|relevant)?\s*experience\b/i.test(rawText) || PRACTICAL_SECTION_PATTERN.test(rawText);
  const hasEducation = SECTION_PATTERNS.find((item) => item.label === "Education")?.pattern.test(rawText) ?? false;
  const hasSkills = SECTION_PATTERNS.find((item) => item.label === "Skills")?.pattern.test(rawText) ?? false;
  const missingCore = [
    !hasExperienceOrProjects ? "Experience/Practical evidence" : null,
    !hasEducation ? "Education" : null,
    !hasSkills ? "Skills" : null,
  ].filter(Boolean);
  checks.push(
    missingCore.length === 0
      ? check("Required sections", "pass", "Experience/practical evidence, Education and Skills are all present.")
      : check("Required sections", "fail", `Missing: ${missingCore.join(", ")}.`),
  );

  const dates = rawText.match(CLEAN_DATE) ?? [];
  if (dates.length === 0) {
    checks.push(check("Date formats", "warn", "No standard dates (YYYY, Mon YYYY or MM/YYYY) were detected."));
  } else if (AMBIGUOUS_DATE.test(rawText)) {
    checks.push(check("Date formats", "warn", "Ambiguous date formats detected — use Mon YYYY or YYYY consistently."));
    layoutFlags.push("Ambiguous or mixed date formats");
  } else {
    checks.push(check("Date formats", "pass", `${dates.length} clean date values detected.`));
  }

  if (wordCount >= IDEAL_WORD_RANGE.min && wordCount <= IDEAL_WORD_RANGE.max) {
    checks.push(check("Word count", "pass", `${wordCount} words — inside the ${IDEAL_WORD_RANGE.min}–${IDEAL_WORD_RANGE.max} ideal range.`));
  } else {
    checks.push(check("Word count", "warn", `${wordCount} words — outside the ${IDEAL_WORD_RANGE.min}–${IDEAL_WORD_RANGE.max} ideal range.`));
  }

  const parsability: XRayResult["parsability"] = checks.some((item) => item.status === "fail")
    ? "poor"
    : checks.some((item) => item.status === "warn")
      ? "minor-issues"
      : "clean";

  return { rawText, metadata, checks, layoutFlags, parsability };
}
