"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PositionDividend, PositionRow } from "@/lib/types";
import { TrendingUp, Calendar, Zap, Clock } from "lucide-react";

interface Props {
  position: PositionRow;
  dividends: PositionDividend[];
}

interface YearlyTotal {
  year: string;
  total: number;
  projected: boolean;
}

function groupByYear(divs: PositionDividend[]): YearlyTotal[] {
  const map = new Map<string, { total: number; projected: boolean }>();
  for (const d of divs) {
    const year = d.exDate.slice(0, 4);
    const existing = map.get(year) ?? { total: 0, projected: false };
    map.set(year, {
      total: existing.total + d.totalAmount,
      projected: existing.projected || d.isProjected,
    });
  }
  return Array.from(map.entries())
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

export function PositionDividendHistory({ position, dividends }: Props) {
  const received = dividends.filter((d) => !d.isProjected);
  const projected = dividends.filter((d) => d.isProjected);
  const yearlyData = groupByYear(dividends);

  const totalReceived = received.reduce((s, d) => s + d.totalAmount, 0);
  const lastDividend = received[0]; // dividends are sorted newest first
  const nextProjected = projected[projected.length - 1]; // last projected = next upcoming

  // Yield on cost = most recent 12 months of dividends / book value
  const last12Months = received.filter((d) => {
    const age = (new Date("2026-03-28").getTime() - new Date(d.exDate).getTime()) / 86_400_000;
    return age <= 365;
  });
  const ttmDividends = last12Months.reduce((s, d) => s + d.totalAmount, 0);
  const yieldOnCost = position.bookValue > 0 ? (ttmDividends / position.bookValue) * 100 : 0;
  const yieldOnMarket = position.marketValue > 0 ? (ttmDividends / position.marketValue) * 100 : 0;

  const kpis = [
    {
      icon: TrendingUp,
      label: "Yield on Cost",
      value: `${yieldOnCost.toFixed(2)}%`,
      sub: `${yieldOnMarket.toFixed(2)}% auf Marktwert`,
      color: "text-emerald-600",
    },
    {
      icon: Zap,
      label: "Letzte 12 Monate",
      value: formatCurrency(ttmDividends, dividends[0]?.currency ?? position.currency),
      sub: `${last12Months.length} Zahlungen`,
      color: "text-blue-600",
    },
    {
      icon: Calendar,
      label: "Gesamt erhalten",
      value: formatCurrency(totalReceived, dividends[0]?.currency ?? position.currency),
      sub: `${received.length} Zahlungen`,
      color: "text-slate-700",
    },
    {
      icon: Clock,
      label: "Nächste Dividende",
      value: nextProjected ? formatCurrency(nextProjected.totalAmount, nextProjected.currency) : "—",
      sub: nextProjected ? `Ex-Tag: ${formatDate(nextProjected.exDate)}` : "Nicht prognostiziert",
      color: "text-violet-600",
    },
  ];

  if (dividends.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Keine Dividendenbuchungen für diese Position vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={13} className={color} />
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-base font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Annual chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Jährliche Dividendeneinnahmen</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={yearlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={52}
              tickFormatter={(v) => formatCurrency(v as number, dividends[0]?.currency ?? "EUR", { maximumFractionDigits: 0 })}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
              formatter={(v, _, props) => [
                `${formatCurrency(v as number, dividends[0]?.currency ?? "EUR")}${props.payload?.projected ? " (progn.)" : ""}`,
                "Dividenden",
              ]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {yearlyData.map((entry) => (
                <Cell key={entry.year} fill={entry.projected ? "#fde68a" : "#fbbf24"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-slate-400 mt-2">
          Gelb = tatsächlich erhalten · Hellgelb = projiziert
        </p>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Dividendenhistorie</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ex-Datum</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Zahldatum</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Per Stück</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Anteile</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Gesamt</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dividends.map((d) => (
                <tr key={d.id} className={d.isProjected ? "bg-yellow-50/30" : ""}>
                  <td className="px-4 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                    {formatDate(d.exDate)}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-500 hidden md:table-cell whitespace-nowrap">
                    {formatDate(d.payDate)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-600 font-mono">
                    {formatCurrency(d.amountPerShare, d.currency, { maximumFractionDigits: 4 })}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-500 hidden lg:table-cell">
                    {d.sharesHeld.toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-yellow-700">
                    {formatCurrency(d.totalAmount, d.currency)}
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    {d.isProjected ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100">
                        Prognose
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Erhalten
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
