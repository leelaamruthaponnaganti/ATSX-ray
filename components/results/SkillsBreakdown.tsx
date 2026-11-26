"use client";

import { AlertCircle, Check, Layers3, ShieldAlert, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { AnalysisResult, SkillMatch } from "@/lib/types";

function Metric({ label, value, tone, delay, weight }: { label: string; value: number; tone: "indigo" | "emerald" | "amber"; delay: number; weight: string }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50/50 p-4">
      <div className="mb-2.5 flex items-end justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="font-display text-lg font-extrabold text-slate-900">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} delay={delay} />
      <p className="mt-1.5 text-[10px] text-slate-400">{weight}</p>
    </div>
  );
}

function MatchCard({ item, kind }: { item: SkillMatch; kind: "exact" | "semantic" }) {
  const exact = kind === "exact";
  const styles = exact
    ? "border-emerald-200 bg-emerald-50/70"
    : "border-blue-200 bg-blue-50/70";
  const iconStyles = exact ? "text-emerald-600" : "text-blue-600";
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${styles}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {exact ? <Check size={12} className={iconStyles} /> : <Sparkles size={12} className={iconStyles} />}
        <span className={`text-xs font-bold ${exact ? "text-emerald-800" : "text-blue-800"}`}>{item.keyword}</span>
        {item.contextProof ? <Badge variant="success">In experience</Badge> : null}
        {item.importance === "critical" ? <Badge variant="danger">Critical</Badge> : null}
      </div>
      <p className={`mt-1 text-[11px] leading-relaxed ${exact ? "text-emerald-700" : "text-blue-700"}`}>
        {item.note ?? "Exact keyword found in your resume."}
      </p>
      {item.evidence ? <p className="mt-1 truncate text-[10px] text-slate-500" title={item.evidence}>“{item.evidence}”</p> : null}
    </div>
  );
}

export function SkillsBreakdown({ result }: { result: AnalysisResult }) {
  const { breakdown, skills, impact } = result;
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Enterprise ATS pillars"
          subtitle="Weighted signals modeled after Workday, Greenhouse and Lever screening behavior."
          icon={<Layers3 size={18} />}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Hard skills & domain" value={breakdown.hardSkills} tone="indigo" delay={0} weight="45% of total score" />
          <Metric label="Role & title" value={breakdown.roleAlignment} tone="emerald" delay={0.1} weight="15% of total score" />
          <Metric label="Context & impact" value={breakdown.contextImpact} tone="amber" delay={0.2} weight="20% of total score" />
          <Metric label="ATS parsability" value={breakdown.parsability} tone="indigo" delay={0.3} weight="20% of total score" />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title={`Exact matches (${skills.matched.length})`}
            subtitle="JD terminology found verbatim in your resume."
            icon={<Check size={18} className="text-emerald-600" />}
          />
          <div className="space-y-2">
            {skills.matched.length ? (
              skills.matched.map((item, index) => <MatchCard key={`${item.canonical}-${index}`} item={item} kind="exact" />)
            ) : (
              <p className="text-sm text-slate-400">No exact matches detected.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            title={`Synonym / semantic matches (${skills.semantic.length})`}
            subtitle="Acronyms and related terms earn partial, explainable credit."
            icon={<Sparkles size={18} className="text-blue-600" />}
          />
          <div className="space-y-2">
            {skills.semantic.length ? (
              skills.semantic.map((item, index) => <MatchCard key={`${item.canonical}-${index}`} item={item} kind="semantic" />)
            ) : (
              <p className="text-sm text-slate-400">No semantic matches detected.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            title={`Missing critical keywords (${skills.missing.length})`}
            subtitle="Ranked by job-description priority."
            icon={<AlertCircle size={18} className="text-rose-600" />}
          />
          <div className="space-y-2">
            {skills.missing.length ? (
              skills.missing.slice(0, 12).map((item, index) => (
                <div key={`${item.canonical}-${index}`} className="rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Target size={12} className="text-rose-600" />
                    <span className="text-xs font-bold text-rose-800">{item.keyword}</span>
                    <Badge variant={item.importance === "critical" ? "danger" : item.importance === "important" ? "warning" : "neutral"}>
                      {item.importance}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-rose-700">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Nothing missing — great coverage.</p>
            )}
          </div>
          {skills.missing.length > 12 ? <p className="mt-3 text-xs text-slate-400">+{skills.missing.length - 12} more lower-priority items.</p> : null}
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/40 p-5 sm:p-6">
        <SectionHeading
          title="Keyword stuffing guard"
          subtitle={`Any JD-relevant word repeated more than ${4} times is flagged as an over-stuffing risk.`}
          icon={<ShieldAlert size={18} className="text-amber-600" />}
          action={<Badge variant={impact.stuffing.length ? "danger" : "success"}>{impact.stuffing.length} flags · −{result.stuffingPenalty} pts</Badge>}
        />
        {impact.stuffing.length ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {impact.stuffing.map((flag, index) => (
              <div key={`${flag.keyword}-${index}`} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-amber-900">{flag.keyword}</p>
                  <Badge variant="warning">{flag.count}×</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{flag.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-700">
            No keyword stuffing detected. Keyword density reads naturally.
          </p>
        )}
      </Card>
    </div>
  );
}
