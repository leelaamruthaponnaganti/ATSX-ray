import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
      {...props}
    />
  );
}
