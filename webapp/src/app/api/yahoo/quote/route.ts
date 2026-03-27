import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols") ?? "";
  if (!symbols) return NextResponse.json({ quotes: [] });

  const tickers = symbols.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const results = await Promise.allSettled(
      tickers.map((symbol) =>
        yahooFinance.quote(symbol, {
          fields: ["symbol", "regularMarketPrice", "regularMarketChange", "regularMarketChangePercent", "regularMarketVolume", "regularMarketPreviousClose", "currency", "shortName", "longName", "trailingPE", "dividendYield", "trailingAnnualDividendRate", "trailingAnnualDividendYield"],
        })
      )
    );

    const quotes = results
      .map((r, i) =>
        r.status === "fulfilled"
          ? { ...(r.value as Record<string, unknown>), _symbol: tickers[i] }
          : { _symbol: tickers[i], error: true }
      )
      .filter((q) => !("error" in q));

    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
