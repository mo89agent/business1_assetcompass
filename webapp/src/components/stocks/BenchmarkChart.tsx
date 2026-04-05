"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TimePeriodSelector, type TimePeriod } from "./TimePeriodSelector";

interface ChartPoint {
  date: string;
  [key: string]: number | string;
}

const BENCHMARKS = [
  { key: "VWRL.L",    label: "MSCI World (VWRL)",  color: "#6366f1", enabled: true  },
  { key: "EXS1.DE",   label: "DAX (EXS1)",          color: "#f59e0b", enabled: false },
  { key: "^GSPC",     label: "S&P 500",             color: "#10b981", enabled: false },
];

const PORTFOLIO_COLOR = "#3b82f6";

// Normalise a series so the first value = 100
function normalise(data: { date: string; close: number }[]): { date: string; value: number }[] {
  if (!data.length) return [];
  const base = data[0].close;
  return data.map((d) => ({ date: d.date, value: Math.round((d.close / base) * 10000) / 100 }));
}

// Fetch historical data from our Yahoo route
async function fetchHistory(symbol: string, period: TimePeriod) {
  const res = await fetch(`/api/yahoo/history?symbol=${encodeURIComponent(symbol)}&period=${period}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.history ?? []) as { date: string; close: number }[];
}

// Merge multiple normalised series on date keys
function mergeSeries(series: { key: string; data: { date: string; value: number }[] }[]): ChartPoint[] {
  const dateMap: Map<string, ChartPoint> = new Map();
  for (const s of series) {
    for (const d of s.data) {
      const row = dateMap.get(d.date) ?? { date: d.date };
      row[s.key] = d.value;
      dateMap.set(d.date, row);
    }
  }
  return Array.from(dateMap.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string));
}

// Synthetic portfolio performance (demo — grows ~12% per year with noise)
function generatePortfolioHistory(period: TimePeriod): { date: string; close: number }[] {
  const periodDays: Record<TimePeriod, number> = {
    "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "3Y": 1095, "All": 1825,
  };
  const days = periodDays[period];
  const now = new Date();
  const result: { date: string; close: number }[] = [];
  const annualReturn = 0.12;
  const base = 100;

  for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 100))) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const t = (days - i) / 365;
    const noise = Math.sin(i * 0.3) * 2.5 + Math.cos(i * 0.07) * 1.5;
    const price = base * Math.exp(annualReturn * t) + noise;
    result.push({ date: d.toISOString().split("T")[0], close: price });
  }
  return result;
}

interface BenchmarkChartProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function BenchmarkChart({ title = "Portfolio vs. Benchmark", subtitle, className }: BenchmarkChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("1Y");
  const [enabledBenchmarks, setEnabledBenchmarks] = useState<Set<string>>(
    new Set(BENCHMARKS.filter((b) => b.enabled).map((b) => b.key))
  );
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const portfolioRaw = generatePortfolioHistory(period);
      const portfolioNorm = normalise(portfolioRaw);
      const toFetch = BENCHMARKS.filter((b) => enabledBenchmarks.has(b.key));

      const benchResults = await Promise.allSettled(
        toFetch.map((b) => fetchHistory(b.key, period))
      );

      if (cancelled) return;

      const series: { key: string; data: { date: string; value: number }[] }[] = [
        { key: "portfolio", data: portfolioNorm },
      ];

      benchResults.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.length > 0) {
          series.push({ key: toFetch[i].key, data: normalise(r.value) });
        }
      });

      setChartData(mergeSeries(series));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [period, enabledBenchmarks]);

  function toggleBenchmark(key: string) {
    setEnabledBenchmarks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const activeLines = [
    { key: "portfolio", label: "Mein Portfolio", color: PORTFOLIO_COLOR },
    ...BENCHMARKS.filter((b) => enabledBenchmarks.has(b.key)),
  ];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          <p className="text-xs text-slate-400 mt-0.5">Indexiert auf 100 beim Startzeitpunkt</p>
        </div>
        <TimePeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Benchmark toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {BENCHMARKS.map((b) => (
          <button
            key={b.key}
            onClick={() => toggleBenchmark(b.key)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              enabledBenchmarks.has(b.key)
                ? "border-current font-medium"
                : "border-slate-200 text-slate-400 bg-slate-50"
            }`}
            style={enabledBenchmarks.has(b.key) ? { color: b.color, borderColor: b.color, backgroundColor: `${b.color}10` } : {}}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: enabledBenchmarks.has(b.key) ? b.color : "#cbd5e1" }}
            />
            {b.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
          Lade Kursdaten…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const d = new Date(v);
                return period === "1W" || period === "1M"
                  ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
                  : d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
              width={38}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
              formatter={(value, name) => {
                const bench = BENCHMARKS.find((b) => b.key === name);
                const label = bench?.label ?? (name === "portfolio" ? "Mein Portfolio" : String(name));
                return [`${Number(value).toFixed(1)}`, label];
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString("de-DE", { dateStyle: "medium" })}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => {
                const bench = BENCHMARKS.find((b) => b.key === value);
                return bench?.label ?? (value === "portfolio" ? "Mein Portfolio" : value);
              }}
            />
            {activeLines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                strokeWidth={l.key === "portfolio" ? 2.5 : 1.5}
                dot={false}
                strokeDasharray={l.key === "portfolio" ? undefined : "4 2"}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
