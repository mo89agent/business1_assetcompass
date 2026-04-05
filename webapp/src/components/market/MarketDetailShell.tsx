"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FundamentalsPanel, type Fundamentals } from "@/components/holdings/FundamentalsPanel";
import { AssetPriceChart } from "@/components/holdings/AssetPriceChart";
import { SignalsPanel } from "@/components/holdings/SignalsPanel";
import { MarketEtfPanel } from "@/components/market/MarketEtfPanel";
import { AddAssetDrawer } from "@/components/holdings/AddAssetDrawer";
import { Plus, ArrowLeft, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import Link from "next/link";
import type { AssetClass } from "@/lib/types";

interface Props {
  symbol: string;
}

type Tab = "overview" | "fundamentals" | "signals" | "etf";

// ── Asset type label mapping ───────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  EQUITY:         "Aktie",
  ETF:            "ETF",
  MUTUALFUND:     "Fonds",
  CRYPTOCURRENCY: "Krypto",
  CURRENCY:       "Währung",
  INDEX:          "Index",
  FUTURE:         "Future",
  OPTION:         "Option",
};

function assetTypeLabel(quoteType: string | null): string {
  if (!quoteType) return "Wertpapier";
  return TYPE_LABEL[quoteType.toUpperCase()] ?? quoteType;
}

function assetTypeBadgeColor(quoteType: string | null): string {
  const t = quoteType?.toUpperCase();
  if (t === "ETF" || t === "MUTUALFUND") return "bg-violet-100 text-violet-700 border-violet-200";
  if (t === "CRYPTOCURRENCY") return "bg-amber-100 text-amber-700 border-amber-200";
  if (t === "INDEX") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-blue-100 text-blue-700 border-blue-200"; // EQUITY default
}

function quoteTypeToAssetClass(quoteType: string | null): AssetClass {
  if (quoteType === "ETF" || quoteType === "MUTUALFUND") return "ETF";
  if (quoteType === "CRYPTOCURRENCY") return "CRYPTO";
  return "STOCK";
}

function isEtfType(quoteType: string | null): boolean {
  const t = quoteType?.toUpperCase();
  return t === "ETF" || t === "MUTUALFUND";
}

// ── Formatting helpers ─────────────────────────────────────────────────────────
function fmt(v: number | null, digits = 2, suffix = "") {
  if (v == null) return "—";
  return v.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + suffix;
}
function fmtLarge(v: number | null) {
  if (v == null) return "—";
  if (v >= 1e12) return (v / 1e12).toFixed(2) + " Bio.";
  if (v >= 1e9)  return (v / 1e9).toFixed(2)  + " Mrd.";
  if (v >= 1e6)  return (v / 1e6).toFixed(2)  + " Mio.";
  return v.toLocaleString("de-DE");
}

