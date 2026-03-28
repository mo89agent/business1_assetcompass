import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const result = await yahooFinance.search(q, { newsCount: 0, quotesCount: 10 });
    const raw = (result as unknown as { quotes?: unknown[] }).quotes ?? [];
    const results = raw
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null && "symbol" in r)
      .map((r) => ({
        symbol: String(r.symbol ?? ""),
        shortname: String(r.shortname ?? r.longname ?? r.symbol ?? ""),
        typeDisp: r.typeDisp ? String(r.typeDisp) : "Equity",
        exchDisp: r.exchDisp ? String(r.exchDisp) : "",
      }))
      .filter((r) => r.symbol);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
