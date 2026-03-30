"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PerformancePoint } from "@/lib/types";

interface PerformanceChartProps {
  data: PerformancePoint[];
  currency: string;
}

const PERIODS = ["1M", "3M", "6M", "1Y", "All"] as const;
type Period = typeof PERIODS[number];

const BENCHMARKS = [
  { label: "Kein Vergleich",     symbol: null },
  { label: "MSCI World (IWDA)", symbol: "IWDA.AS" },
  { label: "MSCI ACWI (VWRL)",  symbol: "VWRL.AS" },
  { label: "S&P 500 (SPY)",      symbol: "SPY" },
  { label: "DAX (EXS1.DE)",      symbol: "EXS1.DE" },
  { label: "NASDAQ-100 (QQQ)",   symbol: "QQQ" },
] as const;

function filterByPeriod(data: PerformancePoint[], period: Period): PerformancePoint[] {
  if (period === "All" || data.length === 0) return data;
  const now = new Date(data[data.length - 1].date);
  const cutoff = new Date(now);
  if (period === "1M") cutoff.setMonth(cutoff.getMonth() - 1);
  else if (period === "3M") cutoff.setMonth(cutoff.getMonth() - 3);
  else if (period === "6M") cutoff.setMonth(cutoff.getMonth() - 6);
  else if (period === "1Y") cutoff.setFullYear(cutoff.getFullYear() - 1);
  return data.filter((p) => new Date(p.date) >= cutoff);
}

export function PerformanceChart({ data, currency }: PerformanceChartProps) {
  const [activePeriod, setActivePeriod] = useState<Period>("1Y");
  const [benchmarkSymbol, setBenchmarkSymbol] = useState<string | null>(null);
  const [benchHistory, setBenchHistory] = useState<Array<{ date: string; close: number }>>([]);
  const [benchLoading, setBenchLoading] = useState(false);

  const filtered = useMemo(() => filterByPeriod(data, activePeriod), [data, activePeriod]);

  const first = filtered[0]?.value ?? 0;
  const last = filtered[filtered.length - 1]?.value ?? 0;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const isPositive = change >= 0;

  // Fetch benchmark history when symbol or period changes
  useEffect(() => {
    if (!benchmarkSymbol) { setBenchHistory([]); return; }
    setBenchLoading(true);
    fetch(`/api/yahoo/history?symbol=${encodeURIComponent(benchmarkSymbol)}&period=${activePeriod}`)
      .then((r) => r.json())
      .then((d: { history?: Array<{ date: string; close: number }> }) => {
        setBenchHistory(d.history ?? []);
      })
      .catch(() => setBenchHistory([]))
      .finally(() => setBenchLoading(false));
  }, [benchmarkSymbol, activePeriod]);

  // Normalise benchmark to portfolio start value and build date map
  const benchMap = useMemo(() => {
    if (!benchHistory.length || !filtered.length) return {} as Record<string, number>;
    const portfolioStart = filtered[0].value;
    const benchStart = benchHistory[0].close;
    if (!benchStart) return {} as Record<string, number>;
    const map: Record<string, number> = {};
    for (const b of benchHistory) {
      map[b.date] = (b.close / benchStart) * portfolioStart;
    }
    return map;
  }, [filtered, benchHistory]);

  const chartData = useMemo(() =>
    filtered.map((p) => ({ ...p, benchmark: benchMap[p.date] ?? null })),
    [filtered, benchMap],
  );

  // Benchmark performance stats
  const benchVals = Object.values(benchMap);
  const benchChangePct = benchVals.length >= 2 && benchVals[0]
    ? ((benchVals[benchVals.length - 1] - benchVals[0]) / benchVals[0]) * 100
    : null;

  const selectedBenchLabel = BENCHMARKS.find((b) => b.symbol === benchmarkSymbol)?.label ?? null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Net Worth History</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">{formatCurrency(last, currency)}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {isPositive ? "+" : ""}{changePct.toFixed(1)}%
              </span>
            </div>
            {/* Benchmark badge */}
            {benchChangePct != null && selectedBenchLabel && (
              <div className="flex items-center gap-1.5 text-xs">
                <svg width="16" height="8" className="shrink-0">
                  <line x1="0" y1="4" x2="16" y2="4" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 2" />
                </svg>
                <span className="text-slate-500">{selectedBenchLabel}:</span>
                <span className={`font-semibold ${benchChangePct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {benchChangePct >= 0 ? "+" : ""}{benchChangePct.toFixed(1)}%
                </span>
                {benchLoading && <span className="text-slate-300">…</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Period buttons */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`text-xs px-2 py-1 rounded-md transition ${activePeriod === p ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {p}
              </button>
            ))}
          </div>
          {/* Benchmark dropdown */}
          <select
            value={benchmarkSymbol ?? ""}
            onChange={(e) => setBenchmarkSymbol(e.target.value || null)}
            className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-400 cursor-pointer"
          >
            {BENCHMARKS.map((b) => (
              <option key={b.symbol ?? "none"} value={b.symbol ?? ""}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatDate(v).slice(3)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}
            width={45}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            formatter={(value, name) => [
              formatCurrency(Number(value), currency),
              name === "benchmark" ? (selectedBenchLabel ?? "Benchmark") : "Mein Portfolio",
            ]}
            labelFormatter={(label) => formatDate(label)}
          />
          {/* Portfolio area */}
          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#netWorthGrad)" dot={false} name="portfolio" />
          {/* Benchmark dashed line */}
          {benchmarkSymbol && (
            <Line type="monotone" dataKey="benchmark" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls name="benchmark" />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {benchmarkSymbol && (
        <p className="text-[10px] text-slate-400 mt-2 text-right">
          Benchmark auf gleichen Startwert normalisiert · Quelle: Yahoo Finance
        </p>
      )}
    </div>
  );
}
