"use client";

import { useState, useCallback } from "react";
import { cn, formatCurrency, formatPercent, gainColor, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from "@/lib/utils";
import type { PositionRow, TaxLot, EtfExposure, PositionDividend, AssetClass } from "@/lib/types";
import { useLivePrices, type LivePrice } from "@/hooks/useLivePrices";
import { AssetPriceChart } from "./AssetPriceChart";
import { TotalReturnCard } from "./TotalReturnCard";
import { TaxLotsTable } from "./TaxLotsTable";
import { PositionDividendHistory } from "./PositionDividendHistory";
import { EtfLookthrough } from "./EtfLookthrough";
import { FundamentalsPanel } from "./FundamentalsPanel";
import { PositionReturnChart } from "./PositionReturnChart";
import { SignalsPanel } from "./SignalsPanel";

type Tab = "overview" | "lots" | "dividends" | "lookthrough" | "fundamentals" | "signals";

interface Props {
  position: PositionRow;
  taxLots: TaxLot[];
  etfExposure: EtfExposure | null;
  dividends: PositionDividend[];
}

function MetricCard({ label, value, sub, valueClass }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={cn("text-sm font-bold", valueClass ?? "text-slate-900")}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function HoldingDetailShell({ position, taxLots, etfExposure, dividends }: Props) {
  const isEtf = position.assetClass === "ETF" || position.assetClass === "FUND";

  // ── Live price feed ──────────────────────────────────────────────
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const handlePricesUpdate = useCallback((prices: Record<string, LivePrice>) => {
    setLivePrices(prices);
  }, []);
  useLivePrices([position], handlePricesUpdate);

  // Enrich position with live price if available
  const live = position.ticker ? livePrices[position.ticker] : undefined;
  const livePrice   = live?.price ?? position.currentPrice;
  const liveMV      = live != null && position.assetClass !== "CASH"
    ? position.quantity * live.price
    : position.marketValue;
  const liveGain    = liveMV - position.bookValue;
  const liveGainPct = position.bookValue > 0 ? (liveGain / position.bookValue) * 100 : 0;

  const livePosition: PositionRow = {
    ...position,
    currentPrice:      livePrice,
    marketValue:       liveMV,
    unrealizedGain:    liveGain,
    unrealizedGainPct: liveGainPct,
  };
  // ─────────────────────────────────────────────────────────────────

  const hasYahooTicker = !!position.ticker && position.assetClass !== "CASH";
  const showDividendTab =
    hasYahooTicker &&
    !["CASH", "CRYPTO", "REAL_ESTATE"].includes(position.assetClass);

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "overview",      label: "Übersicht",         show: true },
    { id: "signals",       label: "Signale",            show: hasYahooTicker },
    { id: "fundamentals",  label: "Fundamentals",       show: hasYahooTicker },
    { id: "lots",          label: `Kauflose (${taxLots.length})`, show: taxLots.length > 0 },
    { id: "dividends",     label: "Dividenden",         show: showDividendTab },
    { id: "lookthrough",   label: "ETF Look-through",   show: isEtf && !!etfExposure },
  ];

  const visibleTabs = tabs.filter((t) => t.show);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const color = ASSET_CLASS_COLORS[position.assetClass];
  const isGain = liveGain >= 0;

  // Key metrics for overview sidebar
  const totalDividendsReceived = dividends.filter((d) => !d.isProjected).reduce((s, d) => s + d.totalAmount, 0);
  const ttmDivs = dividends.filter((d) => {
    if (d.isProjected) return false;
    const age = (Date.now() - new Date(d.exDate).getTime()) / 86_400_000;
    return age <= 365;
  }).reduce((s, d) => s + d.totalAmount, 0);
  const yieldOnMarket = liveMV > 0 && ttmDivs > 0 ? (ttmDivs / liveMV) * 100 : null;

  return (
    <div className="space-y-5">
      {/* Position header card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: color + "22", color }}
          >
            {(position.ticker ?? position.name.slice(0, 4)).slice(0, 4)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">{position.name}</h1>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {position.ticker && <span className="text-sm text-slate-400 font-mono">{position.ticker}</span>}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: color + "22", color }}
              >
                {ASSET_CLASS_LABELS[position.assetClass]}
              </span>
              <span className="text-xs text-slate-400">{position.accountName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(liveMV, position.currency)}
            </p>
            <p className={cn("text-sm font-medium mt-0.5", gainColor(liveGain))}>
              {isGain ? "+" : ""}{formatCurrency(liveGain, position.currency)}{" "}
              ({isGain ? "+" : ""}{formatPercent(liveGainPct)})
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {position.quantity.toLocaleString("de-DE")} Stk. · Ø{" "}
              {formatCurrency(position.avgCostBasis, position.currency, { maximumFractionDigits: 2 })}
              {live && (
                <span className="ml-1 text-emerald-600">
                  · Live {formatCurrency(livePrice, live.currency, { maximumFractionDigits: 2 })}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ─────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Price chart — full width */}
          <AssetPriceChart
            ticker={position.ticker}
            assetClass={position.assetClass}
            currency={position.currency}
            avgCostBasis={position.avgCostBasis}
            name={position.name}
          />

          {/* 2-col: total return + key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TotalReturnCard position={livePosition} dividends={dividends} />

            {/* Key metrics card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Kennzahlen</h3>
              <div className="space-y-2">
                {[
                  {
                    label: "Marktwert",
                    value: formatCurrency(liveMV, position.currency),
                  },
                  {
                    label: "Buchwert (Einstand)",
                    value: formatCurrency(position.bookValue, position.currency),
                  },
                  {
                    label: live ? "Kurs (Live)" : "Kurs (Snapshot)",
                    value: formatCurrency(livePrice, position.currency, { maximumFractionDigits: 2 }),
                  },
                  {
                    label: "Ø Einstandspreis",
                    value: formatCurrency(position.avgCostBasis, position.currency, { maximumFractionDigits: 2 }),
                  },
                  ...(yieldOnMarket != null
                    ? [{ label: "Dividendenrendite (TTM)", value: `${yieldOnMarket.toFixed(2)}%` }]
                    : []),
                  {
                    label: "Portfoliogewicht",
                    value: `${position.weight.toFixed(1)}%`,
                  },
                  {
                    label: "Offene Lots",
                    value: taxLots.length > 0 ? `${taxLots.length} Lot${taxLots.length !== 1 ? "s" : ""}` : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analytics charts: monthly returns, MA, distribution */}
          {position.assetClass !== "CASH" && (
            <PositionReturnChart
              ticker={position.ticker}
              assetClass={position.assetClass}
              currency={position.currency}
            />
          )}

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Anzahl Stücke"
              value={position.assetClass === "CRYPTO"
                ? position.quantity.toFixed(4)
                : position.quantity.toLocaleString("de-DE")}
            />
            <MetricCard
              label="Unrealisierter G&V"
              value={`${isGain ? "+" : ""}${formatCurrency(position.unrealizedGain, position.currency)}`}
              sub={`${isGain ? "+" : ""}${position.unrealizedGainPct.toFixed(2)}%`}
              valueClass={gainColor(position.unrealizedGain)}
            />
            <MetricCard
              label="Dividenden (gesamt)"
              value={totalDividendsReceived > 0
                ? formatCurrency(totalDividendsReceived, dividends[0]?.currency ?? position.currency)
                : "—"}
              sub={dividends.filter((d) => !d.isProjected).length > 0
                ? `${dividends.filter((d) => !d.isProjected).length} Zahlungen`
                : "Keine Daten"}
            />
            <MetricCard
              label="Kauflose"
              value={taxLots.length > 0 ? String(taxLots.length) : "—"}
              sub={taxLots.length > 0
                ? `Ältester: ${new Date(Math.min(...taxLots.map((l) => new Date(l.acquiredAt).getTime()))).toLocaleDateString("de-DE", { year: "numeric", month: "short" })}`
                : undefined}
            />
          </div>
        </div>
      )}

      {/* ── Tab: Signals ─────────────────────────────────────────── */}
      {activeTab === "signals" && position.ticker && (
        <SignalsPanel ticker={position.ticker} name={position.name} />
      )}

      {/* ── Tab: Fundamentals ─────────────────────────────────────── */}
      {activeTab === "fundamentals" && position.ticker && (
        <FundamentalsPanel symbol={position.ticker} assetClass={position.assetClass} />
      )}

      {/* ── Tab: Tax Lots ─────────────────────────────────────────── */}
      {activeTab === "lots" && (
        <TaxLotsTable
          lots={taxLots}
          assetClass={position.assetClass}
          currentPrice={position.currentPrice}
          currency={position.currency}
        />
      )}

      {/* ── Tab: Dividends ────────────────────────────────────────── */}
      {activeTab === "dividends" && (
        <PositionDividendHistory position={position} dividends={dividends} />
      )}

      {/* ── Tab: ETF Look-through ─────────────────────────────────── */}
      {activeTab === "lookthrough" && etfExposure && (
        <EtfLookthrough exposure={etfExposure} />
      )}
    </div>
  );
}
