export type ResumeSectionName =
  | "summary"
  | "skills"
  | "personalSkills"
  | "experience"
  | "projects"
  | "achievements"
  | "hackathons"
  | "coursework"
  | "education"
  | "certifications"
  | "other";

export interface ResumeSection {
  name: ResumeSectionName;
  heading: string;
  text: string;
  startLine: number;
  endLine: number;
}

/** Sections whose content counts as practical evidence for Freshers/Graduates. */
export const PRACTICAL_SECTIONS: ReadonlySet<ResumeSectionName> = new Set([
  "projects",
  "achievements",
  "hackathons",
  "coursework",
]);

const HEADINGS: { name: ResumeSectionName; pattern: RegExp }[] = [
  {
    name: "summary",
    pattern: /^(?:professional\s+)?(?:summary|profile|objective|about me)\b/i,
  },
  { name: "personalSkills", pattern: /^personal\s+skills?\b/i },
  {
    name: "skills",
    pattern: /^(?:technical\s+|core\s+|key\s+|computer\s+)?(?:skills?|technologies|competencies|toolkit)\b/i,
  },
  {
    name: "experience",
    pattern: /^(?:(?:professional|work|relevant|employment)\s+)?(?:experience|employment history|work history)\b/i,
  },
  { name: "projects", pattern: /^(?:personal\s+|selected\s+|academic\s+)?projects?\b/i },
  { name: "achievements", pattern: /^(?:key\s+|notable\s+)?achievements?\b/i },
  { name: "hackathons", pattern: /^hackathons?\b/i },
  { name: "coursework", pattern: /^(?:relevant\s+)?course\s?work\b/i },
  { name: "education", pattern: /^(?:education|academic background|qualifications)\b/i },
  { name: "certifications", pattern: /^(?:certifications?|licenses?|courses?)\b/i },
];

function detectHeading(line: string): { name: ResumeSectionName; heading: string } | null {
  const clean = line.trim().replace(/^[#*\s]+/, "").trim();
  if (!clean || clean.length > 80) return null;
  if (/^[-•*●▪◦\d]+[.)]?\s/.test(clean)) return null;
  for (const heading of HEADINGS) {
    if (heading.pattern.test(clean)) return { name: heading.name, heading: clean };
  }
  return null;
}

/** Split normalized resume text into ATS-style sections while preserving line order. */
export function splitResumeSections(text: string): ResumeSection[] {
  const lines = text.split(/\n/);
  const sections: ResumeSection[] = [];
  let current: ResumeSection = {
    name: "other",
    heading: "",
    text: "",
    startLine: 0,
    endLine: -1,
  };
  let started = false;

  const pushCurrent = (endLine: number) => {
    if (!started) return;
    current.endLine = endLine;
    sections.push(current);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const heading = detectHeading(line);
    if (heading) {
      pushCurrent(index - 1);
      current = {
        name: heading.name,
        heading: heading.heading,
        text: "",
        startLine: index,
        endLine: -1,
      };
      started = true;
    } else if (started) {
      current.text += `${line}\n`;
    }
  }
  pushCurrent(lines.length - 1);

  return sections
    .map((section) => ({ ...section, text: section.text.trim() }))
    .filter((section) => section.text.length > 0 || section.heading.length > 0);
}

export function sectionText(sections: ResumeSection[], names: ResumeSectionName[]): string {
  return sections
    .filter((section) => names.includes(section.name))
    .map((section) => section.text)
    .join("\n");
}

export function getSection(sections: ResumeSection[], name: ResumeSectionName): ResumeSection | undefined {
  return sections.find((section) => section.name === name);
}
