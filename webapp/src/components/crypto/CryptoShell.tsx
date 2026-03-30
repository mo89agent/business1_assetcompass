"use client";

import { useState, useCallback } from "react";
import type { PositionRow } from "@/lib/types";
import { useLivePrices, type LivePrice } from "@/hooks/useLivePrices";
import { FundamentalsPanel } from "@/components/holdings/FundamentalsPanel";
import { AddAssetDrawer } from "@/components/holdings/AddAssetDrawer";
import { formatCurrency, formatNumber, gainColor, gainBg, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Plus, Info, Wifi, ArrowRight } from "lucide-react";
import Link from "next/link";

// Map short ticker to Yahoo Finance symbol for crypto
function cryptoYahooSymbol(ticker: string | null): string {
  if (!ticker) return "";
  const upper = ticker.toUpperCase().replace(/-USD$/, "");
  return upper + "-USD";
}

// Demo crypto positions used when portfolio has no CRYPTO positions
const DEMO_CRYPTO: PositionRow[] = [
  { id: "dc1", accountId: "a3", accountName: "Coinbase", instrumentId: "ic1", ticker: "BTC", name: "Bitcoin", assetClass: "CRYPTO", quantity: 0.85, avgCostBasis: 38000, bookValue: 32300, currentPrice: 54200, marketValue: 46070, unrealizedGain: 13770, unrealizedGainPct: 42.6, currency: "USD", weight: 65 },
  { id: "dc2", accountId: "a3", accountName: "Coinbase", instrumentId: "ic2", ticker: "ETH", name: "Ethereum", assetClass: "CRYPTO", quantity: 8.5, avgCostBasis: 1800, bookValue: 15300, currentPrice: 2280, marketValue: 19380, unrealizedGain: 4080, unrealizedGainPct: 26.7, currency: "USD", weight: 27 },
  { id: "dc3", accountId: "a3", accountName: "Phantom", instrumentId: "ic3", ticker: "SOL", name: "Solana", assetClass: "CRYPTO", quantity: 45, avgCostBasis: 95, bookValue: 4275, currentPrice: 142, marketValue: 6390, unrealizedGain: 2115, unrealizedGainPct: 49.5, currency: "USD", weight: 9 },
];

interface Props {
  cryptoPositions: PositionRow[];
}

