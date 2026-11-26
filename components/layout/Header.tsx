import { ScanText, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20">
          <ScanText size={20} strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-display text-[15px] font-extrabold tracking-tight text-slate-900">
            ATS<span className="text-indigo-600">Xray</span>
          </div>
          <div className="text-[11px] font-medium tracking-wide text-slate-400">RESUME INTELLIGENCE</div>
        </div>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <Sparkles size={13} /> 100% free
        </span>
        <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
          No sign-up · No paywall
        </span>
      </div>
    </header>
  );
}
