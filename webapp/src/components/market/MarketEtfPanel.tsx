"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, TrendingUp } from "lucide-react";

interface EtfData {
  symbol: string;
  name: string;
  sectorWeights: { sector: string; key: string; weight: number }[];
  holdings: { rank: number; name: string; symbol: string; weight: number }[];
  expenseRatio: number | null;
  totalAssets: number | null;
  ytdReturn: number | null;
  threeYearReturn: number | null;
  fiveYearReturn: number | null;
  fundFamily: string | null;
  categoryName: string | null;
  legalType: string | null;
}

const SECTOR_COLORS = [
  "#6366f1", "#3b82f6", "#22c55e", "#f97316", "#ec4899",
  "#eab308", "#ef4444", "#14b8a6", "#a855f7", "#64748b", "#0ea5e9",
];

function fmt(v: number | null, digits = 2, suffix = "") {
  if (v == null) return "—";
  return v.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + suffix;
}

function fmtLarge(v: number | null) {
  if (v == null) return "—";
  if (v >= 1e12) return (v / 1e12).toFixed(2) + " Bio.";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + " Mrd.";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + " Mio.";
  return v.toLocaleString("de-DE");
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function SectorBars({ data }: { data: EtfData["sectorWeights"] }) {
  const max = Math.max(...data.map((d) => d.weight));
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-right text-xs text-slate-600 truncate">{item.sector}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.weight / max) * 100}%`,
                backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length],
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-10 text-right shrink-0">
            {item.weight.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  symbol: string;
}

export function MarketEtfPanel({ symbol }: Props) {
  const [data, setData] = useState<EtfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/yahoo/etf?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json as EtfData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-300" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-10 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={28} className="text-red-300" />
        <p className="text-sm font-medium text-slate-700">ETF-Daten nicht verfügbar</p>
        <p className="text-xs text-slate-400">{error ?? "Keine Daten erhalten"}</p>
        <p className="text-xs text-slate-300 mt-1">
          Hinweis: Diese Ansicht ist nur für ETFs verfügbar.
        </p>
      </div>
    );
  }

  const top10Total = data.holdings.reduce((s, h) => s + h.weight, 0);

  return (
    <div className="space-y-5">
      {/* Fund metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Fonds-Kennzahlen</h3>
          <MetaRow label="Fondsvermögen (AUM)" value={fmtLarge(data.totalAssets)} />
          <MetaRow label="Kostenquote (TER)" value={data.expenseRatio != null ? fmt(data.expenseRatio * 100, 2, " %") : "—"} />
          <MetaRow label="YTD Performance" value={data.ytdReturn != null ? fmt(data.ytdReturn * 100, 2, " %") : "—"} />
          <MetaRow label="3 Jahre (ann.)" value={data.threeYearReturn != null ? fmt(data.threeYearReturn * 100, 2, " %") : "—"} />
          <MetaRow label="5 Jahre (ann.)" value={data.fiveYearReturn != null ? fmt(data.fiveYearReturn * 100, 2, " %") : "—"} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Fondsdetails</h3>
          <MetaRow label="Anbieter" value={data.fundFamily ?? "—"} />
          <MetaRow label="Kategorie" value={data.categoryName ?? "—"} />
          <MetaRow label="Rechtsform" value={data.legalType ?? "—"} />
          <MetaRow label="Symbol" value={data.symbol} />
        </div>
      </div>

      {/* Sector weights */}
      {data.sectorWeights.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Sektorallokation</h3>
          <SectorBars data={data.sectorWeights} />
        </div>
      )}

      {/* Top holdings */}
      {data.holdings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Top-Positionen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Größte Einzelwerte nach Gewichtung</p>
            </div>
            {top10Total > 0 && (
              <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                Top {data.holdings.length}: {top10Total.toFixed(1)}% des ETF
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {data.holdings.map((h) => (
              <div key={h.rank} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <span className="w-5 text-center text-[10px] font-semibold text-slate-400">{h.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{h.name}</p>
                  {h.symbol && (
                    <span className="text-[10px] font-mono text-slate-400">{h.symbol}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5 hidden md:block">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{
                        width: `${data.holdings[0].weight > 0
                          ? Math.min((h.weight / data.holdings[0].weight) * 100, 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-10 text-right">
                    {h.weight.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <TrendingUp size={10} className="text-slate-300" />
              Daten von Yahoo Finance · Gewichtungen können leicht von aktuellen Werten abweichen
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
