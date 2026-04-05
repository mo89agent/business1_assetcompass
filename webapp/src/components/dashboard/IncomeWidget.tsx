"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { IncomeEntry } from "@/lib/types";

interface IncomeWidgetProps {
  income: IncomeEntry[];
  currency: string;
}

export function IncomeWidget({ income, currency }: IncomeWidgetProps) {
  const totalLast = income[income.length - 1]?.total ?? 0;
  const annualEstimate = income.reduce((s, m) => s + m.total, 0);

  const chartData = income.map((m) => ({
    month: m.month.slice(5), // "MM"
    Dividends: m.dividends,
    Interest: m.interest,
    Rent: m.rent,
    Other: m.other,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-900">Income</h2>
        <Link href="/dashboard/transactions" className="text-xs text-blue-600 hover:underline">
          Details
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-400">Last month</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(totalLast, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">6-month total</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(annualEstimate, currency)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} barSize={8} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
            formatter={(v) => [formatCurrency(Number(v), currency), ""]}
          />
          <Bar dataKey="Dividends" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Interest" stackId="a" fill="#06b6d4" />
          <Bar dataKey="Rent" stackId="a" fill="#f97316" />
          <Bar dataKey="Other" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
