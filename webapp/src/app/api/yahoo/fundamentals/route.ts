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
        modules: [
          "assetProfile",
          "summaryDetail",
          "defaultKeyStatistics",
          "fundProfile",
          "financialData",
          "recommendationTrend",
          "incomeStatementHistory",
          "incomeStatementHistoryQuarterly",
        ],
      }),
    ]);

    const q = quote.status === "fulfilled" ? (quote.value as Record<string, unknown>) : {};
    const s = summary.status === "fulfilled" ? (summary.value as Record<string, unknown>) : {};

    const profile      = s.assetProfile                  as Record<string, unknown> | undefined;
    const keyStats     = s.defaultKeyStatistics           as Record<string, unknown> | undefined;
    const summDetail   = s.summaryDetail                  as Record<string, unknown> | undefined;
    const fundProf     = s.fundProfile                    as Record<string, unknown> | undefined;
    const finData      = s.financialData                  as Record<string, unknown> | undefined;
    const recTrend     = s.recommendationTrend            as { trend?: unknown[] } | undefined;
    const incomeHist   = s.incomeStatementHistory         as { incomeStatementHistory?: unknown[] } | undefined;
    const incomeQtrly  = s.incomeStatementHistoryQuarterly as { incomeStatementHistory?: unknown[] } | undefined;

    // ── Analyst recommendations ──────────────────────────────────────────────
    const latestTrend = (recTrend?.trend as Array<Record<string, unknown>> | undefined)?.[0];
    const analystRecs = latestTrend ? {
      strongBuy:  Number(latestTrend.strongBuy  ?? 0),
      buy:        Number(latestTrend.buy         ?? 0),
      hold:       Number(latestTrend.hold        ?? 0),
      sell:       Number(latestTrend.sell        ?? 0),
      strongSell: Number(latestTrend.strongSell  ?? 0),
    } : null;

    // ── Annual income statements ─────────────────────────────────────────────
    type IncomeRow = { totalRevenue?: { raw?: number }; netIncome?: { raw?: number }; endDate?: { fmt?: string } };
    const annualIncome: Array<{ year: string; revenue: number; netIncome: number }> =
      (incomeHist?.incomeStatementHistory as IncomeRow[] | undefined ?? []).map((r) => ({
        year:      r.endDate?.fmt?.slice(0, 4) ?? "—",
        revenue:   r.totalRevenue?.raw ?? 0,
        netIncome: r.netIncome?.raw    ?? 0,
      })).reverse();

    const quarterlyIncome: Array<{ quarter: string; revenue: number; netIncome: number }> =
      (incomeQtrly?.incomeStatementHistory as IncomeRow[] | undefined ?? []).map((r) => ({
        quarter:   r.endDate?.fmt?.slice(0, 7) ?? "—",
        revenue:   r.totalRevenue?.raw ?? 0,
        netIncome: r.netIncome?.raw    ?? 0,
      })).reverse();

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
      dividendYield:  q.dividendYield ?? q.trailingAnnualDividendYield ?? null,
      dividendRate:   q.trailingAnnualDividendRate ?? null,
      exDividendDate: (summDetail?.exDividendDate as string | null) ?? null,
      payoutRatio:    (summDetail?.payoutRatio as number | null) ?? null,

      // Range / technicals
      week52High: q.fiftyTwoWeekHigh ?? null,
      week52Low:  q.fiftyTwoWeekLow  ?? null,
      ma50:       q.fiftyDayAverage  ?? null,
      ma200:      q.twoHundredDayAverage ?? null,

      // Company profile
      sector:      profile?.sector   ?? null,
      industry:    profile?.industry ?? null,
      country:     profile?.country  ?? null,
      employees:   profile?.fullTimeEmployees ?? null,
      description: profile?.longBusinessSummary ?? null,
      website:     profile?.website  ?? null,

      // Financial health
      totalDebt:         (finData?.totalDebt        as Record<string,unknown>)?.raw ?? null,
      totalCash:         (finData?.totalCash        as Record<string,unknown>)?.raw ?? null,
      debtToEquity:      (finData?.debtToEquity     as Record<string,unknown>)?.raw ?? null,
      currentRatio:      (finData?.currentRatio     as Record<string,unknown>)?.raw ?? null,
      returnOnEquity:    (finData?.returnOnEquity   as Record<string,unknown>)?.raw ?? null,
      returnOnAssets:    (finData?.returnOnAssets   as Record<string,unknown>)?.raw ?? null,
      revenueGrowth:     (finData?.revenueGrowth    as Record<string,unknown>)?.raw ?? null,
      earningsGrowth:    (finData?.earningsGrowth   as Record<string,unknown>)?.raw ?? null,
      grossMargins:      (finData?.grossMargins     as Record<string,unknown>)?.raw ?? null,
      operatingMargins:  (finData?.operatingMargins as Record<string,unknown>)?.raw ?? null,
      profitMargins:     (finData?.profitMargins    as Record<string,unknown>)?.raw ?? null,
      freeCashflow:      (finData?.freeCashflow     as Record<string,unknown>)?.raw ?? null,
      operatingCashflow: (finData?.operatingCashflow as Record<string,unknown>)?.raw ?? null,

      // Analyst targets
      targetHighPrice:   (finData?.targetHighPrice  as Record<string,unknown>)?.raw ?? null,
      targetLowPrice:    (finData?.targetLowPrice   as Record<string,unknown>)?.raw ?? null,
      targetMeanPrice:   (finData?.targetMeanPrice  as Record<string,unknown>)?.raw ?? null,
      targetMedianPrice: (finData?.targetMedianPrice as Record<string,unknown>)?.raw ?? null,
      numberOfAnalysts:  (finData?.numberOfAnalystOpinions as Record<string,unknown>)?.raw ?? null,
      recommendationKey: finData?.recommendationKey ?? null,
      analystRecs,

      // Income history
      annualIncome,
      quarterlyIncome,

      // ETF
      expenseRatio:  fundProf?.annualReportExpenseRatio ?? null,
      totalAssets:   (summDetail?.totalAssets as number | null) ?? null,
      ytdReturn:     (summDetail?.ytdReturn   as number | null) ?? null,
      beta3Year:     (summDetail?.beta3Year   as number | null) ?? null,
      categoryName:  fundProf?.categoryName   ?? null,
      fundFamily:    fundProf?.legalType      ?? null,
      inceptionDate: fundProf?.startDate      ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch fundamentals" }, { status: 500 });
  }
}
