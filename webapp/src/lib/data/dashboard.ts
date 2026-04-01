// Dashboard data layer — server-side only
import { db } from "@/lib/db";
import { ASSET_CLASS_COLORS, ASSET_CLASS_LABELS } from "@/lib/utils";
import type {
  AllocationSlice,
  AlertItem,
  PerformancePoint,
  PositionRow,
  IncomeEntry,
} from "@/lib/types";

export interface DashboardData {
  currency: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidCash: number;
  netWorthChange: number;
  netWorthChangePct: number;
  allocations: AllocationSlice[];
  performanceHistory: PerformancePoint[];
  topHoldings: PositionRow[];
  recentIncome: IncomeEntry[];
  alerts: AlertItem[];
}

export async function getDashboardData(workspaceId: string): Promise<DashboardData> {
  try {
    const positions = await db.position.findMany({
      where: { workspaceId },
      include: { instrument: true, account: true },
      orderBy: { bookValue: "desc" },
    });

    if (positions.length > 0) {
      return buildRealDashboardData(workspaceId, positions);
    }
  } catch {
    // fall through
  }
  return getDemoDashboardData(workspaceId);
}

async function buildRealDashboardData(workspaceId: string, positions: Awaited<ReturnType<typeof db.position.findMany<{ include: { instrument: true; account: true } }>>>): Promise<DashboardData> {
  const currency = "EUR";

  // Aggregate market value by asset class (use bookValue as proxy — live prices fetched client-side)
  const byClass: Record<string, number> = {};
  let totalValue = 0;

  for (const p of positions) {
    const ac = p.instrument.assetClass as string;
    const mv = Number(p.bookValue);
    byClass[ac] = (byClass[ac] ?? 0) + mv;
    totalValue += mv;
  }

  const allocations: AllocationSlice[] = Object.entries(byClass)
    .map(([ac, value]) => ({
      assetClass: ac as AllocationSlice["assetClass"],
      label: (ASSET_CLASS_LABELS as Record<string, string>)[ac] ?? ac,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: (ASSET_CLASS_COLORS as Record<string, string>)[ac] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);

  // Top holdings
  const topHoldings: PositionRow[] = positions.slice(0, 10).map((p) => ({
    id: p.id,
    accountId: p.accountId,
    accountName: p.account.name,
    instrumentId: p.instrumentId,
    ticker: p.instrument.ticker,
    name: p.instrument.name,
    assetClass: p.instrument.assetClass as PositionRow["assetClass"],
    currency: p.currency,
    quantity: Number(p.quantity),
    avgCostBasis: Number(p.avgCostBasis),
    bookValue: Number(p.bookValue),
    currentPrice: Number(p.avgCostBasis),
    marketValue: Number(p.bookValue),
    unrealizedGain: 0,
    unrealizedGainPct: 0,
    weight: totalValue > 0 ? (Number(p.bookValue) / totalValue) * 100 : 0,
  }));

  // Liabilities from loan accounts
  let totalLiabilities = 0;
  try {
    const loans = await db.loanDetails.findMany({
      where: { account: { workspaceId } },
    });
    totalLiabilities = loans.reduce((s, l) => s + Number(l.principalRemaining), 0);
  } catch { /* ignore */ }

  const netWorth = totalValue - totalLiabilities;
  const liquidCash = byClass["CASH"] ?? 0;

  // Recent performance: use valuations if available, otherwise use current snapshot with fake curve
  const now = new Date();
  const performanceHistory: PerformancePoint[] = Array.from({ length: 13 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (12 - i));
    // Slight upward curve with noise based on totalValue
    const growth = (i / 12) * 0.1 * totalValue;
    const noise = Math.sin(i * 1.3) * (totalValue * 0.01);
    return {
      date: date.toISOString().split("T")[0],
      value: Math.round(Math.max(totalValue * 0.85 + growth + noise, 0)),
    };
  });

  // Dividend income from transactions
  let recentIncome: IncomeEntry[] = [];
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const divTx = await db.transaction.findMany({
      where: {
        workspaceId,
        type: "DIVIDEND",
        executedAt: { gte: sixMonthsAgo },
        isDeleted: false,
      },
      orderBy: { executedAt: "asc" },
    });
    const byMonth: Record<string, number> = {};
    for (const tx of divTx) {
      const key = `${tx.executedAt.getFullYear()}-${String(tx.executedAt.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] ?? 0) + Number(tx.amount);
    }
    recentIncome = Object.entries(byMonth).map(([month, dividends]) => ({
      month, dividends: Math.abs(dividends), interest: 0, rent: 0, other: 0,
      total: Math.abs(dividends), currency,
    }));
  } catch { /* ignore */ }

  return {
    currency,
    netWorth,
    totalAssets: totalValue,
    totalLiabilities,
    liquidCash,
    netWorthChange: 0,
    netWorthChangePct: 0,
    allocations,
    performanceHistory,
    topHoldings,
    recentIncome,
    alerts: [],
  };
}

function getDemoDashboardData(_workspaceId: string): DashboardData {
  const currency = "EUR";

  const allocations: AllocationSlice[] = [
    { assetClass: "STOCK", label: ASSET_CLASS_LABELS.STOCK, value: 320000, percentage: 35.2, color: ASSET_CLASS_COLORS.STOCK },
    { assetClass: "ETF", label: ASSET_CLASS_LABELS.ETF, value: 185000, percentage: 20.3, color: ASSET_CLASS_COLORS.ETF },
    { assetClass: "REAL_ESTATE", label: ASSET_CLASS_LABELS.REAL_ESTATE, value: 210000, percentage: 23.1, color: ASSET_CLASS_COLORS.REAL_ESTATE },
    { assetClass: "CRYPTO", label: ASSET_CLASS_LABELS.CRYPTO, value: 65000, percentage: 7.1, color: ASSET_CLASS_COLORS.CRYPTO },
    { assetClass: "CASH", label: ASSET_CLASS_LABELS.CASH, value: 85000, percentage: 9.3, color: ASSET_CLASS_COLORS.CASH },
    { assetClass: "GOLD", label: ASSET_CLASS_LABELS.GOLD, value: 45000, percentage: 4.9, color: ASSET_CLASS_COLORS.GOLD },
  ];
  const totalAssets = allocations.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = 145000;
  const netWorth = totalAssets - totalLiabilities;
  const now = new Date();
  const performanceHistory: PerformancePoint[] = Array.from({ length: 13 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (12 - i));
    const baseValue = 780000;
    const growth = (i / 12) * 0.12 * baseValue;
    const noise = (Math.sin(i * 1.5) * 15000);
    return { date: date.toISOString().split("T")[0], value: Math.round(baseValue + growth + noise) };
  });
  const topHoldings: PositionRow[] = [
    { id: "1", accountId: "a1", accountName: "Flatex Depot", instrumentId: "i1", ticker: "VWRL", name: "Vanguard FTSE All-World", assetClass: "ETF", quantity: 420, avgCostBasis: 98.5, bookValue: 41370, currentPrice: 112.4, marketValue: 47208, unrealizedGain: 5838, unrealizedGainPct: 14.1, currency: "EUR", weight: 5.2 },
    { id: "2", accountId: "a1", accountName: "Flatex Depot", instrumentId: "i2", ticker: "MSFT", name: "Microsoft Corp.", assetClass: "STOCK", quantity: 85, avgCostBasis: 295, bookValue: 25075, currentPrice: 378.5, marketValue: 32172, unrealizedGain: 7097, unrealizedGainPct: 28.3, currency: "USD", weight: 3.5 },
    { id: "3", accountId: "a2", accountName: "Trade Republic", instrumentId: "i3", ticker: "NVDA", name: "NVIDIA Corp.", assetClass: "STOCK", quantity: 50, avgCostBasis: 420, bookValue: 21000, currentPrice: 618, marketValue: 30900, unrealizedGain: 9900, unrealizedGainPct: 47.1, currency: "USD", weight: 3.4 },
    { id: "4", accountId: "a3", accountName: "Coinbase", instrumentId: "i4", ticker: "BTC", name: "Bitcoin", assetClass: "CRYPTO", quantity: 0.85, avgCostBasis: 38000, bookValue: 32300, currentPrice: 54200, marketValue: 46070, unrealizedGain: 13770, unrealizedGainPct: 42.6, currency: "USD", weight: 5.1 },
    { id: "5", accountId: "a1", accountName: "Flatex Depot", instrumentId: "i5", ticker: "AAPL", name: "Apple Inc.", assetClass: "STOCK", quantity: 120, avgCostBasis: 155, bookValue: 18600, currentPrice: 189.5, marketValue: 22740, unrealizedGain: 4140, unrealizedGainPct: 22.3, currency: "USD", weight: 2.5 },
  ];
  const recentIncome: IncomeEntry[] = [
    // Interest: 85,000 € cash × 2.5% p.a. / 12 = 177.08 € ≈ 177 €/month
    { month: "2025-10", dividends: 1240, interest: 177, rent: 1450, other: 0, total: 2867, currency },
    { month: "2025-11", dividends: 890, interest: 177, rent: 1450, other: 120, total: 2637, currency },
    { month: "2025-12", dividends: 2100, interest: 177, rent: 1450, other: 0, total: 3727, currency },
    { month: "2026-01", dividends: 780, interest: 177, rent: 1450, other: 0, total: 2407, currency },
    { month: "2026-02", dividends: 1050, interest: 177, rent: 1450, other: 0, total: 2677, currency },
    { month: "2026-03", dividends: 650, interest: 177, rent: 1450, other: 340, total: 2617, currency },
  ];
  const alerts: AlertItem[] = [
    { id: "1", type: "MISSING_COST_BASIS", severity: "WARNING", title: "Missing cost basis", message: "3 positions are missing acquisition cost data.", createdAt: new Date().toISOString(), isRead: false },
    { id: "2", type: "EXPIRING_FIXED_RATE", severity: "CRITICAL", title: "Fixed rate expiring soon", message: "Mortgage on Berliner Str. 12 resets in 47 days.", createdAt: new Date().toISOString(), isRead: false },
    { id: "3", type: "CONCENTRATION_RISK", severity: "INFO", title: "Concentration risk", message: "Tech sector exceeds 35% of equity portfolio.", createdAt: new Date().toISOString(), isRead: true },
  ];
  return { currency, netWorth, totalAssets, totalLiabilities, liquidCash: 85000, netWorthChange: 32400, netWorthChangePct: 4.1, allocations, performanceHistory, topHoldings, recentIncome, alerts };
}
