"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, BookOpen,
  BarChart2, Layers, Users, AlertCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignalsResult, IndividualSignal, SignalDir } from "@/lib/signals";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function dirColor(dir: SignalDir) {
  if (dir === "BUY") return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" };
  if (dir === "SELL") return { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", dot: "bg-red-500" };
  return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400" };
}

function dirLabel(dir: SignalDir) {
  if (dir === "BUY") return "KAUFEN";
  if (dir === "SELL") return "VERKAUFEN";
  return "HALTEN";
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 62 ? "bg-emerald-500" : pct <= 38 ? "bg-red-500" : "bg-amber-400";
  return (
    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden w-full">
      {/* Zone markers */}
      <div className="absolute inset-y-0 left-[38%] w-px bg-slate-300/70" />
      <div className="absolute inset-y-0 left-[62%] w-px bg-slate-300/70" />
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CategoryBadge({
  label, icon: Icon, signals, color,
}: {
  label: string;
  icon: React.ElementType;
  signals: IndividualSignal[];
  color: string;
}) {
  const bulls = signals.filter((s) => s.direction === "BUY").length;
  const bears = signals.filter((s) => s.direction === "SELL").length;
  const total = signals.length;
  const score = total > 0 ? signals.reduce((s, x) => s + x.strength, 0) / total : 0.5;
  const dir: SignalDir = score >= 0.62 ? "BUY" : score <= 0.38 ? "SELL" : "HOLD";
  const c = dirColor(dir);

  return (
    <div className={cn("rounded-xl border p-4 flex flex-col gap-2", c.bg, c.border)}>
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={color} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className={cn("text-base font-bold", c.text)}>{dirLabel(dir)}</p>
      <div className="flex items-center gap-1 flex-wrap">
        {total > 0 && (
          <>
            {bulls > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">▲ {bulls}</span>}
            {bears > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">▼ {bears}</span>}
            {(total - bulls - bears) > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">◼ {total - bulls - bears}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: IndividualSignal }) {
  const [expanded, setExpanded] = useState(false);
  const c = dirColor(signal.direction);
  const pct = Math.round(signal.strength * 100);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all cursor-pointer select-none",
        c.border,
        expanded ? cn("shadow-sm", c.bg) : "bg-white hover:border-slate-300",
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">
              {signal.category === "technical" ? "Technisch" : signal.category === "fundamental" ? "Fundamental" : "Sentiment"}
            </p>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{signal.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
              {signal.currentValue}
            </span>
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border",
              signal.direction === "BUY" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              signal.direction === "SELL" ? "bg-red-50 text-red-600 border-red-200" :
              "bg-slate-50 text-slate-500 border-slate-200"
            )}>
              {signal.direction === "BUY" ? <TrendingUp size={9} /> : signal.direction === "SELL" ? <TrendingDown size={9} /> : <Minus size={9} />}
              {dirLabel(signal.direction)}
            </span>
          </div>
        </div>

        {/* Strength bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300/70" />
            <div
              className={cn(
                "h-full rounded-full",
                signal.direction === "BUY" ? "bg-emerald-400" :
                signal.direction === "SELL" ? "bg-red-400" : "bg-slate-300"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 w-8 text-right">
            {signal.direction === "BUY" ? `+${pct - 50}` : signal.direction === "SELL" ? `−${50 - pct}` : "0"}
          </span>
        </div>

        <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
          {signal.interpretation}
        </p>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100/80 pt-3 space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">{signal.description}</p>
          <div className="flex items-start gap-1.5">
            <BookOpen size={10} className="text-slate-300 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-400 italic leading-relaxed">{signal.reference}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Loading skeleton
// ──────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-slate-100 animate-pulse rounded", className)} />;
}

function SignalsPanelSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

interface Props {
  ticker: string;
  name: string;
}

export function SignalsPanel({ ticker, name }: Props) {
  const [data, setData] = useState<SignalsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "technical" | "fundamental" | "sentiment">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/yahoo/signals?symbol=${encodeURIComponent(ticker)}`);
      if (!res.ok) throw new Error("Signal-Berechnung fehlgeschlagen");
      const json = await res.json() as SignalsResult;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [ticker]);

  if (loading) return <SignalsPanelSkeleton />;

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-8 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={28} className="text-red-300" />
        <p className="text-sm font-medium text-slate-700">Signal-Berechnung nicht verfügbar</p>
        <p className="text-xs text-slate-400">{error ?? "Keine Daten erhalten"}</p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition mt-1"
        >
          <RefreshCw size={11} /> Erneut versuchen
        </button>
      </div>
    );
  }

  const { overall, score, confidence, bullCount, bearCount, neutralCount, signals } = data;
  const pctScore = Math.round(score * 100);
  const oc = dirColor(overall);

  const technical = signals.filter((s) => s.category === "technical");
  const fundamental = signals.filter((s) => s.category === "fundamental");
  const sentiment = signals.filter((s) => s.category === "sentiment");

  const visible = filter === "all" ? signals : signals.filter((s) => s.category === filter);

  return (
    <div className="space-y-5">
      {/* ── Verdict banner ──────────────────────────────────────── */}
      <div className={cn(
        "rounded-xl border-2 p-5 flex flex-col md:flex-row md:items-center gap-4",
        oc.border, oc.bg,
      )}>
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
            overall === "BUY" ? "bg-emerald-100" : overall === "SELL" ? "bg-red-100" : "bg-slate-100",
          )}>
            {overall === "BUY" ? (
              <TrendingUp size={24} className="text-emerald-600" />
            ) : overall === "SELL" ? (
              <TrendingDown size={24} className="text-red-500" />
            ) : (
              <Minus size={24} className="text-slate-500" />
            )}
          </div>

          {/* Main text */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">
              Gesamtsignal — {name}
            </p>
            <p className={cn("text-3xl font-extrabold tracking-tight", oc.text)}>
              {dirLabel(overall)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {bullCount} Kaufsignale · {neutralCount} Neutral · {bearCount} Verkaufssignale
            </p>
          </div>
        </div>

        {/* Score gauge */}
        <div className="md:w-56 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Score</p>
            <p className={cn("text-xl font-bold tabular-nums", oc.text)}>{pctScore}/100</p>
          </div>
          <ScoreBar score={score} />
          <div className="flex justify-between text-[9px] text-slate-300">
            <span>Verkaufen</span>
            <span>Halten</span>
            <span>Kaufen</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">
            Konfidenz: {(confidence * 100).toFixed(0)}% · {signals.length} Signale
          </p>
        </div>
      </div>

      {/* ── Category breakdown ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <CategoryBadge label="Technisch" icon={BarChart2} signals={technical} color="text-blue-500" />
        <CategoryBadge label="Fundamental" icon={Layers} signals={fundamental} color="text-violet-500" />
        <CategoryBadge label="Sentiment" icon={Users} signals={sentiment} color="text-orange-500" />
      </div>

      {/* ── Methodology note ──────────────────────────────────── */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2">
        <BookOpen size={12} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          <strong>Methodik:</strong> Jedes Signal basiert auf einer peer-reviewed akademischen Quelle.
          Technische Signale (40%), Fundamentaldaten (40%) und Sentiment (20%) werden kategoriegewichtet
          aggregiert. <em>Kein Anlagebericht — nur algorithmische Indikation.</em>
        </p>
      </div>

      {/* ── Signal filter ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap">
        <p className="text-[10px] uppercase tracking-wide text-slate-400 mr-2">Filter:</p>
        {([
          { id: "all", label: `Alle (${signals.length})` },
          { id: "technical", label: `Technisch (${technical.length})` },
          { id: "fundamental", label: `Fundamental (${fundamental.length})` },
          { id: "sentiment", label: `Sentiment (${sentiment.length})` },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              "text-[11px] px-3 py-1 rounded-full border transition",
              filter === id
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Individual signal cards ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.map((s) => <SignalCard key={s.id} signal={s} />)}
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────── */}
      <p className="text-[10px] text-slate-300 pb-2">
        Berechnet am {new Date(data.computedAt).toLocaleString("de-DE")} · Quelle: Yahoo Finance ·
        Keine Anlageberatung — rein algorithmische Signale auf Basis öffentlich zugänglicher Marktdaten.
        Klicke auf ein Signal-Karte für akademische Quellenangabe.
      </p>
    </div>
  );
}
