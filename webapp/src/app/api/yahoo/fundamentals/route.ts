import { NextRequest, NextResponse } from "next/server";
import { yahooFinance } from "@/lib/yahoo";

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
          "averageVolume", "averageVolume10day",
          "epsTrailingTwelveMonths", "epsForward",
          "trailingAnnualDividendRate",
          "quoteType",
        ],
      }),
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "summaryDetail", "defaultKeyStatistics", "fundProfile"],
      }),
    ]);

    const q = quote.status === "fulfilled" ? (quote.value as Record<string, unknown>) : {};
    const s = summary.status === "fulfilled" ? (summary.value as Record<string, unknown>) : {};

    const profile    = s.assetProfile   as Record<string, unknown> | undefined;
    const keyStats   = s.defaultKeyStatistics as Record<string, unknown> | undefined;
    const summDetail = s.summaryDetail  as Record<string, unknown> | undefined;
    const fundProf   = s.fundProfile    as Record<string, unknown> | undefined;

    return NextResponse.json({
      // Identity
      symbol,
      quoteType:   q.quoteType ?? null,
      shortName:   q.shortName ?? q.longName ?? null,
      exchange:    q.fullExchangeName ?? q.exchangeName ?? null,
      currency:    q.currency ?? null,

      // Price
      price:         q.regularMarketPrice ?? null,
      change:        q.regularMarketChange ?? null,
      changePct:     q.regularMarketChangePercent ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
      volume:        q.regularMarketVolume ?? null,
      avgVolume:     q.averageVolume ?? null,
      avgVolume10d:  q.averageVolume10day ?? null,

      // Valuation
      marketCap:     q.marketCap ?? null,
      trailingPE:    q.trailingPE ?? null,
      forwardPE:     q.forwardPE ?? null,
      priceToBook:   q.priceToBook ?? null,
      priceToSales:  (summDetail?.priceToSalesTrailing12Months as number | null) ?? null,
      eps:           q.epsTrailingTwelveMonths ?? null,
      epsForward:    q.epsForward ?? null,
      beta:          keyStats?.beta ?? null,
      sharesOutstanding: keyStats?.sharesOutstanding ?? null,

      // Dividend
      dividendYield:    q.dividendYield ?? q.trailingAnnualDividendYield ?? null,
      dividendRate:     q.trailingAnnualDividendRate ?? null,
      exDividendDate:   (summDetail?.exDividendDate as string | null) ?? null,
      payoutRatio:      (summDetail?.payoutRatio as number | null) ?? null,

      // Range / technicals
      week52High: q.fiftyTwoWeekHigh ?? null,
      week52Low:  q.fiftyTwoWeekLow ?? null,
      ma50:       q.fiftyDayAverage ?? null,
      ma200:      q.twoHundredDayAverage ?? null,

      // Company profile (stocks)
      sector:      profile?.sector ?? null,
      industry:    profile?.industry ?? null,
      country:     profile?.country ?? null,
      employees:   profile?.fullTimeEmployees ?? null,
      description: profile?.longBusinessSummary ?? null,
      website:     profile?.website ?? null,

      // ETF-specific (fundProfile)
      expenseRatio:  fundProf?.annualReportExpenseRatio ?? null,
      totalAssets:   (summDetail?.totalAssets as number | null) ?? null,
      ytdReturn:     (summDetail?.ytdReturn as number | null) ?? null,
      beta3Year:     (summDetail?.beta3Year as number | null) ?? null,
      morningstarRating: fundProf?.ratingOverall ?? null,
      categoryName:  fundProf?.categoryName ?? null,
      fundFamily:    fundProf?.legalType ?? null,
      inceptionDate: fundProf?.startDate ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch fundamentals" }, { status: 500 });
  }
}
