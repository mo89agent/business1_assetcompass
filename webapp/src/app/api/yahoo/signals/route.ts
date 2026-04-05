import { NextRequest, NextResponse } from "next/server";
import { yahooFinance } from "@/lib/yahoo";
import {
  computeAllSignals,
  aggregateSignals,
  type SignalsResult,
  type FundamentalInputs,
} from "@/lib/signals";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    // Fetch 2Y of daily prices (needed for SMA200 + 12-1M momentum)
    const period1 = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);

    const [chartRes, summaryRes] = await Promise.allSettled([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (yahooFinance as any).chart(symbol, { period1, interval: "1d" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (yahooFinance as any).quoteSummary(symbol, {
        modules: [
          "financialData",
          "defaultKeyStatistics",
          "summaryDetail",
          "recommendationTrend",
        ],
      }),
    ]);

    // ── Extract closes ──────────────────────────────────────────────────
    const closes: number[] = [];
    if (chartRes.status === "fulfilled") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quotes: Array<{ date: Date; close: number | null }> =
        (chartRes.value as any)?.quotes ?? [];
      for (const q of quotes) {
        if (q.close != null && q.close > 0) closes.push(q.close);
      }
    }

    // ── Extract fundamentals ────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: any =
      summaryRes.status === "fulfilled" ? summaryRes.value : null;

    const fd = summary?.financialData ?? {};
    const ks = summary?.defaultKeyStatistics ?? {};
    const sd = summary?.summaryDetail ?? {};
    const trendArr: Array<{
      strongBuy?: number; buy?: number; hold?: number; sell?: number; strongSell?: number;
    }> = summary?.recommendationTrend?.trend ?? [];

    const currentPrice: number | null = fd.currentPrice ?? ks.previousClose ?? null;

    // Derive recommendationMean from trend data if not available directly
    let recMean: number | null = fd.recommendationMean ?? null;
    if (recMean == null && trendArr.length > 0) {
      const t = trendArr[0];
      const total =
        (t.strongBuy ?? 0) * 1 +
        (t.buy ?? 0) * 2 +
        (t.hold ?? 0) * 3 +
        (t.sell ?? 0) * 4 +
        (t.strongSell ?? 0) * 5;
      const count =
        (t.strongBuy ?? 0) +
        (t.buy ?? 0) +
        (t.hold ?? 0) +
        (t.sell ?? 0) +
        (t.strongSell ?? 0);
      if (count > 0) recMean = total / count;
    }

    const fundamentals: FundamentalInputs = {
      pe: sd.trailingPE ?? null,
      forwardPe: ks.forwardPE ?? sd.forwardPE ?? null,
      priceToBook: ks.priceToBook ?? null,
      debtToEquity: fd.debtToEquity ?? null,
      returnOnEquity: fd.returnOnEquity ?? null,
      revenueGrowth: fd.revenueGrowth ?? null,
      earningsGrowth: fd.earningsGrowth ?? null,
      recommendationMean: recMean,
      targetMeanPrice: fd.targetMeanPrice ?? null,
      currentPrice,
      dividendYield: sd.dividendYield ?? ks.dividendYield ?? null,
      payoutRatio: sd.payoutRatio ?? null,
      beta: ks.beta ?? sd.beta ?? null,
    };

    // ── Compute ─────────────────────────────────────────────────────────
    const signals = computeAllSignals(closes, fundamentals);
    const aggregate = aggregateSignals(signals);

    const result: SignalsResult = {
      ...aggregate,
      signals,
      computedAt: new Date().toISOString(),
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err) {
    console.error("[signals]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
