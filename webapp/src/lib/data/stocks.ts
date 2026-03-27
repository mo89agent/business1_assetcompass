// Stocks & ETF data layer
// Returns typed demo data with Yahoo Finance enrichment hooks

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  type: "ETF" | "STOCK";
  sector?: string;
  quantity: number;
  avgCostBasis: number;
  bookValue: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  ytdReturn?: number;
  currency: string;
  weight: number;
  // Dividend
  dividendYieldPct?: number;
  annualDividendPerShare?: number;
  annualDividendIncome?: number;
  lastDividendDate?: string;
  dividendFrequency?: "monthly" | "quarterly" | "semi-annual" | "annual";
  // Live data (enriched from Yahoo Finance)
  livePrice?: number;
  dayChangePct?: number;
  dayChange?: number;
}

export interface DividendEvent {
  ticker: string;
  name: string;
  exDate: string;
  payDate?: string;
  amount: number;
  currency: string;
  frequency: string;
}

export interface DividendMonthly {
  month: string; // YYYY-MM
  income: number;
  tickers: string[];
}

export interface BenchmarkSeries {
  key: string;
  label: string;
  color: string;
  data: { date: string; value: number }[];
}

export interface StocksPageData {
  holdings: StockHolding[];
  totalMarketValue: number;
  totalBookValue: number;
  totalGain: number;
  totalGainPct: number;
  annualDividendIncome: number;
  avgDividendYield: number;
  currency: string;
  dividendCalendar: DividendEvent[];
  dividendMonthly: DividendMonthly[];
}

export async function getStocksData(_workspaceId: string): Promise<StocksPageData> {
  return getDemoStocksData();
}

