"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { AssetClass } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const PERIODS = ["1M", "3M", "6M", "1Y", "3Y", "All"] as const;
type Period = typeof PERIODS[number];
type ViewMode = "price" | "relative";

interface TxMarker { id: string; type: "BUY" | "SELL"; date: string; price: number; quantity: number; notes: string | null }

const BENCHMARK = { ticker: "VWRL.L", label: "MSCI World (VWRL)" };

interface PricePoint { date: string; close: number }
interface ChartPoint { date: string; asset?: number; benchmark?: number }

function getYahooTicker(ticker: string | null, assetClass: AssetClass): string | null {
  if (!ticker) return null;
  if (assetClass === "CRYPTO") {
    if (ticker === "BTC") return "BTC-USD";
    if (ticker === "ETH") return "ETH-USD";
    return `${ticker}-USD`;
  }
  return ticker;
}

function normalize(data: PricePoint[]): { date: string; value: number }[] {
  if (data.length === 0) return [];
  const base = data[0].close;
  return data.map((d) => ({ date: d.date, value: parseFloat(((d.close / base) * 100).toFixed(2)) }));
}

function mergeRelative(asset: PricePoint[], bench: PricePoint[]): ChartPoint[] {
  const an = normalize(asset);
  const bn = normalize(bench);
  const bMap = new Map(bn.map((d) => [d.date, d.value]));
  return an.map((d) => ({ date: d.date, asset: d.value, benchmark: bMap.get(d.date) }));
}

interface Props {
  ticker: string | null;
  assetClass: AssetClass;
  currency: string;
  avgCostBasis: number;
  name: string;
}

