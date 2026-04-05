"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LineChart, Line, Legend,
  ComposedChart, Area,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AssetClass } from "@/lib/types";

interface PricePoint { date: string; close: number }

interface Props {
  ticker: string | null;
  assetClass: AssetClass;
  currency: string;
}

function yahooTicker(ticker: string | null, assetClass: AssetClass): string | null {
  if (!ticker) return null;
  if (assetClass === "CRYPTO") return ticker.replace(/-USD$/, "") + "-USD";
  return ticker;
}

// Aggregate weekly data into monthly returns
function toMonthlyReturns(data: PricePoint[]): Array<{ month: string; ret: number; abs: number }> {
  if (data.length < 2) return [];
  // Group by YYYY-MM, take last close of each month
  const byMonth: Record<string, number> = {};
  for (const d of data) {
    const m = d.date.slice(0, 7);
    byMonth[m] = d.close; // overwrite → keeps last close of month
  }
  const months = Object.keys(byMonth).sort();
  const result: Array<{ month: string; ret: number; abs: number }> = [];
  for (let i = 1; i < months.length; i++) {
    const prev = byMonth[months[i - 1]];
    const curr = byMonth[months[i]];
    const ret = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    result.push({ month: months[i].slice(0, 7), ret: parseFloat(ret.toFixed(2)), abs: curr });
  }
  return result.slice(-24); // last 24 months
}

// Compute simple moving average
function movingAvg(data: PricePoint[], window: number): Array<{ date: string; ma: number }> {
  const result: Array<{ date: string; ma: number }> = [];
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    const avg = slice.reduce((s, d) => s + d.close, 0) / window;
    result.push({ date: data[i].date, ma: parseFloat(avg.toFixed(2)) });
  }
  return result;
}

type ChartTab = "monthly" | "ma" | "dist";

export function PositionReturnChart({ ticker, assetClass, currency }: Props) {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ChartTab>("monthly");
  const sym = yahooTicker(ticker, assetClass);

  useEffect(() => {
    if (!sym) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/yahoo/history?symbol=${encodeURIComponent(sym)}&period=3Y`)
      .then((r) => r.json())
      .then((d: { history?: PricePoint[] }) => setPriceData(d.history ?? []))
      .catch(() => setPriceData([]))
      .finally(() => setLoading(false));
  }, [sym]);

  const monthlyReturns = useMemo(() => toMonthlyReturns(priceData), [priceData]);

  const ma50Data = useMemo(() => movingAvg(priceData, 10), [priceData]); // 10 weeks ≈ 50 days
  const ma200Data = useMemo(() => movingAvg(priceData, 40), [priceData]); // 40 weeks ≈ 200 days

  // Merge price + MA lines
  const maChartData = useMemo(() => {
    const ma50Map = new Map(ma50Data.map((d) => [d.date, d.ma]));
    const ma200Map = new Map(ma200Data.map((d) => [d.date, d.ma]));
    return priceData.slice(-104).map((d) => ({  // last 2 years
      date: d.date.slice(0, 7),
      price: d.close,
      ma50: ma50Map.get(d.date) ?? null,
      ma200: ma200Map.get(d.date) ?? null,
    }));
  }, [priceData, ma50Data, ma200Data]);

  // Return distribution (histogram buckets)
  const distribution = useMemo(() => {
    if (!monthlyReturns.length) return [];
    const buckets: Record<string, number> = {};
    const step = 2;
    for (const { ret } of monthlyReturns) {
      const bucket = Math.floor(ret / step) * step;
      const key = `${bucket >= 0 ? "+" : ""}${bucket}%`;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
    return Object.entries(buckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => parseFloat(a.range) - parseFloat(b.range));
  }, [monthlyReturns]);

  // Stats
  const positiveMonths = monthlyReturns.filter((m) => m.ret > 0).length;
  const avgReturn = monthlyReturns.length
    ? monthlyReturns.reduce((s, m) => s + m.ret, 0) / monthlyReturns.length
    : 0;
  const bestMonth = monthlyReturns.reduce((best, m) => m.ret > best ? m.ret : best, -Infinity);
  const worstMonth = monthlyReturns.reduce((worst, m) => m.ret < worst ? m.ret : worst, Infinity);

  if (!sym) return null;

  const TABS: { id: ChartTab; label: string }[] = [
    { id: "monthly", label: "Monatsrenditen" },
    { id: "ma",      label: "MA 50 / 200" },
    { id: "dist",    label: "Verteilung" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      {/* Header + tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Rendite-Analyse</h3>
        <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition",
                tab === t.id ? "bg-white text-slate-800 font-medium shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="h-44 flex items-center justify-center text-slate-300 text-sm">Lade Kursdaten…</div>
      )}

      {/* Stats strip */}
      {!loading && monthlyReturns.length > 0 && (
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Ø Monatsrendite", value: `${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(2)}%`, good: avgReturn >= 0 },
            { label: "Beste Monat",     value: `+${bestMonth.toFixed(1)}%`,  good: true },
            { label: "Schlechtester",   value: `${worstMonth.toFixed(1)}%`,  good: false },
            { label: "Pos. Monate",     value: `${positiveMonths}/${monthlyReturns.length}`, good: positiveMonths >= monthlyReturns.length / 2 },
          ].map(({ label, value, good }) => (
            <div key={label} className="bg-slate-50 rounded-lg px-2 py-2">
              <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
              <p className={cn("text-xs font-bold", good ? "text-emerald-600" : "text-red-500")}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Monthly returns bar chart ── */}
      {!loading && tab === "monthly" && monthlyReturns.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyReturns} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.slice(2)} // YY-MM
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={38}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
              formatter={(v) => [`${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`, "Monatsrendite"]}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            <Bar dataKey="ret" radius={[2, 2, 0, 0]}>
              {monthlyReturns.map((entry, i) => (
                <Cell key={i} fill={entry.ret >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* ── Moving average chart ── */}
      {!loading && tab === "ma" && maChartData.length > 0 && (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={maChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              width={38}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
              formatter={(v, name) => [
                Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${currency}`,
                name === "price" ? "Kurs" : name === "ma50" ? "MA 50" : "MA 200"
              ]}
            />
            <Legend
              formatter={(value) => value === "price" ? "Kurs" : value === "ma50" ? "MA 50" : "MA 200"}
              iconType="line"
              wrapperStyle={{ fontSize: "11px" }}
            />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="price" />
            <Line type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls name="ma50" />
            <Line type="monotone" dataKey="ma200" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" connectNulls name="ma200" />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* ── Return distribution histogram ── */}
      {!loading && tab === "dist" && distribution.length > 0 && (
        <div className="space-y-2">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distribution} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={24} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v) => [`${v} Monate`, "Häufigkeit"]}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {distribution.map((entry, i) => (
                  <Cell key={i} fill={entry.range.startsWith("+") || entry.range === "0%" ? "#10b981" : "#ef4444"} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-slate-400 text-center">Häufigkeit der 2%-Rendite-Bucket über 24 Monate</p>
        </div>
      )}

      {!loading && monthlyReturns.length === 0 && (
        <div className="h-28 flex items-center justify-center text-xs text-slate-400">
          Keine historischen Kursdaten verfügbar
        </div>
      )}
    </div>
  );
}
