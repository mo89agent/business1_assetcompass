import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

const PERIOD_MAP: Record<string, { period1: Date }> = {
  "1W": { period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  "1M": { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  "3M": { period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  "6M": { period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
  "1Y": { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
  "3Y": { period1: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000) },
  "All": { period1: new Date("2010-01-01") },
};

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const period = request.nextUrl.searchParams.get("period") ?? "1Y";

  if (!symbol) return NextResponse.json({ history: [] });

  const { period1 } = PERIOD_MAP[period] ?? PERIOD_MAP["1Y"];

  try {
    const result = await yahooFinance.chart(symbol, {
      period1,
      interval: period === "1W" ? "1d" : period === "1M" ? "1d" : "1wk",
    });

    const history = (result.quotes ?? [])
      .filter((q) => q.close != null)
      .map((q) => ({
        date: new Date(q.date).toISOString().split("T")[0],
        close: q.close,
      }));

    return NextResponse.json({ symbol, period, history });
  } catch {
    return NextResponse.json({ error: "Failed to fetch history", symbol }, { status: 500 });
  }
}
