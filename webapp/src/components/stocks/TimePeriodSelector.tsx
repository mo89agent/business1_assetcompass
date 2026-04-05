"use client";

import { cn } from "@/lib/utils";

export const TIME_PERIODS = ["1W", "1M", "3M", "6M", "1Y", "3Y", "All"] as const;
export type TimePeriod = (typeof TIME_PERIODS)[number];

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

export function TimePeriodSelector({ value, onChange, className }: TimePeriodSelectorProps) {
  return (
    <div className={cn("flex gap-1 bg-slate-100 rounded-lg p-1", className)}>
      {TIME_PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-md font-medium transition-all",
            value === p
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
