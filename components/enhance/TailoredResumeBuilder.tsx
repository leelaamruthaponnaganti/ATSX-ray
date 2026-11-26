"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { gaugeTone } from "@/components/results/ScoreGauge";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import type { AnalysisResult, EnhanceResponse, ExperienceLevel } from "@/lib/types";

function inferLevel(text: string): ExperienceLevel {
  const match = /\b(\d{1,2})\+?\s+years?\b/i.exec(text);
  if (!match) return "Fresher / Graduate";
  const years = Number(match[1]);
  if (years <= 1) return "Fresher / Graduate";
  if (years <= 3) return "1–3 Years";
  return "3+ Years";
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "tailored-resume";
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Props {
  result: AnalysisResult;
  jobDescription: string;
}

export function TailoredResumeBuilder({ result, jobDescription }: Props) {
  const [targetRole, setTargetRole] = useState(result.detectedRole ?? "");
  const [targetCompany, setTargetCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(() => inferLevel(result.xray.rawText));
  const [enhancedText, setEnhancedText] = useState("");
  const [response, setResponse] = useState<EnhanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"docx" | "txt" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileName = `${slug(targetRole || "target-role")}-${slug(targetCompany || "company")}-tailored-resume`;

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: result.xray.rawText,
          jobDescription,
          targetRole,
          targetCompany,
          experienceLevel,
          missingKeywords: result.skills.missing.map((item) => item.keyword),
          beforeScore: result.score,
        }),
      });
      const data = (await res.json()) as EnhanceResponse & { error?: { message?: string } };
      if (!res.ok) throw new Error(data?.error?.message ?? "We could not tailor this resume. Please try again.");
      setResponse(data);
      setEnhancedText(data.enhancedText);
      setCopied(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!enhancedText) return;
    try {
      await navigator.clipboard.writeText(enhancedText);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = enhancedText;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadTxt() {
    if (!enhancedText) return;
    setExporting("txt");
    triggerDownload(new Blob([enhancedText], { type: "text/plain;charset=utf-8" }), `${fileName}.txt`);
    window.setTimeout(() => setExporting(null), 400);
  }

  async function downloadDocx() {
    if (!enhancedText) return;
    setExporting("docx");
    setError(null);
    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: enhancedText, fileName }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(data?.error?.message ?? "DOCX export failed.");
      }
      triggerDownload(await res.blob(), `${fileName}.docx`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "DOCX export failed.");
    } finally {
      setExporting(null);
    }
  }

  const projectedTone = response ? gaugeTone(response.projectedScore) : null;

  return (
    <Card className="border-indigo-200 bg-indigo-50/30 p-5 sm:p-6">
      <SectionHeading
        title="Tailored Resume Builder"
        subtitle="Uses your actual extracted resume, the missing JD keywords, and your target role and company."
        icon={<Sparkles size={18} className="text-indigo-600" />}
        action={<Badge variant="brand">{result.score < 65 ? "Recommended for this score" : "Available anytime"}</Badge>}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Target Role</span>
          <input
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="Senior Frontend Engineer"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Target Company</span>
          <input
            value={targetCompany}
            onChange={(event) => setTargetCompany(event.target.value)}
            placeholder="Onebridge"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Experience Level</span>
          <select
            value={experienceLevel}
            onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={loading || !targetRole.trim() || !targetCompany.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Building tailored resume…" : enhancedText ? "Regenerate Tailored Resume" : "Generate Tailored Resume"}
        </button>
        <span className="text-[11px] text-slate-500">Works offline. Uses Gemini/OpenAI automatically when a key is configured.</span>
      </div>

      {error ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
        </p>
      ) : null}

      {response ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">
            <span className="font-display text-2xl font-extrabold text-slate-400">{response.beforeScore}%</span>
            <span className="text-lg font-bold text-slate-300">→</span>
            <span className={`font-display text-3xl font-extrabold ${projectedTone?.text ?? "text-emerald-600"}`}>
              {response.projectedScore}%
            </span>
            <Badge variant="success">Projected Match</Badge>
            <span className="ml-auto text-[11px] font-semibold text-slate-500">
              +{Math.max(0, response.projectedScore - response.beforeScore)} points · {response.engine} engine
            </span>
          </div>

          {response.warnings.length ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] leading-relaxed text-amber-800">
              {response.warnings.map((warning) => <p key={warning}>• {warning}</p>)}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800"><CheckCircle2 size={14} className="text-emerald-600" /> What changed</p>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                {response.changes.map((change) => <li key={change}>• {change}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800"><FileText size={14} className="text-indigo-600" /> Keywords woven</p>
              <div className="flex flex-wrap gap-1.5">
                {response.keywordsWoven.length ? (
                  response.keywordsWoven.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">{keyword}</span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">Added to Technical Skills only.</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-800">Edit your tailored resume</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  {copied ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadTxt}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
                >
                  <Download size={13} /> Download .txt
                </button>
                <button
                  type="button"
                  onClick={downloadDocx}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {exporting === "docx" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Download .docx
                </button>
              </div>
            </div>
            <textarea
              value={enhancedText}
              onChange={(event) => setEnhancedText(event.target.value)}
              rows={22}
              spellCheck={false}
              aria-label="Editable tailored resume"
              className="w-full resize-y rounded-xl border border-line bg-white px-4 py-3 font-mono text-[11px] leading-[1.7] text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
