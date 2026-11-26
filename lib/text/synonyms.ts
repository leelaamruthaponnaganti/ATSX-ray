import { normalizeForMatch } from "./normalize";

/**
 * Canonical skill groups. Aliases are compared after normalizeForMatch(), so
 * "ReactJS", "react.js" and "React JS" all resolve to the same canonical key.
 * This is what makes the matcher semantic instead of a dumb exact-word grep.
 */
export const SYNONYM_GROUPS: Record<string, string[]> = {
  javascript: ["javascript", "js", "es6", "vanilla js", "ecmascript"],
  react: ["react", "reactjs", "react.js", "react js"],
  nextjs: ["nextjs", "next.js", "next js"],
  typescript: ["typescript", "ts", "typed javascript"],
  nodejs: ["nodejs", "node.js", "node js"],
  python: ["python", "py"],
  java: ["java", "java se"],
  "c++": ["c++", "cpp"],
  "c#": ["c#", "csharp", "c sharp"],
  ".net": [".net", "dotnet"],
  golang: ["golang", "go lang", "go programming"],
  ruby: ["ruby", "rails", "ruby on rails"],
  php: ["php", "laravel"],
  sql: ["sql", "postgres", "postgresql", "mysql", "sqlite", "relational database"],
  nosql: ["nosql", "mongodb", "dynamodb", "redis", "firebase"],
  "rest api": ["rest api", "restful api", "rest apis", "rest endpoints", "api development", "api design"],
  graphql: ["graphql", "graph ql"],
  git: ["git", "github", "gitlab", "version control", "bitbucket"],
  docker: ["docker", "containerization", "containerised", "containerized"],
  kubernetes: ["kubernetes", "k8s"],
  "ci/cd": ["ci/cd", "cicd", "continuous integration", "continuous delivery", "github actions", "jenkins", "deployment pipelines"],
  aws: ["aws", "amazon web services"],
  azure: ["azure", "microsoft azure"],
  gcp: ["gcp", "google cloud", "google cloud platform"],
  tailwind: ["tailwind", "tailwind css", "tailwindcss"],
  css: ["css", "css3", "styled components", "sass", "scss"],
  html: ["html", "html5"],
  agile: ["agile", "scrum", "kanban", "sprint planning", "iterative development"],
  "project management": ["project management", "managed teams", "managing teams", "project delivery", "led projects", "project planning"],
  communication: ["communication", "stakeholder communication", "presentations", "presented", "demos", "stakeholders", "written communication", "verbal communication", "communicating"],
  leadership: ["leadership", "led teams", "mentoring", "mentored", "team lead", "supervised", "leadership skills"],
  "problem solving": ["problem solving", "troubleshooting", "critical thinking", "debugging", "analytical thinking"],
  "data analysis": ["data analysis", "analytics", "data insights", "exploratory data analysis", "data interpretation"],
  "machine learning": ["machine learning", "ml", "predictive modeling", "model training", "deep learning"],
  "ui/ux design": ["ui/ux design", "ux design", "user experience", "interface design", "design system", "redesign", "figma", "wireframing", "prototyping"],
  testing: ["testing", "unit testing", "test automation", "jest", "vitest", "cypress", "playwright", "tdd"],
  "performance optimization": ["performance optimization", "optimization", "performance tuning", "latency reduction", "load time"],
  accessibility: ["accessibility", "a11y", "wcag", "inclusive design"],
  collaboration: ["collaboration", "cross-functional", "cross functional", "teamwork", "team player", "working with designers"],
  "stakeholder management": ["stakeholder management", "stakeholder engagement", "client communication", "client management"],
  budgeting: ["budgeting", "cost management", "budget tracking", "budget"],
  "time management": ["time management", "prioritization", "meeting deadlines", "deadline management"],
  research: ["research", "user research", "competitive analysis", "usability testing"],
  "state management": ["state management", "redux", "zustand", "context api", "mobx"],
  monitoring: ["monitoring", "observability", "logging", "sentry", "datadog", "grafana", "prometheus"],
  security: ["security", "authentication", "authorization", "oauth", "jwt", "secure coding"],
  devops: ["devops", "dev ops", "dev-ops", "site reliability engineering", "sre", "collaborative devops workflows", "devops workflows"],
  "web applications": ["web application", "web applications", "web app", "web apps", "web development", "web based application"],
  "real-time applications": ["real-time application", "realtime application", "real time application", "real-time web application", "realtime web application", "real-time systems"],
  linux: ["linux", "unix", "ubuntu", "red hat linux"],
  "shell scripting": ["shell scripting", "bash scripting", "bash", "powershell"],
  oop: ["object oriented programming", "object-oriented programming", "oop", "oops"],
  "data structures": ["data structures", "algorithms", "data structures and algorithms", "dsa"],
  dbms: ["dbms", "database management systems", "relational database management system"],
  postman: ["postman", "api testing", "rest api testing"],
  jira: ["jira", "confluence", "issue tracking", "issue tracker"],
  ticketing: ["ticketing", "incident management", "service desk", "help desk", "helpdesk", "ticket management"],
  crm: ["crm", "customer relationship management", "salesforce", "zendesk", "freshdesk", "servicenow"],
  "customer service": ["customer service", "customer support", "customer care", "technical support", "client support", "customer servicing", "it customer service"],
  "it support": ["it support", "desktop support", "end user support", "technical assistance"],
  excel: ["microsoft excel", "ms excel", "excel", "spreadsheets", "advanced excel"],
  "microsoft office": ["microsoft office", "ms office", "office 365", "microsoft 365"],
  "power bi": ["power bi", "powerbi", "microsoft power bi"],
  tableau: ["tableau"],
  sap: ["sap", "sap erp"],
  networking: ["networking", "computer networking", "computer networks", "tcp ip", "dns", "routing and switching"],
  "cloud computing": ["cloud computing", "cloud infrastructure", "cloud services"],
  sdlc: ["sdlc", "software development life cycle", "software development lifecycle"],
  "attention to detail": ["attention to detail", "detail oriented", "detail-oriented"],
};

