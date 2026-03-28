"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { EtfExposure } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Database, Info } from "lucide-react";
import { SourceChip } from "@/components/ui/SourceChip";

interface Props {
  exposure: EtfExposure;
}

const GEO_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9",
];

const SECTOR_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f97316", "#ec4899",
  "#eab308", "#ef4444", "#14b8a6", "#a855f7", "#64748b", "#0ea5e9",
];

function HorizontalBars({
  data,
  colors,
  valueFormatter = (v: number) => `${v.toFixed(1)}%`,
}: {
  data: { label: string; pct: number }[];
  colors: string[];
  valueFormatter?: (v: number) => string;
}) {
  const maxPct = Math.max(...data.map((d) => d.pct));
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-36 shrink-0 text-right">
            <span className="text-xs text-slate-600 truncate">{item.label}</span>
          </div>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.pct / maxPct) * 100}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-10 text-right shrink-0">
            {valueFormatter(item.pct)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EtfLookthrough({ exposure }: Props) {
  return (
    <div className="space-y-6">
      {/* Header / metadata */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {exposure.totalHoldings.toLocaleString("de-DE")} Einzelpositionen im ETF
            </p>
            <p className="text-xs text-slate-400">
              Datenstand: {formatDate(exposure.asOf)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SourceChip source={exposure.source} />
        </div>
      </div>

      {/* Two-column layout for geo + sector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Geography */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Geografische Allokation</h3>
          <HorizontalBars data={exposure.geographyBreakdown} colors={GEO_COLORS} />
        </div>

        {/* Sector */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Sektorallokation</h3>
          <HorizontalBars data={exposure.sectorBreakdown} colors={SECTOR_COLORS} />
        </div>
      </div>

      {/* Top holdings */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Top-10-Positionen</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Größte Einzelwerte nach Gewichtung im Index
          </p>
        </div>
        <div className="divide-y divide-slate-50">
          {exposure.topHoldings.map((h) => (
            <div key={h.rank} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
              {/* Rank */}
              <span className="w-5 text-center text-[10px] font-semibold text-slate-400">{h.rank}</span>

              {/* Name + ticker */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {h.ticker && (
                    <span className="text-[10px] font-mono text-slate-400">{h.ticker}</span>
                  )}
                  {h.country && (
                    <span className="text-[10px] text-slate-400">{h.country}</span>
                  )}
                  {h.sector && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-500">
                      {h.sector}
                    </span>
                  )}
                </div>
              </div>

              {/* Weight bar + value */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 bg-slate-100 rounded-full h-1.5 hidden md:block">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{ width: `${Math.min((h.weightPct / exposure.topHoldings[0].weightPct) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-10 text-right">
                  {h.weightPct.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Overlap note */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info size={11} />
            Top-10 repräsentieren{" "}
            <strong>
              {exposure.topHoldings.reduce((s, h) => s + h.weightPct, 0).toFixed(1)}%
            </strong>{" "}
            des ETF-Wertes. Overlap-Analyse mit anderen Positionen folgt in einem späteren Update.
          </p>
        </div>
      </div>
    </div>
  );
}
