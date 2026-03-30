"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, PieChart, Pie, Legend, LineChart, Line,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import type { PositionRow } from "@/lib/types";
import { TrendingUp, Calendar, DollarSign, Percent, Info } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DividendInfo {
  symbol: string;
  shortName: string | null;
  currency: string;
  price: number | null;
  annualDividendRate: number | null;
  annualDividendYield: number | null;
  payoutRatio: number | null;
  exDividendDate: string | null;
  dividendPayDate: string | null;
  dividendHistory: Array<{ date: string; amount: number }>;
}

interface EnrichedPosition {
  pos: PositionRow;
  info: DividendInfo | null;
  annualIncome: number;
  yieldOnCost: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapCryptoTicker(ticker: string | null, assetClass: string): string | null {
  if (!ticker) return null;
  if (assetClass === "CRYPTO") return null; // crypto doesn't pay dividends
  return ticker;
}

// Project monthly income for next N months based on current quarterly rate
function projectMonthly(
  enriched: EnrichedPosition[],
  months: number,
): Array<{ month: string; income: number; projected: boolean }> {
  const result: Array<{ month: string; income: number; projected: boolean }> = [];
  const now = new Date();
  for (let i = -11; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isProjected = i > 0;
    // Distribute annual income evenly (some pay monthly, quarterly, annually; approximate monthly)
    const monthlyIncome = enriched.reduce((s, e) => s + e.annualIncome / 12, 0);
    result.push({ month: key, income: parseFloat(monthlyIncome.toFixed(2)), projected: isProjected });
  }
  return result;
}

// Yearly income aggregation
function yearlyIncome(
  enriched: EnrichedPosition[],
  years: number,
): Array<{ year: string; income: number; projected: boolean }> {
  const now = new Date();
  const result = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + years; y++) {
    const isProjected = y > now.getFullYear();
    // For past years use historical data if available, else use current rate
    const annualFromHistory = enriched.reduce((s, e) => {
      if (!e.info?.dividendHistory) return s;
      const yearPayments = e.info.dividendHistory.filter(
        (d) => d.date.startsWith(String(y))
      );
      if (yearPayments.length > 0) {
        return s + yearPayments.reduce((ys, p) => ys + p.amount * e.pos.quantity, 0);
      }
      return s + (isProjected ? e.annualIncome : 0);
    }, 0);
    result.push({
      year: String(y),
      income: parseFloat(annualFromHistory.toFixed(2)),
      projected: isProjected,
    });
  }
  return result;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  positions: PositionRow[];
}