export function AssetPriceChart({ ticker, assetClass, currency, avgCostBasis, name }: Props) {
  const [period, setPeriod] = useState<Period>("1Y");
  const [viewMode, setViewMode] = useState<ViewMode>("price");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showTxMarkers, setShowTxMarkers] = useState(true);

  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [benchData, setBenchData] = useState<PricePoint[]>([]);
  const [txMarkers, setTxMarkers] = useState<TxMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yahooTicker = getYahooTicker(ticker, assetClass);

  const fetchHistory = useCallback(
    async (sym: string, per: string): Promise<PricePoint[]> => {
      const res = await fetch(`/api/yahoo/history?symbol=${encodeURIComponent(sym)}&period=${per}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json() as { history: PricePoint[] };
      return json.history ?? [];
    },
    []
  );

  useEffect(() => {
    if (!yahooTicker) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const fetches: Promise<void>[] = [
      fetchHistory(yahooTicker, period).then(setPriceData).catch(() => {
        setPriceData([]);
        setError("Kursdaten nicht verfügbar");
      }),
    ];
    if (showBenchmark && viewMode === "relative") {
      fetches.push(fetchHistory(BENCHMARK.ticker, period).then(setBenchData).catch(() => setBenchData([])));
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [yahooTicker, period, showBenchmark, viewMode, fetchHistory]);

  // Fetch buy/sell transactions for this ticker
  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/positions/transactions?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((d: { transactions?: TxMarker[] }) => setTxMarkers(d.transactions ?? []))
      .catch(() => {});
  }, [ticker]);

  // ── derived chart data ──────────────────────────────────────
  const priceChartData: ChartPoint[] = priceData.map((d) => ({ date: d.date, asset: d.close }));
  const relativeChartData: ChartPoint[] = mergeRelative(priceData, benchData);
  const chartData: ChartPoint[] = viewMode === "price" ? priceChartData : relativeChartData;

  const first = priceData[0]?.close ?? 0;
  const last = priceData[priceData.length - 1]?.close ?? 0;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const isUp = change >= 0;

  const costBasisRelative = priceData.length > 0
    ? parseFloat(((avgCostBasis / priceData[0].close) * 100).toFixed(2))
    : null;

  const tickerLabel = viewMode === "price"
    ? formatCurrency(last, currency, { maximumFractionDigits: 2 })
    : `${last > 0 ? (((last - first) / first) * 100).toFixed(2) : "—"}% vs Period Start`;

  function formatXAxis(v: string) {
    try {
      const d = new Date(v);
      if (period === "1M" || period === "3M") return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return `${(d.getMonth() + 1).toString().padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
    } catch { return v; }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">{name}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {loading ? "—" : formatCurrency(last, currency, { maximumFractionDigits: 2 })}
            </span>
            {!loading && last > 0 && (
              <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isUp ? "+" : ""}{changePct.toFixed(2)}% ({period})
              </span>
            )}
            {!loading && last === 0 && yahooTicker && !error && (
              <span className="text-xs text-slate-400">Keine Daten</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode("price")}
              className={`px-2.5 py-1 rounded-md transition ${viewMode === "price" ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500"}`}
            >
              Preis
            </button>
            <button
              onClick={() => setViewMode("relative")}
              className={`px-2.5 py-1 rounded-md transition ${viewMode === "relative" ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500"}`}
            >
              Relativ %
            </button>
          </div>

          {/* Benchmark toggle — only in relative mode */}
          {viewMode === "relative" && (
            <button
              onClick={() => setShowBenchmark((b) => !b)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${showBenchmark ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              vs {BENCHMARK.label}
            </button>
          )}

          {/* Tx markers toggle */}
          {txMarkers.length > 0 && (
            <button
              onClick={() => setShowTxMarkers((b) => !b)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${showTxMarkers ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              Käufe/Verkäufe
            </button>
          )}
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-2.5 py-1 rounded-md transition ${period === p ? "bg-blue-600 text-white font-medium" : "text-slate-500 hover:bg-slate-100"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Cost basis legend (price mode only) */}
      {viewMode === "price" && avgCostBasis > 0 && !loading && priceData.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Minus size={14} className="text-amber-500" strokeDasharray="4 2" />
          <span>
            Einstandspreis: {formatCurrency(avgCostBasis, currency, { maximumFractionDigits: 2 })}
            {" "}
            ({last > avgCostBasis ? "+" : ""}{(((last - avgCostBasis) / avgCostBasis) * 100).toFixed(1)}% aktuell)
          </span>
        </div>
      )}

      {/* Chart */}
      <div className="h-56">
        {loading && (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            Lade Kursdaten…
          </div>
        )}
        {!loading && (!yahooTicker || chartData.length === 0) && (
          <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 gap-1">
            <span>{error ?? "Kein Ticker — Kursverlauf nicht verfügbar"}</span>
            <span className="text-xs">Verbinde mit Yahoo Finance für Live-Daten</span>
          </div>
        )}
        {!loading && chartData.length > 0 && viewMode === "price" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={formatXAxis} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={52}
                tickFormatter={(v) => formatCurrency(v as number, currency, { maximumFractionDigits: 0 })}
                domain={["auto", "auto"]}
              />
              {avgCostBasis > 0 && (
                <ReferenceLine
                  y={avgCostBasis}
                  stroke="#f59e0b"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: "Einstand", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                />
              )}
              {/* Buy/Sell vertical markers — snapped to nearest chart date */}
              {showTxMarkers && txMarkers.map((tx) => {
                const firstDate = chartData[0]?.date ?? "";
                const lastDate = chartData[chartData.length - 1]?.date ?? "";
                if (!firstDate || tx.date < firstDate || tx.date > lastDate) return null;
                // Find nearest available chart date
                const txMs = new Date(tx.date).getTime();
                const nearestDate = chartData.reduce((best, d) => {
                  const dMs = new Date(d.date).getTime();
                  const bestMs = new Date(best).getTime();
                  return Math.abs(dMs - txMs) < Math.abs(bestMs - txMs) ? d.date : best;
                }, firstDate);
                return (
                  <ReferenceLine
                    key={tx.id}
                    x={nearestDate}
                    stroke={tx.type === "BUY" ? "#22c55e" : "#ef4444"}
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                    label={{
                      value: tx.type === "BUY" ? "▲" : "▼",
                      position: tx.type === "BUY" ? "insideBottomLeft" : "insideTopLeft",
                      fontSize: 11,
                      fill: tx.type === "BUY" ? "#16a34a" : "#dc2626",
                    }}
                  />
                );
              })}
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v) => [formatCurrency(v as number, currency, { maximumFractionDigits: 2 }), name]}
                labelFormatter={(l) => {
                  const lStr = l as string;
                  const lMs = new Date(lStr).getTime();
                  const txOnDate = txMarkers.find((t) => Math.abs(new Date(t.date).getTime() - lMs) < 2 * 24 * 60 * 60 * 1000);
                  const base = formatDate(lStr);
                  if (txOnDate) return `${base} · ${txOnDate.type === "BUY" ? "▲ Kauf" : "▼ Verkauf"} ${txOnDate.quantity} Stk. @ ${txOnDate.price.toFixed(2)}`;
                  return base;
                }}
              />
              <Area type="monotone" dataKey="asset" stroke="#3b82f6" strokeWidth={2} fill="url(#assetGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {!loading && chartData.length > 0 && viewMode === "relative" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={formatXAxis} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={40}
                tickFormatter={(v) => `${(v as number).toFixed(0)}`}
                domain={["auto", "auto"]}
              />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
              {costBasisRelative != null && viewMode === "relative" && (
                <ReferenceLine
                  y={costBasisRelative}
                  stroke="#f59e0b"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: "Einstand", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                />
              )}
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                formatter={(v, key) => [`${(v as number).toFixed(2)}`, key === "asset" ? name : BENCHMARK.label]}
                labelFormatter={(l) => formatDate(l as string)}
              />
              {showBenchmark && <Legend wrapperStyle={{ fontSize: "11px" }} />}
              <Line type="monotone" dataKey="asset" name={name} stroke="#3b82f6" strokeWidth={2} dot={false} />
              {showBenchmark && <Line type="monotone" dataKey="benchmark" name={BENCHMARK.label} stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="0" />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Buy/sell marker legend */}
      {showTxMarkers && txMarkers.length > 0 && (
        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
            <span className="text-emerald-600">▲ Kauf</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500 inline-block" />
            <span className="text-red-500">▼ Verkauf</span>
          </span>
          <span>{txMarkers.filter(t => t.type === "BUY").length} Käufe · {txMarkers.filter(t => t.type === "SELL").length} Verkäufe</span>
        </div>
      )}

      {/* Footer note */}
      <p className="text-[10px] text-slate-300">
        Quelle: Yahoo Finance · {viewMode === "relative" ? "Beide Serien auf 100 bei Periodenstart indexiert" : "Tagesschlusskurse"}
        {" · "}Letzter Wert: {tickerLabel}
      </p>
    </div>
  );
}
