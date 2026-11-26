"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ClipboardPaste, FileText, RotateCcw, Sparkles, UploadCloud, X } from "lucide-react";
import { LIMITS } from "@/lib/constants";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ResumeUploadProps {
  file: File | null;
  demoActive: boolean;
  pastedText: string;
  onFile: (file: File | null) => void;
  onDemo: () => void;
  onOneClickDemo: () => void;
  onPastedText: (text: string) => void;
}

export function ResumeUpload({
  file,
  demoActive,
  pastedText,
  onFile,
  onDemo,
  onOneClickDemo,
  onPastedText,
}: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    setLocalError(null);
    const extension = candidate.name.toLowerCase().split(".").pop();
    if (extension !== "pdf" && extension !== "docx") {
      setLocalError("Please choose a PDF or DOCX file.");
      return;
    }
    if (candidate.size > LIMITS.maxFileBytes) {
      setLocalError("That file is over 10 MB. Try a smaller export or paste the text instead.");
      return;
    }
    onPastedText("");
    onFile(candidate);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">1</span>
        <h2 className="font-display text-sm font-bold text-slate-900">Your resume</h2>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files[0]);
        }}
        onClick={openPicker}
        className={`group flex min-h-[188px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-7 text-center transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 ${
          dragging ? "border-indigo-500 bg-indigo-50/70" : "border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(event) => {
            acceptFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-transform group-hover:-translate-y-0.5">
          <UploadCloud size={21} />
        </div>
        <p className="text-sm font-semibold text-slate-800">Drop your resume here</p>
        <p className="mt-1.5 text-xs text-slate-400">PDF or DOCX · up to 10 MB · text-based files</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openPicker();
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <UploadCloud size={13} /> Choose File
        </button>
      </div>

      {localError ? <p className="mt-2 text-xs font-medium text-rose-600">{localError}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOneClickDemo}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >
          <Sparkles size={14} /> Load 1-Click Sample Demo
        </button>
        <button
          type="button"
          onClick={() => {
            onDemo();
            onFile(null);
            onPastedText("");
            setLocalError(null);
            setPasteMode(false);
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
            demoActive
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-line bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
          }`}
        >
          {demoActive ? <CheckCircle2 size={14} /> : <FileText size={14} />}
          {demoActive ? "Sample resume loaded" : "Load sample resume"}
        </button>
        <button
          type="button"
          onClick={() => setPasteMode((mode) => !mode)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
            pasteMode ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-line bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
          }`}
        >
          <ClipboardPaste size={14} /> Paste text
        </button>
      </div>

      {pasteMode ? (
        <textarea
          value={pastedText}
          onChange={(event) => {
            onPastedText(event.target.value);
            onFile(null);
          }}
          placeholder="Paste your resume text here…"
          rows={4}
          className="mt-3 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
        />
      ) : null}

      {file ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2.5">
          <FileText size={17} className="shrink-0 text-indigo-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800">{file.name}</p>
            <p className="text-[11px] text-slate-500">{formatBytes(file.size)} · ready to analyze</p>
          </div>
          <span className="rounded-md border border-indigo-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
            {file.name.toLowerCase().split(".").pop()}
          </span>
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-white"
          >
            <RotateCcw size={12} /> Change File
          </button>
          <button
            type="button"
            aria-label="Remove resume"
            onClick={() => onFile(null)}
            className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-rose-500"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
