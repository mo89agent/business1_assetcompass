import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    const [quote, summary] = await Promise.allSettled([
      yahooFinance.quote(symbol, {
        fields: [
          "symbol", "shortName", "longName", "regularMarketPrice",
          "regularMarketChange", "regularMarketChangePercent",
          "regularMarketVolume", "regularMarketPreviousClose",
          "marketCap", "trailingPE", "forwardPE", "priceToBook",
          "trailingAnnualDividendYield", "dividendYield",
          "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
          "fiftyDayAverage", "twoHundredDayAverage",
          "currency", "exchangeName", "fullExchangeName",
        ],
      }),
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "summaryDetail", "defaultKeyStatistics"],
      }),
    ]);

    const q = quote.status === "fulfilled" ? (quote.value as Record<string, unknown>) : {};
    const s = summary.status === "fulfilled" ? summary.value : {};

    const profile = (s as Record<string, unknown>).assetProfile as Record<string, unknown> | undefined;
    const keyStats = (s as Record<string, unknown>).defaultKeyStatistics as Record<string, unknown> | undefined;

    return NextResponse.json({
      symbol,
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePct: q.regularMarketChangePercent ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
      volume: q.regularMarketVolume ?? null,
      marketCap: q.marketCap ?? null,
      currency: q.currency ?? null,
      exchange: q.fullExchangeName ?? q.exchangeName ?? null,
      shortName: q.shortName ?? q.longName ?? null,
      trailingPE: q.trailingPE ?? null,
      forwardPE: q.forwardPE ?? null,
      priceToBook: q.priceToBook ?? null,
      dividendYield: q.dividendYield ?? q.trailingAnnualDividendYield ?? null,
      week52High: q.fiftyTwoWeekHigh ?? null,
      week52Low: q.fiftyTwoWeekLow ?? null,
      ma50: q.fiftyDayAverage ?? null,
      ma200: q.twoHundredDayAverage ?? null,
      sector: profile?.sector ?? null,
      industry: profile?.industry ?? null,
      country: profile?.country ?? null,
      employees: profile?.fullTimeEmployees ?? null,
      description: profile?.longBusinessSummary ?? null,
      sharesOutstanding: keyStats?.sharesOutstanding ?? null,
      beta: keyStats?.beta ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch fundamentals" }, { status: 500 });
  }
}
