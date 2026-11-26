import { motion } from "framer-motion";

export function ProgressBar({
  value,
  tone = "indigo",
  delay = 0,
}: {
  value: number;
  tone?: "indigo" | "emerald" | "amber" | "rose";
  delay?: number;
}) {
  const tones = {
    indigo: "from-indigo-500 to-indigo-400",
    emerald: "from-emerald-500 to-emerald-400",
    amber: "from-amber-500 to-amber-400",
    rose: "from-rose-500 to-rose-400",
  } as const;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${tones[tone]}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay }}
      />
    </div>
  );
}
