import { NextRequest, NextResponse } from "next/server";
import { yahooFinance } from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    const [quoteRes, historyRes] = await Promise.allSettled([
      // Live dividend quote data
      yahooFinance.quote(symbol, {
        fields: [
          "symbol", "shortName", "trailingAnnualDividendRate", "trailingAnnualDividendYield",
          "dividendDate", "exDividendDate", "payoutRatio", "currency",
          "regularMarketPrice", "forwardPE",
        ],
      }),
      // Historical dividends (events=dividends via chart module)
      yahooFinance.chart(symbol, {
        period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
        interval: "1mo",
        events: "dividends",
      }),
    ]);

    const q = quoteRes.status === "fulfilled" ? (quoteRes.value as Record<string, unknown>) : {};
    const hist = historyRes.status === "fulfilled" ? historyRes.value : null;

    // Extract dividend events from chart history
    type DivEvent = { date: Date | string; amount: number };
    const rawEvents: DivEvent[] =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (hist as any)?.events?.dividends ?? [];
    const dividendHistory = rawEvents.map((e: DivEvent) => ({
      date: new Date(e.date).toISOString().split("T")[0],
      amount: typeof e.amount === "number" ? e.amount : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      symbol,
      shortName: q.shortName ?? null,
      currency: q.currency ?? "USD",
      price: q.regularMarketPrice ?? null,
      // Annual dividend stats
      annualDividendRate: q.trailingAnnualDividendRate ?? null,
      annualDividendYield: q.trailingAnnualDividendYield ?? null,
      payoutRatio: q.payoutRatio ?? null,
      // Next dates
      exDividendDate: q.exDividendDate
        ? new Date(q.exDividendDate as string).toISOString().split("T")[0]
        : null,
      dividendPayDate: q.dividendDate
        ? new Date(q.dividendDate as string).toISOString().split("T")[0]
        : null,
      // Historical payments
      dividendHistory,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dividend data" }, { status: 500 });
  }
}
