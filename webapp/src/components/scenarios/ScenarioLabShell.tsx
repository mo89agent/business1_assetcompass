"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { PositionRow } from "@/lib/types";
import {
  runMonteCarlo, runStressTest, computeRiskStats, computePortfolioWeights,
  STRESS_SCENARIOS, ASSET_PARAMS, type MonteCarloResult, type StressResult,
  type PortfolioRiskStats,
} from "@/lib/finance/scenarioEngine";
import { AlertTriangle, TrendingUp, TrendingDown, Info, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props { positions: PositionRow[] }

const HORIZON_OPTIONS = [
  { label: "1 Jahr",   years: 1 },
  { label: "3 Jahre",  years: 3 },
  { label: "5 Jahre",  years: 5 },
  { label: "10 Jahre", years: 10 },
  { label: "20 Jahre", years: 20 },
];

function fmt(v: number, currency = "EUR") {
  if (Math.abs(v) >= 1_000_000)
    return (v / 1_000_000).toFixed(2) + " Mio. " + currency;
  if (Math.abs(v) >= 1_000)
    return (v / 1_000).toFixed(1) + " K " + currency;
  return v.toFixed(0) + " " + currency;
}

function fmtPct(v: number, plus = false) {
  const s = (v * 100).toFixed(1) + "%";
  return plus && v > 0 ? "+" + s : s;
}

function StatCard({ label, value, sub, color = "slate" }: { label: string; value: string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    slate: "text-slate-900", green: "text-emerald-600", red: "text-red-500", amber: "text-amber-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={cn("text-sm font-bold leading-tight", colors[color])}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Custom tooltip for Monte Carlo chart
function McTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active || !Array.isArray(payload) || !payload.length) return null;
  const year = label as number;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-slate-700">Jahr {year}</p>
      {[
        { key: "p90", label: "Optimistisch (P90)", color: "#10b981" },
        { key: "p75", label: "Gut (P75)",          color: "#3b82f6" },
        { key: "p50", label: "Median (P50)",       color: "#6366f1" },
        { key: "p25", label: "Schlecht (P25)",     color: "#f59e0b" },
        { key: "p10", label: "Pessimistisch (P10)",color: "#ef4444" },
      ].map(({ key, label: l, color }) => {
        const entry = (payload as { name: string; value: number }[]).find((p) => p.name === key);
        if (!entry) return null;
        return (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-500">{l}:</span>
            <span className="font-semibold text-slate-800">{fmt(entry.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ScenarioLabShell({ positions }: Props) {
  const router = useRouter();
  const [horizon, setHorizon] = useState(5);
  const [computed, setComputed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const [stressResults, setStressResults] = useState<StressResult[]>([]);
  const [riskStats, setRiskStats] = useState<PortfolioRiskStats | null>(null);
  const [expandedStress, setExpandedStress] = useState<string | null>(null);

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const weights = useMemo(() => computePortfolioWeights(positions), [positions]);

  function runSimulation() {
    setLoading(true);
    // Run in a timeout to allow UI to update first
    setTimeout(() => {
      const mc = runMonteCarlo(totalValue, weights, horizon, 8_000);
      const stress = STRESS_SCENARIOS.map((s) => runStressTest(totalValue, positions, s));
      const stats = computeRiskStats(totalValue, weights);
      setMcResult(mc);
      setStressResults(stress);
      setRiskStats(stats);
      setComputed(true);
      setLoading(false);
    }, 50);
  }

  // Prepare chart data
  const mcChartData = mcResult
    ? Array.from({ length: horizon + 1 }, (_, i) => ({
        year: i,
        p10: Math.round(mcResult.paths.p10[i]),
        p25: Math.round(mcResult.paths.p25[i]),
        p50: Math.round(mcResult.paths.p50[i]),
        p75: Math.round(mcResult.paths.p75[i]),
        p90: Math.round(mcResult.paths.p90[i]),
      }))
    : [];

  const allocationData = Object.entries(weights)
    .map(([ac, w]) => ({ ac, name: ASSET_PARAMS[ac]?.label ?? ac, value: +(w * 100).toFixed(1) }))
    .sort((a, b) => b.value - a.value);

  const ALLOC_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Monte Carlo & Stresstest</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Log-normales Renditemodell (8.000 Simulationspfade), parametrische VaR/CVaR nach
              Basel-III, historische Stresstests auf Basis realer Marktdaten. Keine Prognose —
              Risikomodellierung unter Normalverteilungsannahme.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">Portfolio:</p>
            <p className="text-sm font-bold text-slate-900">
              {fmt(totalValue)} EUR
            </p>
          </div>
        </div>

        {/* Horizon selector + run */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          <p className="text-xs font-medium text-slate-600">Zeithorizont:</p>
          <div className="flex gap-1.5">
            {HORIZON_OPTIONS.map(({ label, years }) => (
              <button
                key={years}
                onClick={() => { setHorizon(years); setComputed(false); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  horizon === years
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={runSimulation}
            disabled={loading || positions.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Play size={12} />
            {loading ? "Berechne…" : computed ? "Neu berechnen" : "Simulation starten"}
          </button>
        </div>
      </div>

      {!computed && !loading && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">
            Zeithorizont wählen und Simulation starten.
          </p>
        </div>
      )}

      {computed && mcResult && riskStats && (
        <>
          {/* Risk stats KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Sharpe Ratio"
              value={riskStats.sharpeRatio.toFixed(2)}
              sub="(E[R]–Rf)/σ · Treynor/Sharpe 1966"
              color={riskStats.sharpeRatio >= 1 ? "green" : riskStats.sharpeRatio >= 0.5 ? "amber" : "red"}
            />
            <StatCard
              label="Sortino Ratio"
              value={riskStats.sortinoRatio.toFixed(2)}
              sub="Downside-Volatilität bereinigt"
              color={riskStats.sortinoRatio >= 1.2 ? "green" : riskStats.sortinoRatio >= 0.6 ? "amber" : "red"}
            />
            <StatCard
              label="VaR 95% (1 Jahr)"
              value={fmt(riskStats.var95)}
              sub="Maximalverlust mit 95% Konfidenz"
              color="red"
            />
            <StatCard
              label="CVaR / Expected Shortfall"
              value={fmt(riskStats.cvar95)}
              sub="Erwarteter Verlust bei VaR-Überschreitung"
              color="red"
            />
            <StatCard
              label="Erwartete Rendite p.a."
              value={fmtPct(riskStats.expectedReturnAnnual, true)}
              sub="Gewichteter Portfoliodurchschnitt"
              color="green"
            />
            <StatCard
              label="Volatilität p.a."
              value={fmtPct(riskStats.volatilityAnnual)}
              sub="Standardabweichung Portfoliorendite"
              color="amber"
            />
            <StatCard
              label="Max. Drawdown (Erwartet)"
              value={fmtPct(riskStats.expectedMaxDrawdown)}
              sub="Magdon-Ismail & Atiya 2004"
              color="amber"
            />
            <StatCard
              label="Effektive Positionen"
              value={riskStats.effectiveN.toFixed(1)}
              sub="Inverse Herfindahl (Diversifikation)"
              color={riskStats.effectiveN >= 4 ? "green" : "amber"}
            />
          </div>

          {/* Monte Carlo chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Monte Carlo — {horizon}-Jahres-Projektion
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  8.000 Pfade · Log-normales Modell · Konfidenzband P10–P90
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={mcChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tickFormatter={(v) => `J${v}`} tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} width={75} />
                <Tooltip content={<McTooltip />} />
                <ReferenceLine y={totalValue} stroke="#94a3b8" strokeDasharray="4 2" label={{ value: "Heute", fontSize: 10, fill: "#94a3b8" }} />
                <Area type="monotone" dataKey="p90" name="p90" stroke="#10b981" strokeWidth={1.5} fill="url(#gradGreen)" dot={false} />
                <Area type="monotone" dataKey="p75" name="p75" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gradBlue)" dot={false} />
                <Area type="monotone" dataKey="p50" name="p50" stroke="#6366f1" strokeWidth={2.5} fill="none" dot={false} />
                <Area type="monotone" dataKey="p25" name="p25" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradAmber)" dot={false} />
                <Area type="monotone" dataKey="p10" name="p10" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Outcome summary */}
            <div className="grid grid-cols-5 gap-2 mt-4 text-center">
              {[
                { label: "Pessimistisch (P10)", value: mcResult.finalValues.p10, cagr: mcResult.annualisedReturn.p10, color: "text-red-500" },
                { label: "Schlecht (P25)",      value: mcResult.finalValues.p25, cagr: null, color: "text-amber-600" },
                { label: "Median (P50)",         value: mcResult.finalValues.p50, cagr: mcResult.annualisedReturn.p50, color: "text-indigo-600" },
                { label: "Gut (P75)",            value: mcResult.finalValues.p75, cagr: null, color: "text-blue-600" },
                { label: "Optimistisch (P90)",   value: mcResult.finalValues.p90, cagr: mcResult.annualisedReturn.p90, color: "text-emerald-600" },
              ].map(({ label, value, cagr, color }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-2">
                  <p className="text-[9px] text-slate-400">{label}</p>
                  <p className={cn("text-xs font-bold mt-0.5", color)}>{fmt(value)}</p>
                  {cagr != null && <p className="text-[9px] text-slate-400">{fmtPct(cagr, true)} p.a.</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Stress Tests */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Historische Stresstests</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Kalibriert auf reale Marktdaten. Kein Prognosecharakter.
              </p>
            </div>

            <div className="divide-y divide-slate-50">
              {stressResults.map((sr) => {
                const isExpanded = expandedStress === sr.scenario.id;
                const isLoss = sr.portfolioLoss > 0;
                return (
                  <div key={sr.scenario.id}>
                    <button
                      onClick={() => setExpandedStress(isExpanded ? null : sr.scenario.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{sr.scenario.name}</p>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {sr.scenario.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{sr.scenario.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-base font-bold", isLoss ? "text-red-500" : "text-emerald-600")}>
                          {isLoss ? "–" : "+"}{fmt(Math.abs(sr.portfolioLoss))}
                        </p>
                        <p className={cn("text-xs", isLoss ? "text-red-400" : "text-emerald-500")}>
                          {fmtPct(isLoss ? -sr.portfolioLossPct : sr.portfolioLossPct, !isLoss)}
                        </p>
                      </div>
                      <div className="w-24 hidden md:block shrink-0">
                        <div className="text-[10px] text-slate-400 mb-1">Nach Schock</div>
                        <div className="text-xs font-semibold text-slate-700">{fmt(sr.portfolioValueAfter)}</div>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 space-y-3">
                        <p className="text-[10px] text-slate-400">
                          Quelle: {sr.scenario.source}
                        </p>
                        <div className="space-y-2">
                          {sr.assetImpacts
                            .filter((a) => a.weightedLoss !== 0)
                            .map((a) => (
                              <div key={a.assetClass} className="flex items-center gap-3">
                                <div className="w-24 text-xs text-slate-500 shrink-0">{a.label}</div>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={cn("h-full rounded-full", a.shock < 0 ? "bg-red-400" : "bg-emerald-400")}
                                    style={{ width: `${Math.min(Math.abs(a.shock) * 100, 100)}%` }}
                                  />
                                </div>
                                <div className="w-16 text-xs font-mono text-right shrink-0">
                                  <span className={a.shock < 0 ? "text-red-500" : "text-emerald-600"}>
                                    {fmtPct(a.shock, a.shock > 0)}
                                  </span>
                                </div>
                                <div className="w-24 text-xs text-right shrink-0">
                                  <span className={a.weightedLoss < 0 ? "text-red-500" : "text-emerald-600"}>
                                    {a.weightedLoss < 0 ? "–" : "+"}{fmt(Math.abs(a.weightedLoss))}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Portfolio composition for scenario */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Portfolioallokation (Szenario-Basis)</h3>
            <div className="space-y-2">
              {allocationData.map(({ ac, name, value }, i) => (
                <button
                  key={name}
                  onClick={() => router.push(`/dashboard/holdings?filter=${ac}`)}
                  className="w-full flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-24 text-xs text-slate-600 text-right shrink-0 group-hover:text-blue-700">{name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${value}%`, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }}
                    />
                  </div>
                  <div className="w-10 text-xs text-slate-500 text-right tabular-nums">{value}%</div>
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
            <Info size={13} className="shrink-0 mt-0.5 text-slate-400" />
            <span>
              Diese Simulationen basieren auf historischen Volatilitätsdaten und Normalverteilungsannahmen.
              Vergangene Performance ist kein Indikator für zukünftige Ergebnisse. Extremereignisse
              (Fat Tails) werden durch Normal­verteilungsmodelle systematisch unterschätzt.
              Kein Anlageberatungscharakter.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
