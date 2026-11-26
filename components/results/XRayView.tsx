"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, Eye, FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { AnalysisResult } from "@/lib/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function XRayView({ result }: { result: AnalysisResult }) {
  const { xray } = result;
  const [copied, setCopied] = useState(false);
  const parsabilityVariant = xray.parsability === "clean" ? "success" : xray.parsability === "minor-issues" ? "warning" : "danger";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(xray.rawText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Structure checks"
            subtitle="Exactly what the parser could recover from your file."
            icon={<Eye size={18} />}
            action={<Badge variant={parsabilityVariant}>{xray.parsability.replace("-", " ")}</Badge>}
          />
          <ul className="space-y-2.5">
            {xray.checks.map((check, index) => (
              <li key={`${check.label}-${index}`} className="flex items-start gap-3 rounded-lg border border-line bg-slate-50/50 px-3 py-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    check.status === "pass" ? "bg-emerald-100 text-emerald-600" : check.status === "warn" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {check.status === "pass" ? <Check size={12} /> : <AlertTriangle size={12} />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800">{check.label}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading title="Extracted metadata" subtitle="File details reported by the parser." icon={<FileText size={18} />} />
          <dl className="grid grid-cols-2 gap-3 text-xs">
            {[
              ["File", xray.metadata.fileName],
              ["Type", xray.metadata.fileType.toUpperCase()],
              ["Size", formatBytes(xray.metadata.fileSize)],
              ["Pages", xray.metadata.pages ? String(xray.metadata.pages) : "—"],
              ["Characters", String(xray.metadata.charCount)],
              ["Words", String(xray.metadata.wordCount)],
              ["Lines", String(xray.metadata.lineCount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 truncate font-semibold text-slate-700" title={value}>{value}</dd>
              </div>
            ))}
          </dl>
          {xray.layoutFlags.length ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-800"><Info size={13} /> Layout flags</p>
              <ul className="list-inside list-disc space-y-1 text-[11px] text-amber-700">
                {xray.layoutFlags.map((flag) => <li key={flag}>{flag}</li>)}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="flex min-h-[420px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-slate-50/70 px-5 py-4">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">Raw extracted text</h3>
            <p className="mt-0.5 text-xs text-slate-500">This is exactly what the ATS sees — whitespace preserved.</p>
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="max-h-[620px] flex-1 overflow-auto whitespace-pre-wrap break-words bg-white px-5 py-4 font-mono text-[11px] leading-[1.7] text-slate-700">
          {xray.rawText}
        </pre>
      </Card>
    </div>
  );
}
