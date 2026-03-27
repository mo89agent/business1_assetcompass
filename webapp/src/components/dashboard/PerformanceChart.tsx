"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
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

  const filtered = useMemo(() => filterByPeriod(data, activePeriod), [data, activePeriod]);

  const first = filtered[0]?.value ?? 0;
  const last = filtered[filtered.length - 1]?.value ?? 0;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Net Worth History</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(last, currency)}
            </span>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {isPositive ? "+" : ""}
              {changePct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`text-xs px-2 py-1 rounded-md transition ${
                activePeriod === p
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={filtered} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
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
            tickFormatter={(v) =>
              v >= 1000000
                ? `${(v / 1000000).toFixed(1)}M`
                : `${(v / 1000).toFixed(0)}K`
            }
            width={45}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value) => [
              formatCurrency(Number(value), currency),
              "Net Worth",
            ]}
            labelFormatter={(label) => formatDate(label)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#netWorthGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
