"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PositionRow, YahooSearchResult } from "@/lib/types";

interface Props {
  positions: PositionRow[];
}

interface YahooQuote {
  symbol: string;
  price: number | null;
  changePct: number | null;
  shortName: string | null;
  currency: string | null;
}

function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function GlobalSearch({ positions }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [yahooResults, setYahooResults] = useState<YahooSearchResult[]>([]);
  const [yahooQuotes, setYahooQuotes] = useState<Record<string, YahooQuote>>({});
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  // Local position matches
  const localMatches = query.length >= 1
    ? positions.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.ticker ?? "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];

  // Yahoo Finance search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setYahooResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/yahoo/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d: { results?: YahooSearchResult[] }) => {
        const results = (d.results ?? []).slice(0, 5);
        setYahooResults(results);

        // Fetch live quotes for each result
        const symbols = results.map((r) => r.symbol).join(",");
        if (symbols) {
          fetch(`/api/yahoo/quote?symbols=${encodeURIComponent(symbols)}`)
            .then((r) => r.json())
            .then((qd: { quotes?: Record<string, unknown>[] }) => {
              const map: Record<string, YahooQuote> = {};
              for (const q of qd.quotes ?? []) {
                const sym = String(q._symbol ?? "");
                map[sym] = {
                  symbol: sym,
                  price: typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : null,
                  changePct: typeof q.regularMarketChangePercent === "number" ? q.regularMarketChangePercent : null,
                  shortName: typeof q.shortName === "string" ? q.shortName : null,
                  currency: typeof q.currency === "string" ? q.currency : null,
                };
              }
              setYahooQuotes(map);
            })
            .catch(() => {});
        }
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allItems: Array<{ type: "local"; pos: PositionRow } | { type: "yahoo"; result: YahooSearchResult }> = [
    ...localMatches.map((p) => ({ type: "local" as const, pos: p })),
    ...yahooResults.map((r) => ({ type: "yahoo" as const, result: r })),
  ];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const item = allItems[activeIdx];
      if (item.type === "local") {
        router.push(`/dashboard/holdings/${item.pos.id}`);
        closeSearch();
      }
    } else if (e.key === "Escape") {
      closeSearch();
    }
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setActiveIdx(-1);
    inputRef.current?.blur();
  }

  const showDropdown = open && query.length >= 1 && (localMatches.length > 0 || yahooResults.length > 0 || searching);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Aktie, ETF, Transaktion suchen…"
          className="w-full pl-8 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
        />
        {searching && (
          <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">

          {/* Local positions */}
          {localMatches.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                Meine Positionen
              </div>
              {localMatches.map((pos, i) => {
                const idx = i;
                return (
                  <button
                    key={pos.id}
                    onClick={() => { router.push(`/dashboard/holdings/${pos.id}`); closeSearch(); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left",
                      activeIdx === idx ? "bg-blue-50" : ""
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">
                        {(pos.ticker ?? pos.name.slice(0, 2)).slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{pos.name}</p>
                      <p className="text-xs text-slate-400">{pos.ticker} · {pos.accountName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-700">
                        {pos.marketValue.toLocaleString("de-DE", { maximumFractionDigits: 0 })} {pos.currency}
                      </p>
                      <p className={cn("text-[10px]", pos.unrealizedGain >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {pos.unrealizedGain >= 0 ? "+" : ""}{pos.unrealizedGainPct.toFixed(1)}%
                      </p>
                    </div>
                    <ArrowRight size={12} className="text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Yahoo Finance results */}
          {(yahooResults.length > 0 || searching) && (
            <div>
              <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 border-t border-slate-100">
                Märkte (Yahoo Finance)
              </div>
              {searching && yahooResults.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <Loader2 size={16} className="text-slate-300 animate-spin mx-auto" />
                </div>
              )}
              {yahooResults.map((r, i) => {
                const idx = localMatches.length + i;
                const quote = yahooQuotes[r.symbol];
                const isUp = (quote?.changePct ?? 0) >= 0;
                return (
                  <button
                    key={r.symbol}
                    onClick={() => {
                      // Navigate to holdings detail if we own it, else open add drawer
                      const owned = positions.find((p) => p.ticker === r.symbol);
                      if (owned) {
                        router.push(`/dashboard/holdings/${owned.id}`);
                      }
                      closeSearch();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left",
                      activeIdx === idx ? "bg-slate-50" : ""
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">
                        {(r.symbol ?? "").slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{r.shortname ?? r.symbol}</p>
                      <p className="text-xs text-slate-400">{r.symbol} · {r.typeDisp} · {r.exchDisp}</p>
                    </div>
                    {quote?.price != null && (
                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            {quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {quote.currency ? " " + quote.currency : ""}
                          </p>
                          {quote.changePct != null && (
                            <p className={cn("text-[10px] flex items-center justify-end gap-0.5", isUp ? "text-emerald-600" : "text-red-500")}>
                              {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                              {isUp ? "+" : ""}{quote.changePct.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {positions.some((p) => p.ticker === r.symbol) && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                        Im Portfolio
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {!searching && query.length >= 2 && localMatches.length === 0 && yahooResults.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-slate-400">
              Keine Ergebnisse für „{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