function getDemoStocksData(): StocksPageData {
  const currency = "EUR";

  const holdings: StockHolding[] = [
    // ── ETFs ──────────────────────────────────────────────────────────────
    {
      id: "e1", ticker: "VWRL", name: "Vanguard FTSE All-World UCITS ETF", type: "ETF",
      quantity: 420, avgCostBasis: 98.5, bookValue: 41370,
      currentPrice: 112.4, marketValue: 47208,
      unrealizedGain: 5838, unrealizedGainPct: 14.1, ytdReturn: 8.3,
      currency: "EUR", weight: 18.5,
      dividendYieldPct: 1.8, annualDividendPerShare: 2.02, annualDividendIncome: 849,
      lastDividendDate: "2026-03-15", dividendFrequency: "quarterly",
    },
    {
      id: "e2", ticker: "XDWD", name: "Xtrackers MSCI World Swap UCITS ETF", type: "ETF",
      quantity: 310, avgCostBasis: 79.2, bookValue: 24552,
      currentPrice: 95.1, marketValue: 29481,
      unrealizedGain: 4929, unrealizedGainPct: 20.1, ytdReturn: 9.1,
      currency: "EUR", weight: 11.6,
      dividendYieldPct: 0, annualDividendPerShare: 0, annualDividendIncome: 0,
      dividendFrequency: "annual",
    },
    {
      id: "e3", ticker: "EXS1", name: "iShares Core DAX UCITS ETF", type: "ETF",
      quantity: 180, avgCostBasis: 125.0, bookValue: 22500,
      currentPrice: 138.7, marketValue: 24966,
      unrealizedGain: 2466, unrealizedGainPct: 10.96, ytdReturn: 11.4,
      currency: "EUR", weight: 9.8,
      dividendYieldPct: 2.4, annualDividendPerShare: 3.33, annualDividendIncome: 599,
      lastDividendDate: "2026-01-20", dividendFrequency: "semi-annual",
    },
    {
      id: "e4", ticker: "IEMA", name: "iShares MSCI EM UCITS ETF", type: "ETF",
      quantity: 250, avgCostBasis: 32.4, bookValue: 8100,
      currentPrice: 29.8, marketValue: 7450,
      unrealizedGain: -650, unrealizedGainPct: -8.02, ytdReturn: -3.2,
      currency: "USD", weight: 2.9,
      dividendYieldPct: 2.1, annualDividendPerShare: 0.63, annualDividendIncome: 158,
      lastDividendDate: "2025-12-10", dividendFrequency: "semi-annual",
    },
    {
      id: "e5", ticker: "ZPRV", name: "SPDR MSCI USA Small Cap Value Weighted", type: "ETF",
      quantity: 120, avgCostBasis: 74.5, bookValue: 8940,
      currentPrice: 88.3, marketValue: 10596,
      unrealizedGain: 1656, unrealizedGainPct: 18.52, ytdReturn: 5.6,
      currency: "USD", weight: 4.2,
      dividendYieldPct: 1.5, annualDividendPerShare: 1.32, annualDividendIncome: 159,
      lastDividendDate: "2026-02-28", dividendFrequency: "quarterly",
    },
    // ── Einzelaktien ──────────────────────────────────────────────────────
    {
      id: "s1", ticker: "MSFT", name: "Microsoft Corporation", type: "STOCK", sector: "Technology",
      quantity: 85, avgCostBasis: 295, bookValue: 25075,
      currentPrice: 378.5, marketValue: 32172,
      unrealizedGain: 7097, unrealizedGainPct: 28.3, ytdReturn: 6.8,
      currency: "USD", weight: 12.6,
      dividendYieldPct: 0.73, annualDividendPerShare: 3.0, annualDividendIncome: 255,
      lastDividendDate: "2026-02-20", dividendFrequency: "quarterly",
    },
    {
      id: "s2", ticker: "NVDA", name: "NVIDIA Corporation", type: "STOCK", sector: "Technology",
      quantity: 50, avgCostBasis: 420, bookValue: 21000,
      currentPrice: 618, marketValue: 30900,
      unrealizedGain: 9900, unrealizedGainPct: 47.1, ytdReturn: 18.3,
      currency: "USD", weight: 12.1,
      dividendYieldPct: 0.05, annualDividendPerShare: 0.04, annualDividendIncome: 2,
      lastDividendDate: "2026-03-05", dividendFrequency: "quarterly",
    },
    {
      id: "s3", ticker: "AAPL", name: "Apple Inc.", type: "STOCK", sector: "Technology",
      quantity: 120, avgCostBasis: 155, bookValue: 18600,
      currentPrice: 189.5, marketValue: 22740,
      unrealizedGain: 4140, unrealizedGainPct: 22.3, ytdReturn: 4.1,
      currency: "USD", weight: 8.9,
      dividendYieldPct: 0.53, annualDividendPerShare: 1.0, annualDividendIncome: 120,
      lastDividendDate: "2026-02-10", dividendFrequency: "quarterly",
    },
    {
      id: "s4", ticker: "ALV", name: "Allianz SE", type: "STOCK", sector: "Financials",
      quantity: 60, avgCostBasis: 225, bookValue: 13500,
      currentPrice: 278, marketValue: 16680,
      unrealizedGain: 3180, unrealizedGainPct: 23.56, ytdReturn: 9.2,
      currency: "EUR", weight: 6.5,
      dividendYieldPct: 4.8, annualDividendPerShare: 13.3, annualDividendIncome: 798,
      lastDividendDate: "2026-05-09", dividendFrequency: "annual",
    },
    {
      id: "s5", ticker: "SAP", name: "SAP SE", type: "STOCK", sector: "Technology",
      quantity: 40, avgCostBasis: 148, bookValue: 5920,
      currentPrice: 192.5, marketValue: 7700,
      unrealizedGain: 1780, unrealizedGainPct: 30.07, ytdReturn: 14.6,
      currency: "EUR", weight: 3.0,
      dividendYieldPct: 1.1, annualDividendPerShare: 2.1, annualDividendIncome: 84,
      lastDividendDate: "2026-05-22", dividendFrequency: "annual",
    },
    {
      id: "s6", ticker: "SIE", name: "Siemens AG", type: "STOCK", sector: "Industrials",
      quantity: 35, avgCostBasis: 165, bookValue: 5775,
      currentPrice: 182, marketValue: 6370,
      unrealizedGain: 595, unrealizedGainPct: 10.3, ytdReturn: 7.1,
      currency: "EUR", weight: 2.5,
      dividendYieldPct: 2.2, annualDividendPerShare: 4.0, annualDividendIncome: 140,
      lastDividendDate: "2026-02-05", dividendFrequency: "annual",
    },
    {
      id: "s7", ticker: "NOVO-B.CO", name: "Novo Nordisk A/S", type: "STOCK", sector: "Healthcare",
      quantity: 80, avgCostBasis: 82, bookValue: 6560,
      currentPrice: 68.5, marketValue: 5480,
      unrealizedGain: -1080, unrealizedGainPct: -16.46, ytdReturn: -12.3,
      currency: "DKK", weight: 2.1,
      dividendYieldPct: 1.0, annualDividendPerShare: 0.69, annualDividendIncome: 55,
      lastDividendDate: "2026-03-26", dividendFrequency: "semi-annual",
    },
  ];

  const totalMarketValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const totalBookValue = holdings.reduce((s, h) => s + h.bookValue, 0);
  const totalGain = totalMarketValue - totalBookValue;
  const totalGainPct = (totalGain / totalBookValue) * 100;
  const annualDividendIncome = holdings.reduce((s, h) => s + (h.annualDividendIncome ?? 0), 0);
  const avgDividendYield = (annualDividendIncome / totalMarketValue) * 100;

  // Dividend calendar — upcoming 6 months
  const dividendCalendar: DividendEvent[] = [
    { ticker: "VWRL", name: "Vanguard FTSE All-World", exDate: "2026-06-12", payDate: "2026-06-25", amount: 212, currency: "EUR", frequency: "quarterly" },
    { ticker: "ALV", name: "Allianz SE", exDate: "2026-05-09", payDate: "2026-05-12", amount: 798, currency: "EUR", frequency: "annual" },
    { ticker: "SAP", name: "SAP SE", exDate: "2026-05-22", payDate: "2026-05-26", amount: 84, currency: "EUR", frequency: "annual" },
    { ticker: "MSFT", name: "Microsoft", exDate: "2026-05-15", payDate: "2026-06-12", amount: 64, currency: "USD", frequency: "quarterly" },
    { ticker: "AAPL", name: "Apple Inc.", exDate: "2026-05-09", payDate: "2026-05-15", amount: 30, currency: "USD", frequency: "quarterly" },
    { ticker: "EXS1", name: "iShares Core DAX", exDate: "2026-07-15", payDate: "2026-07-22", amount: 300, currency: "EUR", frequency: "semi-annual" },
    { ticker: "VWRL", name: "Vanguard FTSE All-World", exDate: "2026-09-11", payDate: "2026-09-24", amount: 212, currency: "EUR", frequency: "quarterly" },
    { ticker: "NVDA", name: "NVIDIA", exDate: "2026-06-04", payDate: "2026-06-26", amount: 0.5, currency: "USD", frequency: "quarterly" },
    { ticker: "SIE", name: "Siemens AG", exDate: "2026-02-05", payDate: "2026-02-10", amount: 140, currency: "EUR", frequency: "annual" },
  ].sort((a, b) => a.exDate.localeCompare(b.exDate));

  // Monthly dividend income (past 12 months)
  const dividendMonthly: DividendMonthly[] = [
    { month: "2025-04", income: 420, tickers: ["VWRL"] },
    { month: "2025-05", income: 882, tickers: ["ALV", "SAP"] },
    { month: "2025-06", income: 460, tickers: ["VWRL", "MSFT", "AAPL"] },
    { month: "2025-07", income: 310, tickers: ["EXS1"] },
    { month: "2025-08", income: 180, tickers: ["MSFT", "AAPL"] },
    { month: "2025-09", income: 430, tickers: ["VWRL", "IEMA"] },
    { month: "2025-10", income: 175, tickers: ["MSFT", "AAPL", "SIE"] },
    { month: "2025-11", income: 140, tickers: ["SIE"] },
    { month: "2025-12", income: 500, tickers: ["VWRL", "EXS1", "IEMA"] },
    { month: "2026-01", income: 175, tickers: ["MSFT", "AAPL"] },
    { month: "2026-02", income: 205, tickers: ["VWRL", "ZPRV"] },
    { month: "2026-03", income: 210, tickers: ["NOVO-B.CO", "MSFT"] },
  ];

  return {
    holdings,
    totalMarketValue,
    totalBookValue,
    totalGain,
    totalGainPct,
    annualDividendIncome,
    avgDividendYield,
    currency,
    dividendCalendar,
    dividendMonthly,
  };
}