export const SOFT_SKILL_KEYS = new Set([
  "communication",
  "leadership",
  "project management",
  "problem solving",
  "collaboration",
  "stakeholder management",
  "budgeting",
  "time management",
  "research",
  "ui/ux design",
  "attention to detail",
]);

export const HARD_SKILL_KEYS = new Set(
  Object.keys(SYNONYM_GROUPS).filter((key) => !SOFT_SKILL_KEYS.has(key)),
);

/**
 * Boilerplate and generic nouns seen in job descriptions. These are never
 * requirements, even when a recruiter repeats them several times.
 */
export const GENERIC_JD_TERMS = new Set(
  `ability abilities accommodate achieving across after appropriate allow applicant applicants application applications
  area areas available based becoming best better big business businesses candidate candidates center centers centre centres
  change changes client clients company companies complex comprehensive condition conditions contact continue continued
  corporate currently customer customers daily day days detail details develop developing development duties dynamic
  email end ensure ensuring environment environments equivalent excellent experience experienced fast field fields
  flexible follow global good great group guidance handle help helping here high hire hiring hour hours human
  including individual industry information inside intern internship job join joining key knowledge large largest
  latest level levels looking maintain managing maximum minimum mission month months need needed new news next
  office operations operation opportunity opportunities outside overall part people person people-oriented place plan
  planning position power preferred previous prior professional profile project projects prompt proper provide provided
  quality responsible responsibilities responsibility resume result results role roles rule rules service services
  setting settings skill skills solution solutions something specific staff standard standards start state strong
  success successful support system systems team teams technical technologies technology thing things time title
  today together tools total track track record value values various vision wage week weekly well work working
  world worldwide year years you your`.split(/\s+/).filter(Boolean),
);

/** Organisation names are context, never candidate skills. */
export const JUNK_ORGANISATIONS = new Set(
  `accenture tcs infosys wipro cognizant capgemini deloitte pwc kpmg ey ibm google amazon microsoft apple meta
  netflix oracle adobe salesforce servicenow zendesk jira figma github gitlab`.split(/\s+/).filter(Boolean),
);