// ── Key Metrics Strip ──────────────────────────────────────────────────────────
function MetricsStrip({ d }: { d: Fundamentals }) {
  const curr = d.currency ?? "USD";
  const isEtf = isEtfType(d.quoteType);

  const stockMetrics = [
    { label: "MARKTK.",        value: fmtLarge(d.marketCap) + (d.marketCap ? " " + curr : "") },
    { label: "KGV (TRAILING)", value: d.trailingPE != null ? fmt(d.trailingPE, 1, "x") : "—" },
    { label: "KGV (FORWARD)",  value: d.forwardPE  != null ? fmt(d.forwardPE,  1, "x") : "—" },
    { label: "KBV",            value: d.priceToBook  != null ? fmt(d.priceToBook, 2, "x") : "—" },
    { label: "KUV",            value: d.priceToSales != null ? fmt(d.priceToSales, 2, "x") : "—" },
    { label: "EV/EBITDA",      value: d.evToEbitda  != null ? fmt(d.evToEbitda, 1, "x") : "—" },
    { label: "DIV. RENDITE",   value: d.dividendYield != null ? fmt(d.dividendYield * 100, 2, " %") : "—" },
    { label: "BETA",           value: d.beta != null ? fmt(d.beta, 2) : "—" },
    { label: "52W HOCH",       value: d.week52High != null ? fmt(d.week52High, 2) : "—" },
    { label: "52W TIEF",       value: d.week52Low  != null ? fmt(d.week52Low,  2) : "—" },
  ];

  const etfMetrics = [
    { label: "VERMÖGEN (AUM)", value: fmtLarge(d.totalAssets) },
    { label: "TER",            value: d.expenseRatio != null ? fmt(d.expenseRatio * 100, 2, " %") : "—" },
    { label: "YTD RENDITE",    value: d.ytdReturn    != null ? fmt(d.ytdReturn * 100, 2, " %") : "—" },
    { label: "DIV. RENDITE",   value: d.dividendYield != null ? fmt(d.dividendYield * 100, 2, " %") : "—" },
    { label: "BETA (3J)",      value: d.beta3Year != null ? fmt(d.beta3Year, 2) : (d.beta != null ? fmt(d.beta, 2) : "—") },
    { label: "52W HOCH",       value: d.week52High != null ? fmt(d.week52High, 2) : "—" },
    { label: "52W TIEF",       value: d.week52Low  != null ? fmt(d.week52Low,  2) : "—" },
  ];

  const metrics = isEtf ? etfMetrics : stockMetrics;

  return (
    <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
      {metrics.map(({ label, value }) => (
        <div key={label} className="shrink-0">
          <p className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-slate-800 tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MarketDetailShell({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [addOpen, setAddOpen] = useState(false);
  const [headerData, setHeaderData] = useState<Fundamentals | null>(null);
  const [headerLoading, setHeaderLoading] = useState(true);

  useEffect(() => {
    setHeaderLoading(true);
    fetch(`/api/yahoo/fundamentals?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setHeaderData(d as Fundamentals); })
      .catch(() => {/* header just stays empty */})
      .finally(() => setHeaderLoading(false));
  }, [symbol]);

  const isEtf = isEtfType(headerData?.quoteType ?? null);
  const assetClass = quoteTypeToAssetClass(headerData?.quoteType ?? null);
  const curr = headerData?.currency ?? "USD";
  const isUp = (headerData?.changePct ?? 0) >= 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview",     label: "Übersicht" },
    { id: "fundamentals", label: "Fundamentaldaten" },
    { id: "signals",      label: "Qualitäts-Check" },
    ...(isEtf ? [{ id: "etf" as Tab, label: "ETF-Details" }] : []),
  ];

  return (
    <>
      <div className="space-y-0 max-w-5xl mx-auto">

        {/* ── Back navigation ─────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <Link
            href="/dashboard/holdings"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={14} />
            Holdings
          </Link>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={14} />
            Zum Portfolio hinzufügen
          </button>
        </div>

        {/* ── Bloomberg-style header card ───────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          {headerLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={16} className="animate-spin text-slate-300" />
              <span className="text-sm text-slate-400">Marktdaten werden geladen…</span>
            </div>
          ) : (
            <>
              {/* Top row: badge + name + exchange breadcrumb */}
              <div className="flex items-start gap-3 flex-wrap">
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded border tracking-widest uppercase mt-0.5 shrink-0",
                  assetTypeBadgeColor(headerData?.quoteType ?? null)
                )}>
                  {assetTypeLabel(headerData?.quoteType ?? null)}
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    {headerData?.shortName ?? symbol}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {headerData?.sector && <span>{headerData.sector}</span>}
                    {headerData?.sector && headerData?.industry && <span>·</span>}
                    {headerData?.industry && <span>{headerData.industry}</span>}
                    {(headerData?.sector || headerData?.industry) && headerData?.exchange && <span>·</span>}
                    {headerData?.exchange && <span className="font-mono">{headerData.exchange}</span>}
                    {!headerData?.sector && !headerData?.industry && !headerData?.exchange && (
                      <span className="font-mono">{symbol}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Price + change */}
              {headerData?.price != null && (
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <p className="text-3xl font-bold text-slate-900 tabular-nums">
                      {headerData.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-base text-slate-400 ml-2 font-normal">{curr}</span>
                    </p>
                  </div>
                  {headerData.change != null && headerData.changePct != null && (
                    <p className={cn(
                      "flex items-center gap-1.5 text-base font-semibold pb-0.5",
                      isUp ? "text-emerald-600" : "text-red-500"
                    )}>
                      {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {isUp ? "+" : ""}{headerData.change.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {" "}({isUp ? "+" : ""}{headerData.changePct.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %)
                    </p>
                  )}
                  <p className="text-[10px] text-slate-300 pb-0.5 ml-auto">Quelle: Yahoo Finance · Echtzeit</p>
                </div>
              )}

              {/* Key metrics strip */}
              {headerData && <MetricsStrip d={headerData} />}
            </>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-slate-200 mt-5 overflow-x-auto">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap",
                tab === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────── */}
        <div className="pt-5">
          {tab === "overview" && (
            <AssetPriceChart
              ticker={symbol}
              assetClass={assetClass}
              currency={curr}
              name={headerData?.shortName ?? symbol}
              avgCostBasis={0}
            />
          )}

          {tab === "fundamentals" && (
            <FundamentalsPanel
              symbol={symbol}
              compact
              initialData={headerData ?? undefined}
            />
          )}

          {tab === "signals" && (
            <SignalsPanel
              ticker={symbol}
              name={headerData?.shortName ?? symbol}
            />
          )}

          {tab === "etf" && (
            <MarketEtfPanel symbol={symbol} />
          )}
        </div>
      </div>

      <AddAssetDrawer open={addOpen} onClose={() => setAddOpen(false)} prefillSymbol={symbol} />
    </>
  );
}
