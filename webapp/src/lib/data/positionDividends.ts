import { yahooFinance } from "@/lib/yahoo";
import { db } from "@/lib/db";
import type { PositionDividend } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Fetch real dividends from Yahoo Finance for a DB position.
// Falls back to empty array if ticker unavailable or no dividend
// history found.
// ──────────────────────────────────────────────────────────────

async function fetchYahooDividends(
  positionId: string,
  ticker: string,
  quantity: number,
  currency: string,
): Promise<PositionDividend[]> {
  const period1 = new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hist: any = await yahooFinance.chart(ticker, {
    period1,
    interval: "1mo" as const,
    events: "dividends",
  });

  // Yahoo returns dividends as an object keyed by timestamp
  const rawEvents: Array<{ date: Date | number; amount: number }> =
    hist?.events?.dividends
      ? Object.values(hist.events.dividends)
      : [];

  if (rawEvents.length === 0) return [];

  const historical: PositionDividend[] = rawEvents
    .map((e, i) => {
      const dateStr = new Date(e.date).toISOString().split("T")[0];
      const aps = Math.abs(Number(e.amount));
      return {
        id: `${positionId}-yh-${i}`,
        positionId,
        ticker,
        exDate: dateStr,
        payDate: dateStr, // Yahoo chart events only provide one date
        amountPerShare: aps,
        sharesHeld: quantity,
        totalAmount: parseFloat((aps * quantity).toFixed(2)),
        currency,
        isProjected: false,
      } satisfies PositionDividend;
    })
    .filter((d) => d.amountPerShare > 0)
    .sort((a, b) => a.exDate.localeCompare(b.exDate));

  const forecast = generateForecast(historical, positionId, ticker, quantity, currency);

  // Return newest-first
  return [...historical, ...forecast].sort((a, b) => b.exDate.localeCompare(a.exDate));
}

/** Project the next ~4 dividend payments from historical pattern. */
function generateForecast(
  historical: PositionDividend[],
  positionId: string,
  ticker: string,
  quantity: number,
  currency: string,
): PositionDividend[] {
  if (historical.length < 2) return [];

  // Average interval between payments in days
  const dates = historical.map((d) => new Date(d.exDate).getTime());
  let totalInterval = 0;
  for (let i = 1; i < dates.length; i++) totalInterval += dates[i] - dates[i - 1];
  const avgIntervalMs = totalInterval / (dates.length - 1);

  // Average growth rate per payment
  const amounts = historical.map((d) => d.amountPerShare);
  let totalGrowth = 0;
  for (let i = 1; i < amounts.length; i++) totalGrowth += amounts[i] / amounts[i - 1];
  const avgGrowth = amounts.length > 1 ? totalGrowth / (amounts.length - 1) : 1;

  const last = historical[historical.length - 1];
  const projected: PositionDividend[] = [];
  let lastDate = new Date(last.exDate).getTime();
  let lastAmount = last.amountPerShare;

  for (let i = 0; i < 4; i++) {
    lastDate += avgIntervalMs;
    lastAmount = parseFloat((lastAmount * avgGrowth).toFixed(4));
    const dateStr = new Date(lastDate).toISOString().split("T")[0];
    projected.push({
      id: `${positionId}-proj-${i}`,
      positionId,
      ticker,
      exDate: dateStr,
      payDate: dateStr,
      amountPerShare: lastAmount,
      sharesHeld: quantity,
      totalAmount: parseFloat((lastAmount * quantity).toFixed(2)),
      currency,
      isProjected: true,
    });
  }

  return projected;
}

export async function getDividendsForPosition(positionId: string): Promise<PositionDividend[]> {
  try {
    const position = await db.position.findUnique({
      where: { id: positionId },
      include: { instrument: true },
    });

    if (position?.instrument?.ticker) {
      const ticker = position.instrument.ticker;
      const quantity = Number(position.quantity);
      const currency = position.instrument.currency ?? "USD";
      return await fetchYahooDividends(positionId, ticker, quantity, currency);
    }
  } catch {
    // fall through to empty
  }
  return [];
}

export async function getAllPositionDividends(): Promise<PositionDividend[]> {
  try {
    const positions = await db.position.findMany({
      include: { instrument: true },
    });
    const results = await Promise.all(
      positions.map((p) => getDividendsForPosition(p.id)),
    );
    return results.flat();
  } catch {
    return [];
  }
}