/** Tools/domain terms that are genuine skills but do not need synonym groups. */
export const CURATED_SKILL_TERMS = new Set([
  "terraform", "ansible", "prometheus", "kafka", "spark", "hadoop", "django", "flask", "spring boot",
  "hibernate", "playwright", "vitest", "selenium", "photoshop", "canva", "quickbooks", "tally",
  "zendesk", "servicenow", "jira service management", "ms teams", "google workspace", "google sheets",
  "outlook", "trello", "asana", "notion", "express.js", "nestjs", "vue.js", "angular", "svelte",
  "rust", "swift", "kotlin", "scala", "r programming", "matlab", "spss", "autocad", "solidworks",
  "prototyping", "wireframing", "user stories", "sap erp", "azure devops", "aws lambda",
  "active directory", "office administration", "data entry", "client handling", "inbound calls",
  "outbound calls", "email support", "live chat support", "escalation management", "root cause analysis",
  "sla management", "conflict resolution", "presentation skills", "negotiation", "adaptability",
]);

const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(SYNONYM_GROUPS)) {
  for (const alias of [canonical, ...aliases]) {
    const normalized = normalizeForMatch(alias);
    if (normalized) ALIAS_TO_CANONICAL.set(normalized, canonical);
  }
}
for (const term of CURATED_SKILL_TERMS) {
  const normalized = normalizeForMatch(term);
  if (normalized && !ALIAS_TO_CANONICAL.has(normalized)) ALIAS_TO_CANONICAL.set(normalized, normalized);
}

/** Resolve a token or phrase to its canonical skill key, if known. */
export function canonicalFor(value: string): string | null {
  return ALIAS_TO_CANONICAL.get(normalizeForMatch(value)) ?? null;
}

export function aliasesFor(canonical: string): string[] {
  return SYNONYM_GROUPS[canonical] ? [canonical, ...SYNONYM_GROUPS[canonical]] : [canonical];
}

export function isKnownSkill(value: string): boolean {
  return canonicalFor(value) !== null;
}

/** Exact-term junk guard. Phrases such as "customer service" are unaffected. */
export function isJunkSkillTerm(value: string): boolean {
  const normalized = normalizeForMatch(value);
  if (!normalized || normalized.length < 2) return true;
  if (GENERIC_JD_TERMS.has(normalized) || JUNK_ORGANISATIONS.has(normalized)) return true;
  return /^\d+$/.test(normalized);
}

/** Only curated technical, software, tool and domain terms pass this gate. */
export function isGenuineSkillTerm(value: string): boolean {
  const normalized = normalizeForMatch(value);
  return !isJunkSkillTerm(normalized) && isKnownSkill(normalized);
}

/** Filter a caller-provided keyword list down to real ATS skills. */
export function filterJunkSkills(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value.trim();
    const normalized = normalizeForMatch(clean);
    if (!isGenuineSkillTerm(clean) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(displayLabel(canonicalFor(clean) ?? normalized));
  }
  return result;
}

export function categoryFor(key: string): "hard" | "soft" | "role" {
  if (SOFT_SKILL_KEYS.has(key)) return "soft";
  if (HARD_SKILL_KEYS.has(key)) return "hard";
  return "role";
}

export function displayLabel(key: string): string {
  const special: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    nextjs: "Next.js",
    nodejs: "Node.js",
    "rest api": "REST APIs",
    "ui/ux design": "UI/UX Design",
    "ci/cd": "CI/CD",
    "state management": "State Management",
    "performance optimization": "Performance Optimization",
    nosql: "NoSQL",
    graphql: "GraphQL",
    tailwind: "Tailwind CSS",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    aws: "AWS",
    gcp: "GCP",
    ".net": ".NET",
    "c++": "C++",
    "c#": "C#",
    ml: "Machine Learning",
    devops: "DevOps",
    "web applications": "Web Applications",
    "real-time applications": "Real-Time Applications",
    linux: "Linux",
    "shell scripting": "Shell Scripting",
    oop: "OOP",
    "data structures": "Data Structures & Algorithms",
    dbms: "DBMS",
    postman: "Postman",
    jira: "Jira",
    ticketing: "Ticketing & Incident Management",
    crm: "CRM",
    "customer service": "Customer Service",
    "it support": "IT Support",
    excel: "Microsoft Excel",
    "microsoft office": "Microsoft Office",
    "power bi": "Power BI",
    tableau: "Tableau",
    sap: "SAP",
    networking: "Networking",
    "cloud computing": "Cloud Computing",
    sdlc: "SDLC",
    "attention to detail": "Attention to Detail",
  };
  return special[key] ?? key.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
