import { NextRequest, NextResponse } from "next/server";
import { yahooFinance } from "@/lib/yahoo";

const SECTOR_LABELS: Record<string, string> = {
  realestate: "Immobilien",
  consumer_cyclical: "Zyklischer Konsum",
  basic_materials: "Grundstoffe",
  consumer_defensive: "Nicht-zykl. Konsum",
  technology: "Technologie",
  communication_services: "Kommunikation",
  financial_services: "Finanzen",
  utilities: "Versorger",
  industrials: "Industrie",
  energy: "Energie",
  healthcare: "Gesundheit",
};

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = await (yahooFinance as any).quoteSummary(symbol.toUpperCase(), {
      modules: ["topHoldings", "fundProfile", "summaryDetail", "price"],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const top: Record<string, any> = summary?.topHoldings ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fundProfile: Record<string, any> = summary?.fundProfile ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summDetail: Record<string, any> = summary?.summaryDetail ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const price: Record<string, any> = summary?.price ?? {};

    // Parse sector weightings from array of single-key objects like [{technology: 0.32}, ...]
    const sectorWeights: { sector: string; key: string; weight: number }[] = [];
    for (const entry of (top.sectorWeightings ?? []) as Record<string, unknown>[]) {
      for (const [k, v] of Object.entries(entry)) {
        if (typeof v === "number" && v > 0) {
          sectorWeights.push({
            key: k,
            sector: SECTOR_LABELS[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            weight: Math.round(v * 1000) / 10,
          });
        }
      }
    }
    sectorWeights.sort((a, b) => b.weight - a.weight);

    // Parse top holdings
    const holdings = ((top.holdings ?? []) as Record<string, unknown>[])
      .slice(0, 15)
      .map((h, i) => ({
        rank: i + 1,
        name: String(h.holdingName ?? ""),
        symbol: String(h.symbol ?? ""),
        weight: typeof h.holdingPercent === "number" ? Math.round(h.holdingPercent * 1000) / 10 : 0,
      }));

    return NextResponse.json(
      {
        symbol: symbol.toUpperCase(),
        name: String(price.longName ?? price.shortName ?? symbol),
        sectorWeights,
        holdings,
        // Fund metadata
        expenseRatio: fundProfile.annualReportExpenseRatio ?? null,
        totalAssets: typeof summDetail.totalAssets === "number" ? summDetail.totalAssets : null,
        ytdReturn: typeof summDetail.ytdReturn === "number" ? summDetail.ytdReturn : null,
        threeYearReturn: typeof summDetail.threeYearAverageReturn === "number" ? summDetail.threeYearAverageReturn : null,
        fiveYearReturn: typeof summDetail.fiveYearAverageReturn === "number" ? summDetail.fiveYearAverageReturn : null,
        fundFamily: fundProfile.family ?? null,
        categoryName: fundProfile.categoryName ?? null,
        legalType: fundProfile.legalType ?? null,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (e) {
    console.error("[etf]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
