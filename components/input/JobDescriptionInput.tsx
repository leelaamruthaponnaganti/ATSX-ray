"use client";

import { FileText, RotateCcw, Sparkles } from "lucide-react";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSample: () => void;
}

export function JobDescriptionInput({ value, onChange, onSample }: JobDescriptionInputProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">2</span>
          <h2 className="font-display text-sm font-bold text-slate-900">Target job description</h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onSample}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            <Sparkles size={13} /> Load sample JD
          </button>
          {value ? (
            <button
              type="button"
              aria-label="Clear job description"
              onClick={() => onChange("")}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <RotateCcw size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative flex-1">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste the job description here. Include requirements and responsibilities for the most accurate match…"
          className="h-full min-h-[280px] w-full resize-y rounded-xl border border-line bg-slate-50/60 px-4 py-3.5 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
        />
        {!value ? (
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 text-[11px] text-slate-400">
            <FileText size={13} /> Requirements, skills and responsibilities work best
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>{value.trim().length} characters</span>
        <span className={value.trim().length >= 40 ? "font-semibold text-emerald-600" : ""}>
          {value.trim().length >= 40 ? "Ready" : "At least 40 characters"}
        </span>
      </div>
    </div>
  );
}
