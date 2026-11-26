"use client";

import { AlertTriangle, Check, Hash, Lightbulb, ListChecks, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { AnalysisResult, BulletAnalysis } from "@/lib/types";

const ratingStyles = {
  strong: "border-emerald-200 bg-emerald-50/60",
  medium: "border-amber-200 bg-amber-50/50",
  weak: "border-rose-200 bg-rose-50/50",
} as const;

const ratingIconStyles = {
  strong: "bg-emerald-100 text-emerald-600",
  medium: "bg-amber-100 text-amber-600",
  weak: "bg-rose-100 text-rose-600",
} as const;

function BulletRow({ bullet }: { bullet: BulletAnalysis }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${ratingStyles[bullet.rating]}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ratingIconStyles[bullet.rating]}`}>
          {bullet.rating === "strong" ? <Check size={12} /> : <AlertTriangle size={12} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-relaxed text-slate-800">{bullet.text}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bullet.metrics.map((metric) => (
              <span key={metric} className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-100">{metric}</span>
            ))}
            {bullet.strongVerb ? <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">verb: {bullet.strongVerb}</span> : null}
            {bullet.weakPhrase ? <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-rose-100">weak: {bullet.weakPhrase}</span> : null}
            {bullet.repeated ? <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">repeated opener</span> : null}
          </div>
          {bullet.tip ? <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{bullet.tip}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function ImpactAudit({ result }: { result: AnalysisResult }) {
  const { impact, breakdown } = result;
  const strong = impact.bullets.filter((bullet) => bullet.rating === "strong");
  const weak = impact.bullets.filter((bullet) => bullet.rating === "weak");
  const medium = impact.bullets.filter((bullet) => bullet.rating === "medium");
  const strongCount = impact.bullets.filter((bullet) => bullet.strongVerb).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Word count", value: String(impact.wordCount), hint: impact.wordCountStatus === "ideal" ? "Ideal 350–850" : "Outside 350–850", icon: Hash, tone: impact.wordCountStatus === "ideal" ? "text-emerald-600" : "text-amber-600" },
          { label: "Metric bullets", value: String(impact.metricBulletCount), hint: `of ${impact.bullets.length} detected`, icon: TrendingUp, tone: "text-indigo-600" },
          { label: "Action verbs", value: String(strongCount), hint: "strong openings", icon: Zap, tone: "text-emerald-600" },
          { label: "Stuffing flags", value: String(impact.stuffing.length), hint: "repetition warnings", icon: AlertTriangle, tone: impact.stuffing.length ? "text-rose-600" : "text-emerald-600" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className={`font-display mt-1 text-2xl font-extrabold ${item.tone}`}>{item.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
              </div>
              <item.icon size={17} className={item.tone} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Line-by-line bullet impact"
            subtitle="Your actual resume bullets, grouped by quantified strength with exact improvement tips."
            icon={<ListChecks size={18} />}
            action={<Badge variant="brand">Context & impact {breakdown.contextImpact}%</Badge>}
          />
          <div className="space-y-5">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <Check size={14} /> Strong quantified bullets ({strong.length})
              </p>
              <div className="space-y-2.5">
                {strong.length ? strong.map((bullet) => <BulletRow key={bullet.index} bullet={bullet} />) : <p className="rounded-lg border border-line bg-slate-50 px-4 py-4 text-xs text-slate-400">No bullets yet combine an action verb with a metric.</p>}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-700">
                <AlertTriangle size={14} /> Weak bullets needing metrics ({weak.length})
              </p>
              <div className="space-y-2.5">
                {weak.length ? weak.map((bullet) => <BulletRow key={bullet.index} bullet={bullet} />) : <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-xs font-medium text-emerald-700">No weak bullets detected.</p>}
              </div>
            </div>
            {medium.length ? (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                  <Zap size={14} /> Nearly there ({medium.length})
                </p>
                <div className="space-y-2.5">{medium.map((bullet) => <BulletRow key={bullet.index} bullet={bullet} />)}</div>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Anti-stuffing audit"
              subtitle="Words repeated more than 4 times reduce trust and score."
              icon={<AlertTriangle size={18} className="text-rose-500" />}
            />
            {impact.stuffing.length ? (
              <div className="space-y-3">
                {impact.stuffing.map((flag, index) => (
                  <div key={`${flag.keyword}-${index}`} className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-rose-800">{flag.keyword}</p>
                      <Badge variant="danger">{flag.count}×</Badge>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-rose-700">{flag.reason}</p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{flag.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-700">
                No keyword stuffing detected. Your keyword density reads naturally.
              </p>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading title="Essential sections" subtitle="A recruiter expects these at a glance." icon={<ListChecks size={18} />} />
            <ul className="space-y-2">
              {impact.sections.map((section) => (
                <li key={section.label} className="flex items-center gap-2.5 text-xs">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${section.present ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                    {section.present ? <Check size={12} /> : <AlertTriangle size={12} />}
                  </span>
                  <span className={`font-semibold ${section.present ? "text-slate-700" : "text-rose-700"}`}>{section.label}</span>
                  <span className="ml-auto truncate text-[10px] text-slate-400" title={section.detail}>{section.present ? "Found" : "Missing"}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="border-indigo-200 bg-indigo-50/40 p-5 sm:p-6">
        <SectionHeading title="Action plan" subtitle="Prioritized next steps from this analysis." icon={<Lightbulb size={18} className="text-indigo-600" />} />
        <ol className="grid gap-2 sm:grid-cols-2">
          {impact.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{index + 1}</span>
              {suggestion}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