export function DividendsShell({ positions }: Props) {
  const router = useRouter();
  const [dividendData, setDividendData] = useState<Record<string, DividendInfo>>({});
  const [loading, setLoading] = useState(true);
  const [forecastYears] = useState(5);

  const dividendEligible = positions.filter(
    (p) => p.assetClass !== "CASH" && p.assetClass !== "CRYPTO" && p.ticker
  );

  // Fetch dividend info for all eligible positions
  useEffect(() => {
    if (!dividendEligible.length) { setLoading(false); return; }
    setLoading(true);

    Promise.allSettled(
      dividendEligible.map(async (pos) => {
        const sym = mapCryptoTicker(pos.ticker, pos.assetClass);
        if (!sym) return null;
        const r = await fetch(`/api/yahoo/dividends?symbol=${encodeURIComponent(sym)}`);
        if (!r.ok) return null;
        const data = await r.json() as DividendInfo;
        return { sym, data };
      })
    ).then((results) => {
      const map: Record<string, DividendInfo> = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          map[r.value.sym] = r.value.data;
        }
      }
      setDividendData(map);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.map(p => p.ticker).join(",")]);

  // Enrich positions with dividend data
  const enriched: EnrichedPosition[] = useMemo(() =>
    dividendEligible.map((pos) => {
      const info = pos.ticker ? dividendData[pos.ticker] ?? null : null;
      const annualRate = info?.annualDividendRate ?? 0;
      const annualIncome = annualRate * pos.quantity;
      const yieldOnCost = pos.avgCostBasis > 0 && annualRate > 0
        ? (annualRate / pos.avgCostBasis) * 100
        : null;
      return { pos, info, annualIncome, yieldOnCost };
    }),
    [dividendEligible, dividendData]
  );

  // Aggregate stats
  const totalAnnualIncome = enriched.reduce((s, e) => s + e.annualIncome, 0);
  const ttmIncome = enriched.reduce((s, e) => {
    const ttm = e.info?.dividendHistory
      ?.filter((d) => {
        const age = (Date.now() - new Date(d.date).getTime()) / 86_400_000;
        return age <= 365;
      })
      .reduce((ys, p) => ys + p.amount * e.pos.quantity, 0) ?? 0;
    return s + ttm;
  }, 0);

  const avgYield = enriched.filter((e) => e.info?.annualDividendYield).length > 0
    ? enriched.reduce((s, e) => s + (e.info?.annualDividendYield ?? 0), 0) /
      enriched.filter((e) => e.info?.annualDividendYield).length
    : 0;

  // Upcoming dividends (ex-div dates in next 90 days)
  const upcoming = enriched
    .filter((e) => e.info?.exDividendDate)
    .map((e) => {
      const daysUntil = Math.ceil(
        (new Date(e.info!.exDividendDate!).getTime() - Date.now()) / 86_400_000
      );
      return { ...e, daysUntil };
    })
    .filter((e) => e.daysUntil >= -10 && e.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Charts data
  const monthlyData = useMemo(() => projectMonthly(enriched, 6), [enriched]);
  const yearlyData = useMemo(() => yearlyIncome(enriched, forecastYears), [enriched, forecastYears]);

  // Pie chart data (top contributors)
  const pieData = useMemo(() =>
    enriched
      .filter((e) => e.annualIncome > 0)
      .sort((a, b) => b.annualIncome - a.annualIncome)
      .slice(0, 8)
      .map((e, i) => ({
        name: e.pos.ticker ?? e.pos.name,
        posId: e.pos.id,
        value: parseFloat(e.annualIncome.toFixed(2)),
        color: COLORS[i % COLORS.length],
      })),
    [enriched]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dividenden</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Echtzeit-Dividendendaten · Prognose · Analyse
          </p>
        </div>
        {loading && (
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full animate-pulse">
            Lade Yahoo Finance…
          </span>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Projiziert (Jahresertrag)",
            value: formatCurrency(totalAnnualIncome, "EUR"),
            sub: "auf Basis aktueller Dividendenrate",
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "TTM Dividendeneinkommen",
            value: formatCurrency(ttmIncome, "EUR"),
            sub: "letzte 12 Monate tatsächlich",
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Ø Dividendenrendite",
            value: `${(avgYield * 100).toFixed(2)}%`,
            sub: "über alle dividendenzahlenden Positionen",
            icon: Percent,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Nächste Ex-Div.",
            value: upcoming[0]?.info?.exDividendDate
              ? new Date(upcoming[0].info.exDividendDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })
              : "—",
            sub: upcoming[0] ? `${upcoming[0].pos.ticker} · ${upcoming[0].daysUntil}d` : "Keine bekannt",
            icon: Calendar,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-slate-500 leading-tight">{label}</p>
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", bg)}>
                <Icon size={13} className={color} />
              </div>
            </div>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row: Monthly + Yearly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly income (past + forecast) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Monatliches Dividendeneinkommen</h2>
              <p className="text-xs text-slate-400 mt-0.5">Letzten 12 Monate + 6 Monate Prognose</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.slice(2)}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                width={38}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v, _n, item) => [
                  formatCurrency(Number(v), "EUR"),
                  item?.payload?.projected ? "Prognose" : "Tatsächlich",
                ]}
              />
              <Bar dataKey="income" radius={[3, 3, 0, 0]}>
                {monthlyData.map((d, i) => (
                  <Cell key={i} fill={d.projected ? "#c4b5fd" : "#3b82f6"} fillOpacity={d.projected ? 0.7 : 0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-end text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Tatsächlich</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-300 inline-block" /> Prognose</span>
          </div>
        </div>

        {/* Yearly forecast */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Jährliche Dividenden-Prognose</h2>
              <p className="text-xs text-slate-400 mt-0.5">Historisch + {forecastYears}-Jahres-Projektion</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                width={38}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v, _n, item) => [
                  formatCurrency(Number(v), "EUR"),
                  item?.payload?.projected ? "Prognose" : "Tatsächlich",
                ]}
              />
              <Bar dataKey="income" radius={[3, 3, 0, 0]}>
                {yearlyData.map((d, i) => (
                  <Cell key={i} fill={d.projected ? "#86efac" : "#10b981"} fillOpacity={d.projected ? 0.7 : 0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-end text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Historisch</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" /> Prognose</span>
          </div>
        </div>
      </div>

      {/* Pie + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut: contribution by holding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Beitrag je Position</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    dataKey="value"
                    paddingAngle={2}
                    cursor="pointer"
                    onClick={(d) => router.push(`/dashboard/holdings/${(d as unknown as { posId: string }).posId}`)}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    formatter={(v) => [formatCurrency(Number(v), "EUR"), "Jahresertrag"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {pieData.map((d) => {
                  const pct = totalAnnualIncome > 0 ? (d.value / totalAnnualIncome) * 100 : 0;
                  return (
                    <button
                      key={d.name}
                      onClick={() => router.push(`/dashboard/holdings/${d.posId}`)}
                      className="w-full flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-slate-700 font-medium w-12 shrink-0 hover:text-blue-700">{d.name}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right">{pct.toFixed(0)}%</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-slate-400">
              Keine Dividendendaten verfügbar
            </div>
          )}
        </div>

        {/* Upcoming ex-dividend dates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Kommende Ex-Dividenden-Termine</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.slice(0, 7).map(({ pos, info, annualIncome, daysUntil }) => (
                <button key={pos.id} onClick={() => router.push(`/dashboard/holdings/${pos.id}`)} className="w-full flex items-center gap-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-blue-600">{(pos.ticker ?? "?").slice(0, 4)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{pos.name}</p>
                    <p className="text-xs text-slate-400">
                      Ex-Div: {info?.exDividendDate
                        ? new Date(info.exDividendDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-800">
                      {formatCurrency(annualIncome / 4, info?.currency ?? pos.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400">~pro Quartal</p>
                  </div>
                  <div className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                    daysUntil <= 7 ? "bg-amber-100 text-amber-700" :
                    daysUntil <= 0 ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {daysUntil <= 0 ? "Heute/Abgelaufen" : `in ${daysUntil}d`}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-slate-400">
              Keine bekannten Ex-Dividenden-Termine
            </div>
          )}
        </div>
      </div>

      {/* Per-position dividend details table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Dividendenübersicht je Position</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Position", "Kurs", "Div/Aktie (p.a.)", "Rendite", "Yield on Cost", "Jahresertrag", "Payout Ratio", "Nächste Ex-Div"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {enriched.map(({ pos, info, annualIncome, yieldOnCost }) => {
                const hasDivs = (info?.annualDividendRate ?? 0) > 0;
                return (
                  <tr key={pos.id} onClick={() => router.push(`/dashboard/holdings/${pos.id}`)} className="hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-blue-600">{(pos.ticker ?? "?").slice(0, 4)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{pos.name}</p>
                          <p className="text-xs text-slate-400">{pos.ticker} · {pos.quantity.toLocaleString()} Stk</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {info?.price != null ? info.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {hasDivs ? formatCurrency(info!.annualDividendRate!, info?.currency ?? pos.currency, { maximumFractionDigits: 3 }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {hasDivs && info?.annualDividendYield ? (
                        <span className="text-emerald-600 font-medium">
                          {(info.annualDividendYield * 100).toFixed(2)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {yieldOnCost != null ? (
                        <span className={cn("font-medium", yieldOnCost > 4 ? "text-emerald-600" : "text-slate-600")}>
                          {yieldOnCost.toFixed(2)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                      {hasDivs ? formatCurrency(annualIncome, info?.currency ?? pos.currency) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {info?.payoutRatio != null ? `${(info.payoutRatio * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {info?.exDividendDate
                        ? new Date(info.exDividendDate).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
        <Info size={13} className="shrink-0 mt-0.5" />
        <p>Dividendenprognosen basieren auf der aktuellen Jahresrate und historischen Zahlungen von Yahoo Finance. Künftige Dividenden können variieren oder entfallen. Keine Anlageberatung.</p>
      </div>
    </div>
  );
}
