const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const jd = `Senior Frontend Engineer. Requirements: React, TypeScript, Next.js, Tailwind CSS, REST APIs, CI/CD, Agile, accessibility, testing and clear communication. You will lead projects and mentor engineers. Improve performance and write unit tests.`;

const resume = `Jane Doe
jane.doe@example.com | +1 (415) 555-0131

SUMMARY
Frontend engineer with 5 years of experience building React and TypeScript applications.

EXPERIENCE
- Built a React dashboard used by 8,000 users and reduced load time by 32%.
- Led a team of 3 engineers migrating to Next.js, cutting deploy time by 40%.
- Implemented Jest tests, increasing coverage from 40% to 78%.

SKILLS
React, TypeScript, Next.js, REST APIs, Tailwind CSS, Git, Docker
EDUCATION
B.S. Computer Science, 2020`;

const lowJd = `Senior Frontend Engineer — Onebridge
Requirements: 3+ years of professional experience with React, ReactJS, TypeScript, Next.js and JavaScript. You will build accessible interfaces with Tailwind CSS, integrate REST APIs and GraphQL, write tests, ship through CI/CD pipelines and improve performance. Experience with AWS, Docker, monitoring and data analysis is preferred. Strong communication and leadership skills are required.`;

const lowResume = `Jordan Lee
jordan.lee@example.com

SUMMARY
I am a hard working person who likes computers and wants to work in technology. I have done some tasks and helped my team with the website.

EXPERIENCE
Assistant Developer — Corner Shop, 2021 - 2022
- Responsible for helping with the website.
- Worked on fixing bugs when they came up.
- Helped with data entry and weekly reports.
- Participated in meetings with the team.

SKILLS
HTML, CSS

EDUCATION
Some College, 2021`;

const graduateJd = `Designation: IT Customer Service New Associate
Company: Accenture
Ability to work as part of a global team across world regions. Our business solutions create value and success for customers.
We need people who can support clients in a service operations environment. This role includes email support, live chat support, ticketing, incident management, CRM, Jira and Microsoft Excel.
Required experience with Git/GitHub version control, DevOps workflows, web applications and real-time application development using these tools.
You will handle customer service requests and data entry with attention to detail. The largest network of centers offers excellent learning opportunities.`;

const graduateResume = `Aarav Sharma
aarav.sharma@example.com | +91 98765 43210

SUMMARY
Computer science graduate interested in technology and customer support.

TECHNICAL SKILLS
HTML, CSS, JavaScript

PERSONAL SKILLS
Communication, hard working, punctual

EDUCATION
B.Tech Computer Science, 2024

CERTIFICATIONS
Web Development Fundamentals, 2023

ACHIEVEMENTS
- Developed a realtime application using these tools for college project.
- Assisted with data entry and report preparation for the library.

HACKATHONS
- Participated in a 24 hour hackathon and worked on a web app.

COURSEWORK
Database Management Systems, Object Oriented Programming, Cloud Computing`;

const BANNED = [
  "people", "clients", "company", "services", "service", "operations", "power", "email", "work", "role",
  "ability", "new", "global", "business", "solutions", "team", "customers", "accenture", "world", "largest",
  "network", "centers", "value", "success",
];

