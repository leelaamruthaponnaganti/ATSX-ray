"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  FileSearch,
  Loader2,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { JobDescriptionInput } from "@/components/input/JobDescriptionInput";
import { ResumeUpload } from "@/components/input/ResumeUpload";
import { AnalysisProgress } from "@/components/progress/AnalysisProgress";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { Card } from "@/components/ui/Card";
import { LIMITS } from "@/lib/constants";
import {
  DEMO_RESUME_TEXT,
  LOW_SCORE_DEMO_RESUME,
  LOW_SCORE_SAMPLE_JOB_DESCRIPTION,
  SAMPLE_JOB_DESCRIPTION,
} from "@/lib/sample-data";
import type { AnalysisResult } from "@/lib/types";

type Stage = "input" | "analyzing" | "results";
interface AnalyzeOverride {
  resumeText: string;
  jobDescription: string;
  fileName: string;
}

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const STEPS = [
  { label: "Upload or demo", icon: UploadCloud },
  { label: "Analyze ATS signals", icon: FileSearch },
  { label: "Tailor & export", icon: WandSparkles },
];

function StepRail({ stage }: { stage: Stage }) {
  const current = stage === "input" ? 0 : stage === "analyzing" ? 1 : 2;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <div key={step.label} className="flex items-center gap-2 sm:gap-3">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                active
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-line bg-white text-slate-400"
              }`}
            >
              {active ? <Loader2 size={12} className="animate-spin" /> : <step.icon size={12} />}
              {step.label}
            </div>
            {index < STEPS.length - 1 ? <ArrowRight size={12} className="text-slate-300" /> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("input");
  const [file, setFile] = useState<File | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [lowDemoActive, setLowDemoActive] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const hasResume = Boolean(file) || demoActive || lowDemoActive || pastedText.trim().length >= LIMITS.minResumeChars;
  const ready = hasResume && jobDescription.trim().length >= LIMITS.minJobDescriptionChars;

  async function analyze(override?: AnalyzeOverride) {
    const jd = override?.jobDescription ?? jobDescription;
    const resumeOverride = override?.resumeText ?? null;
    if (!override && !ready) return;
    if (jd.trim().length < LIMITS.minJobDescriptionChars) {
      setError("Add a job description with at least 40 characters before analyzing.");
      return;
    }

    setError(null);
    setStage("analyzing");
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setProgress(Math.min(92, (Date.now() - startedAt) / 18));
    }, 60);

    try {
      const fetchAnalysis = async (): Promise<AnalysisResult> => {
        let response: Response;
        const useFile = !resumeOverride && file && !demoActive && !lowDemoActive && pastedText.trim().length === 0;
        if (useFile) {
          const formData = new FormData();
          formData.append("resume", file);
          formData.append("jobDescription", jd);
          response = await fetch("/api/analyze", { method: "POST", body: formData, signal: controller.signal });
        } else {
          const resumeText = resumeOverride ?? (demoActive ? DEMO_RESUME_TEXT : pastedText);
          response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resumeText,
              jobDescription: jd,
              fileName: override?.fileName ?? (demoActive ? "Demo resume (sample text)" : "Pasted resume text"),
              fileType: "text",
            }),
            signal: controller.signal,
          });
        }

        const payload = (await response.json()) as AnalysisResult & { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "We could not analyze this resume. Please try again.");
        }
        return payload;
      };

      const [analysis] = await Promise.all([fetchAnalysis(), delay(1700)]);
      setResult(analysis);
      setProgress(100);
      await delay(320);
      setStage("results");
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") {
        setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
        setStage("input");
      }
    } finally {
      window.clearInterval(timer);
      abortRef.current = null;
    }
  }

  function loadOneClickDemo() {
    const jd = LOW_SCORE_SAMPLE_JOB_DESCRIPTION;
    setFile(null);
    setDemoActive(false);
    setLowDemoActive(true);
    setPastedText("");
    setJobDescription(jd);
    void analyze({ resumeText: LOW_SCORE_DEMO_RESUME, jobDescription: jd, fileName: "Low-score demo resume" });
  }

  function reset() {
    abortRef.current?.abort();
    setResult(null);
    setFile(null);
    setDemoActive(false);
    setLowDemoActive(false);
    setPastedText("");
    setJobDescription("");
    setError(null);
    setProgress(0);
    setStage("input");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
      <Header />
      <StepRail stage={stage} />

      <AnimatePresence mode="wait">
        {stage === "input" ? (
          <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <section className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                <ScanText size={14} /> Enterprise ATS analysis · instant &amp; free
              </div>
              <h1 className="font-display mx-auto max-w-3xl text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
                See exactly how a recruiter&apos;s ATS{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">reads your resume.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                Weighted four-pillar scoring, semantic keyword evidence, raw-text X-Ray and a real tailored resume builder — with a one-click low-score demo.
              </p>
            </section>

            <Card className="p-5 sm:p-6 lg:p-7">
              <div className="grid gap-7 lg:grid-cols-2 lg:gap-8">
                <ResumeUpload
                  file={file}
                  demoActive={demoActive}
                  pastedText={pastedText}
                  onFile={(next) => {
                    setFile(next);
                    if (next) setDemoActive(false);
                  }}
                  onDemo={() => setDemoActive(true)}
                  onOneClickDemo={loadOneClickDemo}
                  onPastedText={(text) => {
                    setPastedText(text);
                    if (text.trim()) setDemoActive(false);
                  }}
                />
                <div className="lg:border-l lg:border-line lg:pl-8">
                  <JobDescriptionInput value={jobDescription} onChange={setJobDescription} onSample={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)} />
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  Parsed in this app · optional AI boost only when you configure a key
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  {error ? (
                    <div className="flex max-w-md items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
                    </div>
                  ) : null}
                  {!ready ? (
                    <p className="text-right text-[11px] text-slate-400">
                      {!hasResume ? "Add a resume or load the demo" : "Add a job description (40+ characters)"}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void analyze()}
                    disabled={!ready}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                  >
                    Analyze resume <ArrowRight size={16} className="transition-transform group-enabled:group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </Card>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: BrainCircuit, title: "Four-pillar scoring", text: "45% skills, 15% role, 20% context, 20% parsability." },
                { icon: FileSearch, title: "Recruiter's Eye X-Ray", text: "See the exact raw text your file produces." },
                { icon: BarChart3, title: "Real tailored export", text: "Rewrite, edit, copy and download a real DOCX." },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-3 rounded-xl border border-line bg-white/70 px-4 py-3.5">
                  <feature.icon size={17} className="mt-0.5 shrink-0 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{feature.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

        {stage === "analyzing" ? (
          <motion.div key="analyzing" className="py-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <AnalysisProgress progress={progress} />
          </motion.div>
        ) : null}

        {stage === "results" && result ? (
          <motion.div key="results" className="pt-2">
            <ResultsDashboard result={result} jobDescription={jobDescription} onReset={reset} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
