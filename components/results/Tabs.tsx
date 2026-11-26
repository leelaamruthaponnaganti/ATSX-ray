"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

export function Tabs({ items, active, onChange }: { items: TabItem[]; active: string; onChange: (id: string) => void }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-line pb-1" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            onClick={() => onChange(item.id)}
            className={`relative inline-flex items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active === item.id ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {item.icon}
            {item.label}
            {active === item.id ? (
              <motion.span
                layoutId="active-tab"
                className="absolute inset-x-2 -bottom-[5px] h-0.5 rounded-full bg-indigo-600"
              />
            ) : null}
          </button>
        ))}
      </div>
      <motion.div
        key={active}
        role="tabpanel"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {items.find((item) => item.id === active)?.content}
      </motion.div>
    </div>
  );
}