function makePdf(text) {
  const escaped = text.replace(/[()\\]/g, (char) => `\\${char}`);
  const stream = `BT /F1 11 Tf 50 750 Td (${escaped}) Tj ET`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

let passed = 0;
let failed = 0;
function report(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function postJson(path, body) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function normalizeSimple(value) {
  return value.toLowerCase().replace(/[^a-z0-9+#\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function keywordTerms(data) {
  return [
    ...(data?.skills?.matched ?? []).map((item) => item.keyword),
    ...(data?.skills?.semantic ?? []).map((item) => item.keyword),
    ...(data?.skills?.missing ?? []).map((item) => item.keyword),
  ].map(normalizeSimple);
}

function assertResult(data) {
  const fourPillars = ["hardSkills", "roleAlignment", "contextImpact", "parsability"].every(
    (key) => typeof data?.breakdown?.[key] === "number",
  );
  return (
    typeof data.score === "number" &&
    data.score >= 0 &&
    data.score <= 100 &&
    typeof data.verdict === "string" &&
    "detectedRole" in data &&
    fourPillars &&
    Array.isArray(data.skills.matched) &&
    Array.isArray(data.skills.semantic) &&
    Array.isArray(data.skills.missing) &&
    typeof data.xray.rawText === "string" &&
    Array.isArray(data.impact.bullets)
  );
}

async function run() {
  console.log(`\nSmoke testing ${BASE}\n`);

  const health = await fetch(`${BASE}/api/health`).then((response) => response.json()).catch(() => null);
  report("GET /api/health", health?.status === "ok", JSON.stringify(health ?? {}));

  const json = await postJson("/api/analyze", { resumeText: resume, jobDescription: jd, fileName: "Pasted resume text", fileType: "text" });
  const jsonData = await json.json();
  report("POST JSON analysis", json.status === 200 && assertResult(jsonData), `status ${json.status}, score ${jsonData?.score ?? "n/a"}`);
  report("Four-pillar weighting reported", /45%.*15%.*20%.*20%/.test(jsonData?.scoringNote ?? ""));

  const pdfForm = new FormData();
  pdfForm.append("resume", new File([makePdf(resume.replace(/\n/g, " "))], "resume.pdf", { type: "application/pdf" }));
  pdfForm.append("jobDescription", jd);
  const pdfResponse = await fetch(`${BASE}/api/analyze`, { method: "POST", body: pdfForm });
  const pdfData = await pdfResponse.json();
  report("POST multipart PDF analysis", pdfResponse.status === 200 && assertResult(pdfData), `status ${pdfResponse.status}, chars ${pdfData?.xray?.rawText?.length ?? 0}`);

  const scannedForm = new FormData();
  scannedForm.append("resume", new File([makePdf("Jordan Lee jordan@example.com")], "scanned.pdf", { type: "application/pdf" }));
  scannedForm.append("jobDescription", jd);
  const scannedResponse = await fetch(`${BASE}/api/analyze`, { method: "POST", body: scannedForm });
  const scannedData = await scannedResponse.json();
  report(
    "Scanned/image PDF guard",
    scannedResponse.status === 422 && scannedData?.error?.message === "Scanned/Image PDF Detected: ATS bots cannot read images. Please upload a text-based PDF or DOCX.",
    `status ${scannedResponse.status}`,
  );

  const stuffed = await postJson("/api/analyze", {
    resumeText: `${resume}\nReact React React React React React`,
    jobDescription: jd,
  });
  const stuffedData = await stuffed.json();
  report("Keyword stuffing guard (>4)", stuffed.status === 200 && stuffedData?.impact?.stuffing?.length > 0, `flags ${stuffedData?.impact?.stuffing?.length ?? 0}`);

  const enhance = await postJson("/api/enhance", {
    resumeText: lowResume,
    jobDescription: lowJd,
    targetRole: "Senior Frontend Engineer",
    targetCompany: "Onebridge",
    experienceLevel: "1–3 Years",
    missingKeywords: ["React", "TypeScript", "Next.js", "Tailwind CSS", "CI/CD", "GraphQL"],
    beforeScore: 40,
  });
  const enhanceData = await enhance.json();
  const preservedHeadings = ["SUMMARY", "TECHNICAL SKILLS", "EXPERIENCE", "EDUCATION"].every(
    (heading) => new RegExp(`^${heading}$`, "m").test(enhanceData?.enhancedText ?? ""),
  );
  report(
    "POST /api/enhance preserves real sections only",
    enhance.status === 200 &&
      preservedHeadings &&
      !/^PROJECTS$/m.test(enhanceData?.enhancedText ?? "") &&
      !/\[quantify|\[add |\[insert/i.test(enhanceData?.enhancedText ?? "") &&
      typeof enhanceData.projectedScore === "number" &&
      enhanceData.beforeScore === 40 &&
      enhanceData.projectedScore > enhanceData.beforeScore,
    `status ${enhance.status}, ${enhanceData?.beforeScore ?? "n/a"}% -> ${enhanceData?.projectedScore ?? "n/a"}%`,
  );

  const graduateAnalysisResponse = await postJson("/api/analyze", {
    resumeText: graduateResume,
    jobDescription: graduateJd,
    fileName: "Graduate resume",
    fileType: "text",
  });
  const graduateAnalysis = await graduateAnalysisResponse.json();
  const bannedFound = BANNED.filter((term) => keywordTerms(graduateAnalysis).includes(term));
  report(
    "Junk keyword extraction filter",
    graduateAnalysisResponse.status === 200 && bannedFound.length === 0,
    `banned terms found: ${bannedFound.length ? bannedFound.join(", ") : "none"}`,
  );
  report(
    "Full target role title detected",
    graduateAnalysis?.detectedRole === "IT Customer Service New Associate",
    `detected: ${graduateAnalysis?.detectedRole ?? "n/a"}`,
  );
  const projectsCheck = graduateAnalysis?.impact?.sections?.find((section) => section.label === "Projects");
  report(
    "Achievements/Hackathons/Coursework count as practical sections",
    projectsCheck?.present === true,
    `Projects check: ${projectsCheck?.present ?? "n/a"}`,
  );

  const graduateEnhance = await postJson("/api/enhance", {
    resumeText: graduateResume,
    jobDescription: graduateJd,
    targetRole: graduateAnalysis?.detectedRole ?? "IT Customer Service New Associate",
    targetCompany: "Accenture",
    experienceLevel: "Fresher / Graduate",
    missingKeywords: graduateAnalysis?.skills?.missing?.map((item) => item.keyword) ?? [],
    beforeScore: graduateAnalysis?.score,
  });
  const graduateTailored = await graduateEnhance.json();
  const tailoredText = graduateTailored?.enhancedText ?? "";
  const requiredRealSections = ["SUMMARY", "TECHNICAL SKILLS", "PERSONAL SKILLS", "EDUCATION", "CERTIFICATIONS", "ACHIEVEMENTS", "HACKATHONS", "COURSEWORK"];
  const preservedReal = requiredRealSections.every((heading) => new RegExp(`^${heading}$`, "m").test(tailoredText));
  const woven = Array.isArray(graduateTailored?.keywordsWoven) ? graduateTailored.keywordsWoven : [];
  const uniqueWoven = new Set(woven.map(normalizeSimple));
  const wovenPresent = woven.every((term) => normalizeSimple(tailoredText).includes(normalizeSimple(term)));
  const wovenJunk = woven.filter((term) => BANNED.includes(normalizeSimple(term)));
  const technicalBlock = /TECHNICAL SKILLS\s*\n([\s\S]*?)(?:\n[A-Z][A-Z\s]+\n|$)/i.exec(tailoredText)?.[1] ?? "";
  const junkInTechnical = technicalBlock
    .split(/[,;|]+/)
    .map((part) => normalizeSimple(part))
    .some((part) => BANNED.includes(part));

  report(
    "Tailored resume preserves only real sections",
    graduateEnhance.status === 200 &&
      preservedReal &&
      !/^EXPERIENCE$/m.test(tailoredText) &&
      !/^PROJECTS$/m.test(tailoredText) &&
      !/\[quantify|\[add |\[insert/i.test(tailoredText),
    `status ${graduateEnhance.status}`,
  );
  report(
    "Bullet rewritten with real tools, no placeholders",
    tailoredText.includes("Engineered a real-time web application utilizing Git/GitHub version control and collaborative DevOps workflows"),
    tailoredText.split(/\n/).find((line) => line.includes("Engineered a real-time")) ?? "expected bullet not found",
  );
  report(
    "Keywords woven counter is accurate and clean",
    woven.length > 0 && uniqueWoven.size === woven.length && wovenPresent && wovenJunk.length === 0 && !junkInTechnical,
    `count ${woven.length}, junk ${wovenJunk.length || "none"}`,
  );
  report(
    "Projected score jumps realistically",
    graduateTailored?.beforeScore === graduateAnalysis?.score &&
      typeof graduateTailored?.projectedScore === "number" &&
      graduateTailored.projectedScore >= 75 &&
      graduateTailored.projectedScore > graduateTailored.beforeScore,
    `${graduateTailored?.beforeScore ?? "n/a"}% -> ${graduateTailored?.projectedScore ?? "n/a"}%`,
  );

  const exportResponse = await postJson("/api/export-docx", {
    text: tailoredText || enhanceData?.enhancedText || resume,
    fileName: "smoke-tailored-resume",
  });
  const docxBytes = Buffer.from(await exportResponse.arrayBuffer());
  report(
    "POST /api/export-docx",
    exportResponse.status === 200 &&
      docxBytes.subarray(0, 2).toString() === "PK" &&
      (exportResponse.headers.get("content-type") ?? "").includes("wordprocessingml"),
    `status ${exportResponse.status}, ${docxBytes.length} bytes`,
  );

  const shortJd = await postJson("/api/analyze", { resumeText: resume, jobDescription: "too short" });
  report("Short JD returns 400", shortJd.status === 400);

  const emptyResume = await postJson("/api/analyze", { resumeText: "", jobDescription: jd });
  report("Empty resume returns 400", emptyResume.status === 400);

  const wrongType = new FormData();
  wrongType.append("resume", new File([Buffer.from("hello")], "resume.txt", { type: "text/plain" }));
  wrongType.append("jobDescription", jd);
  const wrongResponse = await fetch(`${BASE}/api/analyze`, { method: "POST", body: wrongType });
  report("Unsupported file returns 415", wrongResponse.status === 415);

  const huge = new FormData();
  huge.append("resume", new File([Buffer.alloc(10 * 1024 * 1024 + 1, 0x41)], "huge.pdf", { type: "application/pdf" }));
  huge.append("jobDescription", jd);
  const hugeResponse = await fetch(`${BASE}/api/analyze`, { method: "POST", body: huge });
  report("Oversized file returns 413", hugeResponse.status === 413);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
