"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PositionRow } from "@/lib/types";

export interface LivePrice {
  price: number;
  change: number;
  changePct: number;
  currency: string;
  lastUpdated: Date;
}

type LivePriceMap = Record<string, LivePrice>;

/** Maps position tickers to Yahoo Finance symbols */
function toYahooSymbol(ticker: string, assetClass: string): string {
  if (assetClass === "CRYPTO") {
    if (ticker === "BTC") return "BTC-USD";
    if (ticker === "ETH") return "ETH-USD";
    return ticker + "-USD";
  }
  return ticker;
}

interface UseLivePricesOptions {
  intervalMs?: number;
  onUpdate?: (prices: LivePriceMap) => void;
}

export function useLivePrices(
  positions: PositionRow[],
  setPrices: (prices: LivePriceMap) => void,
  { intervalMs = 30_000 }: UseLivePricesOptions = {}
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = useCallback(async () => {
    const eligible = positions.filter(
      (p) => p.ticker && p.assetClass !== "CASH" && p.assetClass !== "GOLD"
    );
    if (eligible.length === 0) return;

    const symbols = eligible
      .map((p) => toYahooSymbol(p.ticker!, p.assetClass))
      .join(",");

    try {
      const res = await fetch(`/api/yahoo/quote?symbols=${encodeURIComponent(symbols)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { quotes?: Record<string, unknown>[] };
      if (!data.quotes) return;

      const map: LivePriceMap = {};
      for (const q of data.quotes) {
        const yahooSymbol = String(q._symbol ?? "");
        // Map back to original ticker
        const originalPos = eligible.find(
          (p) => toYahooSymbol(p.ticker!, p.assetClass) === yahooSymbol
        );
        if (!originalPos?.ticker) continue;

        const price = typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : null;
        const change = typeof q.regularMarketChange === "number" ? q.regularMarketChange : 0;
        const changePct = typeof q.regularMarketChangePercent === "number" ? q.regularMarketChangePercent : 0;
        const currency = typeof q.currency === "string" ? q.currency : originalPos.currency;

        if (price !== null) {
          map[originalPos.ticker] = { price, change, changePct, currency, lastUpdated: new Date() };
        }
      }
      setPrices(map);
    } catch {
      // silently fail — show stale data
    }
  }, [positions, setPrices]);

  useEffect(() => {
    fetchPrices();
    timerRef.current = setInterval(fetchPrices, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchPrices, intervalMs]);
}