export function CryptoShell({ cryptoPositions }: Props) {
  const positions = cryptoPositions.length > 0 ? cryptoPositions : DEMO_CRYPTO;
  const isDemo = cryptoPositions.length === 0;

  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [selected, setSelected] = useState<PositionRow>(positions[0]);
  const [addOpen, setAddOpen] = useState(false);

  const handlePricesUpdate = useCallback((prices: Record<string, LivePrice>) => {
    setLivePrices(prices);
  }, []);

  useLivePrices(positions, handlePricesUpdate);

  const liveUpdatedAt = Object.values(livePrices)[0]?.lastUpdated ?? null;

  // Compute portfolio stats with live prices
  const enriched = positions.map((pos) => {
    const yahooSym = cryptoYahooSymbol(pos.ticker);
    const live = livePrices[yahooSym] ?? livePrices[pos.ticker ?? ""];
    const livePrice = live?.price ?? pos.currentPrice;
    const marketValue = livePrice * pos.quantity;
    const unrealizedGain = marketValue - pos.bookValue;
    const unrealizedGainPct = pos.bookValue > 0 ? (unrealizedGain / pos.bookValue) * 100 : 0;
    return { ...pos, currentPrice: livePrice, marketValue, unrealizedGain, unrealizedGainPct };
  });

  const totalValue = enriched.reduce((s, p) => s + p.marketValue, 0);
  const totalGain = enriched.reduce((s, p) => s + p.unrealizedGain, 0);
  const totalBook = enriched.reduce((s, p) => s + p.bookValue, 0);
  const totalGainPct = totalBook > 0 ? (totalGain / totalBook) * 100 : 0;

  const selectedYahoo = cryptoYahooSymbol(selected.ticker);

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Crypto</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm text-slate-500">{positions.length} Positionen</p>
              {liveUpdatedAt && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live · {liveUpdatedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              {isDemo && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                  Demo-Daten
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0"
          >
            <Plus size={14} />
            Krypto hinzufügen
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Gesamtwert</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalValue, "USD")}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Unrealisierter Gewinn</p>
            <p className={cn("text-2xl font-bold mt-1", gainColor(totalGain))}>
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain, "USD")}
            </p>
            <p className={cn("text-xs mt-0.5", gainColor(totalGain))}>
              {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Einstandswert</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalBook, "USD")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: positions table */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Positionen</h2>
            {enriched.map((pos) => {
              const isSelected = pos.id === selected.id;
              const yahooSym = cryptoYahooSymbol(pos.ticker);
              const live = livePrices[yahooSym] ?? livePrices[pos.ticker ?? ""];
              const up = (live?.changePct ?? 0) >= 0;

              return (
                <button
                  key={pos.id}
                  onClick={() => setSelected(pos)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                      {(pos.ticker ?? "?").slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{pos.name}</p>
                        <span className={cn("text-xs font-medium shrink-0", gainColor(pos.unrealizedGain))}>
                          {pos.unrealizedGain >= 0 ? "+" : ""}{pos.unrealizedGainPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 gap-2">
                        <p className="text-xs text-slate-400">
                          {formatNumber(pos.quantity, 4)} {pos.ticker}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {live && (
                            <>
                              {up ? <TrendingUp size={9} className="text-emerald-500" /> : <TrendingDown size={9} className="text-red-400" />}
                              <span className={cn("text-[10px] font-medium", up ? "text-emerald-600" : "text-red-500")}>
                                {live.changePct >= 0 ? "+" : ""}{live.changePct.toFixed(2)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {formatCurrency(pos.marketValue, pos.currency)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Tax note */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
              <Info size={13} className="shrink-0 mt-0.5" />
              <p><strong>Steuerhinweis:</strong> Krypto nach 1 Jahr Haltedauer ggf. steuerfrei (§23 EStG).</p>
            </div>
          </div>

          {/* Right: detail + fundamentals */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live price card */}
            {(() => {
              const yahooSym = cryptoYahooSymbol(selected.ticker);
              const live = livePrices[yahooSym] ?? livePrices[selected.ticker ?? ""];
              const selectedEnriched = enriched.find((p) => p.id === selected.id) ?? selected;
              const up = (live?.changePct ?? 0) >= 0;

              return (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                        {(selected.ticker ?? "?").slice(0, 3)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{selected.name}</p>
                        <p className="text-xs text-slate-400">{selected.ticker} · {selected.accountName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {live ? (
                        <>
                          <p className="text-xl font-bold text-slate-900">
                            {live.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs text-slate-400 ml-1">{live.currency}</span>
                          </p>
                          <div className={cn("flex items-center justify-end gap-1 text-sm font-medium mt-0.5", up ? "text-emerald-600" : "text-red-500")}>
                            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {live.changePct >= 0 ? "+" : ""}{live.changePct.toFixed(2)}% heute
                          </div>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(selectedEnriched.currentPrice, selected.currency)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Position metrics */}
                  <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">Menge</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {formatNumber(selected.quantity, 6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Einstand</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {formatCurrency(selected.avgCostBasis, selected.currency, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Gewinn/Verlust</p>
                      <p className={cn("text-sm font-semibold mt-0.5", gainColor(selectedEnriched.unrealizedGain))}>
                        {selectedEnriched.unrealizedGain >= 0 ? "+" : ""}
                        {formatCurrency(selectedEnriched.unrealizedGain, selected.currency)}
                        <span className="text-xs ml-1">
                          ({selectedEnriched.unrealizedGainPct >= 0 ? "+" : ""}{selectedEnriched.unrealizedGainPct.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  {!isDemo && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Link
                        href={`/dashboard/holdings/${selected.id}`}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <ArrowRight size={12} />
                        Detailansicht &amp; Charts öffnen
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Fundamentals / market data */}
            {selectedYahoo && (
              <FundamentalsPanel symbol={selectedYahoo} />
            )}
          </div>
        </div>
      </div>

      <AddAssetDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </>
  );
}
