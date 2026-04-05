"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingUp, DollarSign, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DividendEvent, DividendMonthly, StockHolding } from "@/lib/data/stocks";

interface DividendTrackerProps {
  holdings: StockHolding[];
  dividendCalendar: DividendEvent[];
  dividendMonthly: DividendMonthly[];
  annualDividendIncome: number;
  avgDividendYield: number;
  currency: string;
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mär", "04": "Apr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Okt", "11": "Nov", "12": "Dez",
};

// Project next 12 months based on trailing 12-month average
function projectNextYear(monthly: DividendMonthly[]): DividendMonthly[] {
  const avg = monthly.reduce((s, m) => s + m.income, 0) / monthly.length;
  const last = monthly[monthly.length - 1];
  const [year, month] = last.month.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, month - 1 + i + 1, 1);
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      income: Math.round(avg * (1 + (Math.random() - 0.5) * 0.15)),
      tickers: [],
    };
  });
}

export function DividendTracker({
  holdings,
  dividendCalendar,
  dividendMonthly,
  annualDividendIncome,
  avgDividendYield,
  currency,
}: DividendTrackerProps) {
  const [view, setView] = useState<"history" | "forecast" | "calendar">("history");

  const projected = projectNextYear(dividendMonthly);
  const totalProjected = projected.reduce((s, m) => s + m.income, 0);

  const historyChart = dividendMonthly.map((m) => ({
    label: MONTH_LABELS[m.month.split("-")[1]] + " " + m.month.split("-")[0].slice(2),
    income: m.income,
  }));

  const forecastChart = [
    ...dividendMonthly.slice(-6).map((m) => ({
      label: MONTH_LABELS[m.month.split("-")[1]] + " " + m.month.split("-")[0].slice(2),
      historical: m.income,
      forecast: 0,
    })),
    ...projected.slice(0, 12).map((m) => ({
      label: MONTH_LABELS[m.month.split("-")[1]] + " " + m.month.split("-")[0].slice(2),
      historical: 0,
      forecast: m.income,
    })),
  ];

  // Top dividend payers
  const topPayers = [...holdings]
    .filter((h) => (h.annualDividendIncome ?? 0) > 0)
    .sort((a, b) => (b.annualDividendIncome ?? 0) - (a.annualDividendIncome ?? 0))
    .slice(0, 6);

  // Upcoming dividends (next 90 days)
  const today = new Date().toISOString().split("T")[0];
  const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const upcoming = dividendCalendar
    .filter((d) => d.exDate >= today && d.exDate <= in90)
    .sort((a, b) => a.exDate.localeCompare(b.exDate));

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-amber-500" />
            <span className="text-xs text-slate-500">Dividende p.a.</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatCurrency(annualDividendIncome, currency)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{formatCurrency(annualDividendIncome / 12, currency)} / Monat</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-amber-500" />
            <span className="text-xs text-slate-500">Ø Dividendenrendite</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{avgDividendYield.toFixed(2)}%</div>
          <div className="text-xs text-slate-400 mt-0.5">auf Marktwert gewichtet</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-amber-500" />
            <span className="text-xs text-slate-500">Prognose nächstes Jahr</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatCurrency(totalProjected, currency)}</div>
          <div className="text-xs text-emerald-500 mt-0.5">
            +{(((totalProjected - annualDividendIncome) / annualDividendIncome) * 100).toFixed(1)}% ggü. Vorjahr
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-amber-500" />
            <span className="text-xs text-slate-500">Nächste 90 Tage</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatCurrency(upcoming.reduce((s, d) => s + d.amount, 0), currency)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{upcoming.length} Ausschüttungen geplant</div>
        </div>
      </div>

      {/* Chart section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Dividenden-Verlauf & Prognose</h3>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["history", "forecast"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v === "history" ? "Verlauf" : "Prognose"}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          {view === "history" ? (
            <BarChart data={historyChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={40}
                tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v) => [formatCurrency(Number(v), currency), "Dividenden"]}
              />
              <Bar dataKey="income" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={forecastChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={40}
                tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v, name) => [
                  formatCurrency(Number(v), currency),
                  name === "historical" ? "Historisch" : "Prognose",
                ]}
              />
              <Bar dataKey="historical" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="forecast" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Top payers + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top dividend payers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Top Dividendenzahler</h3>
          <div className="space-y-2.5">
            {topPayers.map((h) => {
              const barWidth = (h.annualDividendIncome! / topPayers[0].annualDividendIncome!) * 100;
              return (
                <div key={h.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{h.ticker}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        h.type === "ETF" ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                      }`}>{h.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-900">{formatCurrency(h.annualDividendIncome!, h.currency)}</span>
                      <span className="text-amber-600 ml-2">{h.dividendYieldPct!.toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming calendar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Kalender — nächste 90 Tage</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400">Keine Dividenden in den nächsten 90 Tagen.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((ev, i) => {
                const exDate = new Date(ev.exDate);
                const daysUntil = Math.ceil((exDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-amber-600 font-semibold uppercase">
                          {MONTH_LABELS[ev.exDate.split("-")[1]]}
                        </span>
                        <span className="text-xs text-amber-700 font-bold leading-none">{ev.exDate.split("-")[2]}</span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-900">{ev.ticker}</div>
                        <div className="text-[10px] text-slate-500">{ev.frequency} · Ex-Tag in {daysUntil}d</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-amber-600">{formatCurrency(ev.amount, ev.currency)}</div>
                      {ev.payDate && (
                        <div className="text-[10px] text-slate-400">
                          Zahltag {new Date(ev.payDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
