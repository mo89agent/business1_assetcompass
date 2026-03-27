"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { StockHolding } from "@/lib/data/stocks";

type SortKey = keyof Pick<StockHolding, "ticker" | "marketValue" | "unrealizedGainPct" | "ytdReturn" | "weight" | "dividendYieldPct">;
type FilterTab = "all" | "etf" | "stock";

interface LivePrices {
  [ticker: string]: { price: number; changePct: number; change: number };
}

interface StocksTableProps {
  holdings: StockHolding[];
  currency: string;
}

export function StocksTable({ holdings, currency }: StocksTableProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortAsc, setSortAsc] = useState(false);
  const [livePrices, setLivePrices] = useState<LivePrices>({});
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function fetchLivePrices() {
    setLiveLoading(true);
    try {
      const tickers = holdings.map((h) => h.ticker).join(",");
      const res = await fetch(`/api/yahoo/quote?symbols=${encodeURIComponent(tickers)}`);
      if (!res.ok) return;
      const json = await res.json();
      const prices: LivePrices = {};
      for (const q of json.quotes ?? []) {
        prices[q.symbol ?? q._symbol] = {
          price: q.regularMarketPrice ?? 0,
          changePct: q.regularMarketChangePercent ?? 0,
          change: q.regularMarketChange ?? 0,
        };
      }
      setLivePrices(prices);
      setLastRefreshed(new Date());
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    fetchLivePrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const filtered = holdings.filter((h) =>
    tab === "all" ? true : tab === "etf" ? h.type === "ETF" : h.type === "STOCK"
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  const etfCount = holdings.filter((h) => h.type === "ETF").length;
  const stockCount = holdings.filter((h) => h.type === "STOCK").length;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={11} className="text-slate-300" />;
    return sortAsc
      ? <ChevronUp size={11} className="text-blue-500" />
      : <ChevronDown size={11} className="text-blue-500" />;
  }

  function Th({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    return (
      <th
        onClick={() => handleSort(col)}
        className={cn("text-xs text-slate-500 font-medium cursor-pointer select-none whitespace-nowrap py-2 px-3", className)}
      >
        <div className="flex items-center gap-1 group">
          <span className="group-hover:text-slate-700 transition-colors">{label}</span>
          <SortIcon col={col} />
        </div>
      </th>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Tab bar + refresh */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {([["all", `Alle (${holdings.length})`], ["etf", `ETFs (${etfCount})`], ["stock", `Aktien (${stockCount})`]] as [FilterTab, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                "text-xs px-3 py-1 rounded-md font-medium transition-all",
                tab === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-xs text-slate-400">
              Aktualisiert {lastRefreshed.toLocaleTimeString("de-DE", { timeStyle: "short" })}
            </span>
          )}
          <button
            onClick={fetchLivePrices}
            disabled={liveLoading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={12} className={cn(liveLoading && "animate-spin")} />
            Live-Kurse
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead className="border-y border-slate-100 bg-slate-50">
            <tr>
              <th className="text-xs text-slate-500 font-medium text-left py-2 px-3">Wertpapier</th>
              <th className="text-xs text-slate-500 font-medium text-left py-2 px-3">Typ</th>
              <Th col="marketValue" label="Wert" className="text-right" />
              <th className="text-xs text-slate-500 font-medium text-right py-2 px-3 whitespace-nowrap">Live-Kurs</th>
              <th className="text-xs text-slate-500 font-medium text-right py-2 px-3 whitespace-nowrap">Heute</th>
              <Th col="unrealizedGainPct" label="G&V %" className="text-right" />
              <Th col="ytdReturn" label="YTD" className="text-right" />
              <Th col="dividendYieldPct" label="Div.-Rendite" className="text-right" />
              <th className="text-xs text-slate-500 font-medium text-right py-2 px-3">Div./Jahr</th>
              <Th col="weight" label="Gewicht" className="text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((h) => {
              const live = livePrices[h.ticker];
              const isGain = h.unrealizedGain >= 0;
              const isDayUp = (live?.changePct ?? 0) >= 0;

              return (
                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Name */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-900 text-xs">{h.ticker}</div>
                    <div className="text-slate-500 text-[11px] max-w-[180px] truncate">{h.name}</div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3">
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide",
                      h.type === "ETF"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-blue-50 text-blue-700"
                    )}>
                      {h.type === "ETF" ? "ETF" : "Aktie"}
                    </span>
                  </td>

                  {/* Market Value */}
                  <td className="py-3 px-3 text-right font-medium text-slate-900 text-xs tabular-nums">
                    {formatCurrency(h.marketValue, currency)}
                    <div className="text-[10px] text-slate-400">{h.quantity} Stk.</div>
                  </td>

                  {/* Live Price */}
                  <td className="py-3 px-3 text-right tabular-nums text-xs">
                    {live ? (
                      <span className="text-slate-900">
                        {live.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {h.currency}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {h.currentPrice.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {h.currency}
                      </span>
                    )}
                  </td>

                  {/* Day Change */}
                  <td className="py-3 px-3 text-right tabular-nums text-xs">
                    {live ? (
                      <span className={cn("flex items-center justify-end gap-0.5", isDayUp ? "text-emerald-600" : "text-red-500")}>
                        {isDayUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isDayUp ? "+" : ""}{live.changePct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* G&V % */}
                  <td className="py-3 px-3 text-right tabular-nums text-xs">
                    <span className={cn("font-medium", isGain ? "text-emerald-600" : "text-red-500")}>
                      {isGain ? "+" : ""}{h.unrealizedGainPct.toFixed(1)}%
                    </span>
                    <div className={cn("text-[10px]", isGain ? "text-emerald-500" : "text-red-400")}>
                      {isGain ? "+" : ""}{formatCurrency(h.unrealizedGain, h.currency)}
                    </div>
                  </td>

                  {/* YTD */}
                  <td className="py-3 px-3 text-right tabular-nums text-xs">
                    {h.ytdReturn != null ? (
                      <span className={cn("font-medium", h.ytdReturn >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {h.ytdReturn >= 0 ? "+" : ""}{h.ytdReturn.toFixed(1)}%
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>

                  {/* Dividend Yield */}
                  <td className="py-3 px-3 text-right tabular-nums text-xs">
                    {h.dividendYieldPct != null && h.dividendYieldPct > 0 ? (
                      <span className="text-amber-600 font-medium">{h.dividendYieldPct.toFixed(2)}%</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Annual Dividend */}
                  <td className="py-3 px-3 text-right tabular-nums text-xs">
                    {h.annualDividendIncome != null && h.annualDividendIncome > 0 ? (
                      <span className="text-slate-700">{formatCurrency(h.annualDividendIncome, h.currency)}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Weight */}
                  <td className="py-3 px-3 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(h.weight, 30) * (100 / 30)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">{formatPercent(h.weight)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
