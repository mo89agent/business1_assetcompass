// Dashboard data layer — server-side only
// Returns aggregated data for the main overview page
// Uses demo data when DB is empty (for UI development)

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
  // In a real implementation this would query the DB
  // For now, return demo data so the UI is fully renderable
  return getDemoDashboardData(workspaceId);
}

function getDemoDashboardData(_workspaceId: string): DashboardData {
  const currency = "EUR";

  const allocations: AllocationSlice[] = [
    { assetClass: "STOCK", label: ASSET_CLASS_LABELS.STOCK, value: 320000, percentage: 35.2, color: ASSET_CLASS_COLORS.STOCK },
    { assetClass: "ETF", label: ASSET_CLASS_LABELS.ETF, value: 185000, percentage: 20.4, color: ASSET_CLASS_COLORS.ETF },
    { assetClass: "REAL_ESTATE", label: ASSET_CLASS_LABELS.REAL_ESTATE, value: 210000, percentage: 23.1, color: ASSET_CLASS_COLORS.REAL_ESTATE },
    { assetClass: "CRYPTO", label: ASSET_CLASS_LABELS.CRYPTO, value: 65000, percentage: 7.2, color: ASSET_CLASS_COLORS.CRYPTO },
    { assetClass: "CASH", label: ASSET_CLASS_LABELS.CASH, value: 85000, percentage: 9.4, color: ASSET_CLASS_COLORS.CASH },
    { assetClass: "GOLD", label: ASSET_CLASS_LABELS.GOLD, value: 45000, percentage: 4.7, color: ASSET_CLASS_COLORS.GOLD },
  ];

  const totalAssets = allocations.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = 145000;
  const netWorth = totalAssets - totalLiabilities;

  // Generate 12-month performance history
  const now = new Date();
  const performanceHistory: PerformancePoint[] = Array.from({ length: 13 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (12 - i));
    const baseValue = 780000;
    const growth = (i / 12) * 0.12 * baseValue;
    const noise = (Math.sin(i * 1.5) * 15000);
    return {
      date: date.toISOString().split("T")[0],
      value: Math.round(baseValue + growth + noise),
    };
  });

  const topHoldings: PositionRow[] = [
    {
      id: "1", accountId: "a1", accountName: "Flatex Depot",
      instrumentId: "i1", ticker: "VWRL", name: "Vanguard FTSE All-World",
      assetClass: "ETF", quantity: 420, avgCostBasis: 98.5, bookValue: 41370,
      currentPrice: 112.4, marketValue: 47208, unrealizedGain: 5838, unrealizedGainPct: 14.1,
      currency: "EUR", weight: 5.2,
    },
    {
      id: "2", accountId: "a1", accountName: "Flatex Depot",
      instrumentId: "i2", ticker: "MSFT", name: "Microsoft Corp.",
      assetClass: "STOCK", quantity: 85, avgCostBasis: 295, bookValue: 25075,
      currentPrice: 378.5, marketValue: 32172, unrealizedGain: 7097, unrealizedGainPct: 28.3,
      currency: "USD", weight: 3.5,
    },
    {
      id: "3", accountId: "a2", accountName: "Trade Republic",
      instrumentId: "i3", ticker: "NVDA", name: "NVIDIA Corp.",
      assetClass: "STOCK", quantity: 50, avgCostBasis: 420, bookValue: 21000,
      currentPrice: 618, marketValue: 30900, unrealizedGain: 9900, unrealizedGainPct: 47.1,
      currency: "USD", weight: 3.4,
    },
    {
      id: "4", accountId: "a3", accountName: "Coinbase",
      instrumentId: "i4", ticker: "BTC", name: "Bitcoin",
      assetClass: "CRYPTO", quantity: 0.85, avgCostBasis: 38000, bookValue: 32300,
      currentPrice: 54200, marketValue: 46070, unrealizedGain: 13770, unrealizedGainPct: 42.6,
      currency: "USD", weight: 5.1,
    },
    {
      id: "5", accountId: "a1", accountName: "Flatex Depot",
      instrumentId: "i5", ticker: "AAPL", name: "Apple Inc.",
      assetClass: "STOCK", quantity: 120, avgCostBasis: 155, bookValue: 18600,
      currentPrice: 189.5, marketValue: 22740, unrealizedGain: 4140, unrealizedGainPct: 22.3,
      currency: "USD", weight: 2.5,
    },
  ];

  const recentIncome: IncomeEntry[] = [
    { month: "2025-10", dividends: 1240, interest: 185, rent: 1450, other: 0, total: 2875, currency },
    { month: "2025-11", dividends: 890, interest: 185, rent: 1450, other: 120, total: 2645, currency },
    { month: "2025-12", dividends: 2100, interest: 185, rent: 1450, other: 0, total: 3735, currency },
    { month: "2026-01", dividends: 780, interest: 190, rent: 1450, other: 0, total: 2420, currency },
    { month: "2026-02", dividends: 1050, interest: 190, rent: 1450, other: 0, total: 2690, currency },
    { month: "2026-03", dividends: 650, interest: 190, rent: 1450, other: 340, total: 2630, currency },
  ];

  const alerts: AlertItem[] = [
    {
      id: "1", type: "MISSING_COST_BASIS", severity: "WARNING",
      title: "Missing cost basis", message: "3 positions are missing acquisition cost data.",
      createdAt: new Date().toISOString(), isRead: false,
    },
    {
      id: "2", type: "EXPIRING_FIXED_RATE", severity: "CRITICAL",
      title: "Fixed rate expiring soon", message: "Mortgage on Berliner Str. 12 resets in 47 days.",
      createdAt: new Date().toISOString(), isRead: false,
    },
    {
      id: "3", type: "CONCENTRATION_RISK", severity: "INFO",
      title: "Concentration risk", message: "Tech sector exceeds 35% of equity portfolio.",
      createdAt: new Date().toISOString(), isRead: true,
    },
  ];

  return {
    currency,
    netWorth,
    totalAssets,
    totalLiabilities,
    liquidCash: 85000,
    netWorthChange: 32400,
    netWorthChangePct: 4.1,
    allocations,
    performanceHistory,
    topHoldings,
    recentIncome,
    alerts,
  };
}
