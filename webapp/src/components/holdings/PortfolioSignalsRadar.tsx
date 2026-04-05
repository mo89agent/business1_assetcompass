"use client";

import { useEffect, useReducer, useRef } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PositionRow } from "@/lib/types";
import type { SignalsResult, SignalDir } from "@/lib/signals";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type EntryStatus = "idle" | "loading" | "done" | "error";

interface Entry {
  position: PositionRow;
  status: EntryStatus;
  result: SignalsResult | null;
}

type Action =
  | { type: "INIT"; positions: PositionRow[] }
  | { type: "LOADING"; id: string }
  | { type: "DONE"; id: string; result: SignalsResult }
  | { type: "ERROR"; id: string };

function reducer(state: Entry[], action: Action): Entry[] {
  switch (action.type) {
    case "INIT":
      return action.positions.map((p) => ({ position: p, status: "idle", result: null }));
    case "LOADING":
      return state.map((e) => e.position.id === action.id ? { ...e, status: "loading" } : e);
    case "DONE":
      return state.map((e) => e.position.id === action.id ? { ...e, status: "done", result: action.result } : e);
    case "ERROR":
      return state.map((e) => e.position.id === action.id ? { ...e, status: "error" } : e);
  }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function dirStyle(dir: SignalDir) {
  if (dir === "BUY") return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  if (dir === "SELL") return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" };
  return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" };
}

function dirLabel(dir: SignalDir) {
  return dir === "BUY" ? "KAUFEN" : dir === "SELL" ? "VERKAUFEN" : "HALTEN";
}

function ScoreBar({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 62 ? "bg-emerald-500" : pct <= 38 ? "bg-red-500" : "bg-amber-400";
  const h = size === "sm" ? "h-1" : "h-1.5";
  return (
    <div className={cn("relative bg-slate-100 rounded-full overflow-hidden w-full", h)}>
      <div className="absolute inset-y-0 left-[38%] w-px bg-slate-300/50" />
      <div className="absolute inset-y-0 left-[62%] w-px bg-slate-300/50" />
      <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CategoryDot({ signals, cat }: {
  signals: SignalsResult["signals"];
  cat: "technical" | "fundamental" | "sentiment";
}) {
  const sigs = signals.filter((s) => s.category === cat);
  if (sigs.length === 0) return <span className="text-slate-200">—</span>;
  const avg = sigs.reduce((a, b) => a + b.strength, 0) / sigs.length;
  const dir: SignalDir = avg >= 0.62 ? "BUY" : avg <= 0.38 ? "SELL" : "HOLD";
  const s = dirStyle(dir);
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", s.bg, s.text, s.border)}>
      {dir === "BUY" ? "▲" : dir === "SELL" ? "▼" : "◼"}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      <td className="px-4 py-3"><div className="h-3.5 bg-slate-100 rounded w-28" /></td>
      <td className="px-3 py-3"><div className="h-3.5 bg-slate-100 rounded w-16" /></td>
      <td className="px-3 py-3"><div className="h-3.5 bg-slate-100 rounded w-20" /></td>
      <td className="px-3 py-3 hidden md:table-cell"><div className="h-1.5 bg-slate-100 rounded" /></td>
      <td className="px-3 py-3 hidden lg:table-cell"><div className="h-3 bg-slate-100 rounded w-6 mx-auto" /></td>
      <td className="px-3 py-3 hidden lg:table-cell"><div className="h-3 bg-slate-100 rounded w-6 mx-auto" /></td>
      <td className="px-3 py-3 hidden lg:table-cell"><div className="h-3 bg-slate-100 rounded w-6 mx-auto" /></td>
      <td className="px-3 py-3"><div className="h-3 bg-slate-100 rounded w-8 mx-auto" /></td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

interface Props {
  positions: PositionRow[];
  filterDir?: SignalDir | "ALL";
}

export function PortfolioSignalsRadar({ positions, filterDir = "ALL" }: Props) {
  const [entries, dispatch] = useReducer(reducer, []);
  const fetchedRef = useRef(new Set<string>());

  // Only show positions with a ticker (stocks, ETFs) — not cash/real estate
  const sigPositions = positions.filter(
    (p) => !!p.ticker && !["CASH", "REAL_ESTATE"].includes(p.assetClass),
  );

  useEffect(() => {
    dispatch({ type: "INIT", positions: sigPositions });
    fetchedRef.current = new Set();
    // Staggered fetch: 300ms between requests to avoid rate-limit
    sigPositions.forEach((p, i) => {
      if (!p.ticker) return;
      setTimeout(async () => {
        if (fetchedRef.current.has(p.id)) return;
        fetchedRef.current.add(p.id);
        dispatch({ type: "LOADING", id: p.id });
        try {
          const res = await fetch(`/api/yahoo/signals?symbol=${encodeURIComponent(p.ticker!)}`);
          if (!res.ok) throw new Error();
          const json = await res.json() as SignalsResult;
          dispatch({ type: "DONE", id: p.id, result: json });
        } catch {
          dispatch({ type: "ERROR", id: p.id });
        }
      }, i * 400);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions.map((p) => p.id).join(",")]);

  const filtered = entries.filter((e) => {
    if (filterDir === "ALL") return true;
    if (e.status !== "done" || !e.result) return false;
    return e.result.overall === filterDir;
  });

  // Summary counts from done entries
  const done = entries.filter((e) => e.status === "done" && e.result);
  const buys = done.filter((e) => e.result!.overall === "BUY").length;
  const sells = done.filter((e) => e.result!.overall === "SELL").length;
  const holds = done.filter((e) => e.result!.overall === "HOLD").length;

  if (sigPositions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Keine analysierbaren Positionen (Aktien/ETFs mit Ticker) im Portfolio.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Analysiert", value: `${done.length}/${sigPositions.length}`, sub: "Positionen", color: "text-slate-700", icon: BarChart2 },
          { label: "Kaufen", value: buys, sub: "Signale", color: "text-emerald-600", icon: TrendingUp },
          { label: "Halten", value: holds, sub: "Signale", color: "text-amber-600", icon: Minus },
          { label: "Verkaufen", value: sells, sub: "Signale", color: "text-red-500", icon: TrendingDown },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <Icon size={15} className={cn("mt-0.5", color)} />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className={cn("text-xl font-bold tabular-nums", color)}>{value}</p>
              <p className="text-[10px] text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Position</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Signal</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Score</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell w-40">Stärke</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Tech.</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Fund.</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Sent.</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Konfidenz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && entries.every((e) => e.status === "loading" || e.status === "idle") &&
                sigPositions.map((p) => <SkeletonRow key={p.id} />)
              }
              {filtered.map((entry) => {
                const { position, status, result } = entry;
                if (status === "idle" || status === "loading") {
                  return <SkeletonRow key={position.id} />;
                }
                if (status === "error" || !result) {
                  return (
                    <tr key={position.id} className="border-b border-slate-50 opacity-40">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">{position.ticker}</p>
                        <p className="text-[10px] text-slate-400">{position.name}</p>
                      </td>
                      <td colSpan={7} className="px-3 py-3 text-[11px] text-slate-400 italic">
                        Keine Daten verfügbar
                      </td>
                    </tr>
                  );
                }
                const ds = dirStyle(result.overall);
                const pct = Math.round(result.score * 100);
                return (
                  <tr key={position.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: "#3b82f620", color: "#3b82f6" }}
                        >
                          {(position.ticker ?? "?").slice(0, 4)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 leading-tight">{position.ticker}</p>
                          <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">{position.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap",
                        ds.bg, ds.text, ds.border,
                      )}>
                        {result.overall === "BUY" ? <TrendingUp size={9} /> :
                          result.overall === "SELL" ? <TrendingDown size={9} /> : <Minus size={9} />}
                        {dirLabel(result.overall)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("text-base font-bold tabular-nums", ds.text)}>{pct}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <ScoreBar score={result.score} size="sm" />
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell">
                      <CategoryDot signals={result.signals} cat="technical" />
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell">
                      <CategoryDot signals={result.signals} cat="fundamental" />
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell">
                      <CategoryDot signals={result.signals} cat="sentiment" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-slate-500 tabular-nums">
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-50 flex items-center gap-1.5">
          <RefreshCw size={9} className="text-slate-300" />
          <p className="text-[10px] text-slate-300">
            Signale werden sequenziell geladen · Technisch (40%) + Fundamental (40%) + Sentiment (20%) gewichtet
          </p>
        </div>
      </div>
    </div>
  );
}
