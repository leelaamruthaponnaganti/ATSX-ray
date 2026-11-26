"use client";

import { motion } from "framer-motion";
import type { AnalysisResult } from "@/lib/types";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function gaugeTone(score: number) {
  if (score >= 80) return { stroke: "#059669", text: "text-emerald-600", soft: "bg-emerald-50" };
  if (score >= 65) return { stroke: "#4f46e5", text: "text-indigo-600", soft: "bg-indigo-50" };
  if (score >= 50) return { stroke: "#d97706", text: "text-amber-600", soft: "bg-amber-50" };
  return { stroke: "#e11d48", text: "text-rose-600", soft: "bg-rose-50" };
}

export function ScoreGauge({ score, verdict }: { score: number; verdict: AnalysisResult["verdict"] }) {
  const tone = gaugeTone(score);
  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
        <circle cx="66" cy="66" r={RADIUS} fill="none" stroke="#eef2f7" strokeWidth="11" />
        <motion.circle
          cx="66"
          cy="66"
          r={RADIUS}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - score / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-3xl font-extrabold tracking-tight ${tone.text}`}>{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ATS score</span>
        <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.soft} ${tone.text}`}>{verdict}</span>
      </div>
    </div>
  );
}
