"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Eye, ListChecks, RotateCcw, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TailoredResumeBuilder } from "@/components/enhance/TailoredResumeBuilder";
import { ImpactAudit } from "./ImpactAudit";
import { ScoreGauge } from "./ScoreGauge";
import { SkillsBreakdown } from "./SkillsBreakdown";
import { Tabs, type TabItem } from "./Tabs";
import { XRayView } from "./XRayView";
import type { AnalysisResult } from "@/lib/types";

interface Props {
  result: AnalysisResult;
  jobDescription: string;
  onReset: () => void;
}

export function ResultsDashboard({ result, jobDescription, onReset }: Props) {
  const [activeTab, setActiveTab] = useState("skills");
  const [showBuilder, setShowBuilder] = useState(result.score < 65);
  const parsabilityVariant = result.xray.parsability === "clean" ? "success" : result.xray.parsability === "minor-issues" ? "warning" : "danger";

  const tabs: TabItem[] = [
    { id: "skills", label: "Match & Skills", icon: <BrainCircuit size={15} />, content: <SkillsBreakdown result={result} /> },
    { id: "xray", label: "Recruiter's Eye X-Ray", icon: <Eye size={15} />, content: <XRayView result={result} /> },
    { id: "impact", label: "Bullet Impact Auditor", icon: <ListChecks size={15} />, content: <ImpactAudit result={result} /> },
  ];

  const pillars = [
    ["Hard skills & domain", result.breakdown.hardSkills, "45% weight"],
    ["Role & title", result.breakdown.roleAlignment, "15% weight"],
    ["Context & impact", result.breakdown.contextImpact, "20% weight"],
    ["ATS parsability", result.breakdown.parsability, "20% weight"],
  ] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
            <ScoreGauge score={result.score} verdict={result.verdict} />
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={parsabilityVariant}>
                  <ShieldCheck size={12} /> Parsability: {result.xray.parsability.replace("-", " ")}
                </Badge>
                <Badge variant="brand">
                  <Sparkles size={12} /> {result.engine === "llm" ? "Hybrid + AI coaching" : "Hybrid engine"}
                </Badge>
                {result.detectedRole ? <Badge variant="neutral">Target: {result.detectedRole}</Badge> : null}
              </div>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {result.verdict === "Excellent" || result.verdict === "Good"
                  ? "Your resume is in strong shape."
                  : "Here's how to make your resume stronger."}
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">{result.scoringNote}</p>
              {result.warnings.length ? (
                <p className="mt-2 text-xs font-medium text-amber-700">{result.warnings[0]}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setShowBuilder((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <WandSparkles size={16} /> {showBuilder ? "Hide Tailored Resume Builder" : "Enhance & Build Tailored Resume"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              <RotateCcw size={15} /> Test another resume
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-line border-t border-line bg-slate-50/60 sm:grid-cols-4">
          {pillars.map(([label, value, weight]) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="font-display mt-0.5 text-base font-extrabold text-slate-800">{value}%</p>
              <p className="text-[10px] text-slate-400">{weight}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
      </Card>

      {showBuilder ? <TailoredResumeBuilder result={result} jobDescription={jobDescription} /> : null}

      <p className="pb-6 text-center text-xs text-slate-400">
        Analysis runs in this app. No account, no paywall, no keyword stuffing required.
      </p>
    </motion.div>
  );
}
