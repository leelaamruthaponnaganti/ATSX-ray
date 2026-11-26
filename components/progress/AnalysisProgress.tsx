"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Check, FileSearch, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/Card";

const STEPS = [
  { label: "Extracting raw text…", detail: "Reading layout, columns and hidden structure", icon: FileSearch },
  { label: "Analyzing semantic match…", detail: "Comparing exact, synonym and partial matches", icon: BrainCircuit },
  { label: "Checking formatting & metrics…", detail: "Scoring bullets, sections and keyword density", icon: ScanLine },
];

export function AnalysisProgress({ progress }: { progress: number }) {
  const activeIndex = progress < 34 ? 0 : progress < 70 ? 1 : 2;

  return (
    <Card className="mx-auto w-full max-w-2xl px-6 py-10 sm:px-10">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}>
            <BrainCircuit size={26} />
          </motion.div>
        </div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900">Analyzing your resume</h2>
        <p className="mt-1.5 text-sm text-slate-500">Everything runs locally — nothing is uploaded to a third party.</p>
      </div>

      <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500"
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />
      </div>

      <div className="mt-7 space-y-3">
        {STEPS.map((step, index) => {
          const done = index < activeIndex || progress >= 100;
          const active = index === activeIndex && progress < 100;
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: done || active ? 1 : 0.45, x: 0 }}
              transition={{ delay: index * 0.12 }}
              className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 ${
                active ? "border-indigo-200 bg-indigo-50/60" : "border-line bg-slate-50/50"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  done ? "bg-emerald-100 text-emerald-600" : active ? "bg-white text-indigo-600" : "bg-white text-slate-400"
                }`}
              >
                {done ? <Check size={17} /> : <Icon size={17} />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${active || done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                <p className="text-xs text-slate-400">{step.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-7 text-center text-xs text-slate-400">{Math.min(100, Math.round(progress))}% complete</p>
    </Card>
  );
}
