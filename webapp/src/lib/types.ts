// ============================================================
// Core Domain Types — AssetCompass
// These mirror the Prisma models but are serialization-safe
// (Decimal → number, Date → string for client components)
// ============================================================

// ─── Data provenance ─────────────────────────────────────────
export type SourceType =
  | "manual"        // user entered directly in UI
  | "import"        // parsed from an uploaded file
  | "yahoo"         // fetched from Yahoo Finance API
  | "ecb"           // European Central Bank FX rates
  | "estimated";    // computed from other data with assumptions

export interface SourceRef {
  type: SourceType;
  label: string;             // human-readable: "Flatex CSV · Zeile 47"
  importFile?: string;       // filename if source = import
  importRow?: number;        // row number if source = import
  fetchedAt?: string;        // ISO datetime if source = API
  effectiveAt?: string;      // the date the value is valid as-of
}

export type AssetClass =
  | "STOCK"
  | "ETF"
  | "FUND"
  | "BOND"
  | "CASH"
  | "CRYPTO"
  | "REAL_ESTATE"
  | "PRIVATE_EQUITY"
  | "GOLD"
  | "COLLECTIBLE"
  | "LOAN_RECEIVABLE"
  | "LIABILITY"
  | "OTHER";

export type AccountType =
  | "BROKERAGE"
  | "BANK_ACCOUNT"
  | "SAVINGS_ACCOUNT"
  | "FIXED_DEPOSIT"
  | "CRYPTO_EXCHANGE"
  | "CRYPTO_WALLET"
  | "PROPERTY"
  | "LOAN_ACCOUNT"
  | "PENSION"
  | "OTHER";

export type TransactionType =
  | "BUY"
  | "SELL"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "DIVIDEND"
  | "INTEREST_INCOME"
  | "INTEREST_EXPENSE"
  | "RENT_INCOME"
  | "FEE"
  | "TAX"
  | "STOCK_SPLIT"
  | "STOCK_MERGER"
  | "SPIN_OFF"
  | "MANUAL_ADJUSTMENT"
  | "LOAN_PAYMENT"
  | "PRINCIPAL_PAYMENT"
  | "INTEREST_PAYMENT"
  | "STAKING_REWARD"
  | "MINING_REWARD"
  | "TOKEN_SWAP"
  | "BRIDGE_IN"
  | "BRIDGE_OUT"
  | "RETURN_OF_CAPITAL"
  | "CAPITAL_CALL"
  | "DISTRIBUTION";

export type AlertType =
  | "MISSING_COST_BASIS"
  | "BROKEN_IMPORT"
  | "DUPLICATE_TRANSACTION"
  | "LOAN_RESET_UPCOMING"
  | "CONCENTRATION_RISK"
  | "NEGATIVE_CASHFLOW"
  | "TAX_READINESS_GAP"
  | "MISSING_VALUATION"
  | "EXPIRING_FIXED_RATE"
  | "UNUSUAL_TRANSACTION";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

// ─── Workspace / Session ─────────────────────────────────────
export interface WorkspaceContext {
  id: string;
  name: string;
  slug: string;
  currency: string;
  country: string;
}

// ─── Net Worth / Summary ─────────────────────────────────────
export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
  asOf: string;
}

export interface AllocationSlice {
  assetClass: AssetClass;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// ─── Account view ────────────────────────────────────────────
export interface AccountSummary {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  currentValue: number;
  entityName: string | null;
  assetClass: AssetClass | null;
}

// ─── Position view ───────────────────────────────────────────
export interface PositionRow {
  id: string;
  accountId: string;
  accountName: string;
  instrumentId: string;
  ticker: string | null;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCostBasis: number;
  bookValue: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  currency: string;
  weight: number;
}

// ─── Transaction view ────────────────────────────────────────
export interface TransactionRow {
  id: string;
  type: TransactionType;
  executedAt: string;
  settledAt?: string | null;
  accountName: string;
  accountId?: string;
  instrumentName: string | null;
  instrumentId?: string | null;
  ticker: string | null;
  quantity: number | null;
  price: number | null;
  amount: number;
  currency: string;
  fees: number;
  taxes: number;
  description: string | null;
  // Provenance (replaces the raw string `provenance` field)
  source: SourceRef;
  // Review state
  isVerified: boolean;
  verifiedAt?: string | null;
  isDuplicate: boolean;
  duplicateOfId?: string | null;
  reviewNote?: string | null;
}

// ─── Income / cashflow ───────────────────────────────────────
export interface IncomeEntry {
  month: string; // YYYY-MM
  dividends: number;
  interest: number;
  rent: number;
  other: number;
  total: number;
  currency: string;
}

// ─── Performance ─────────────────────────────────────────────
export interface PerformancePoint {
  date: string;
  value: number;
  benchmark?: number;
}

// ─── Forecast ────────────────────────────────────────────────
export interface ForecastPoint {
  year: number;
  base: number;
  bull: number;
  bear: number;
}

// ─── Alert ───────────────────────────────────────────────────
export interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

// ─── Import ──────────────────────────────────────────────────
export interface ImportJobSummary {
  id: string;
  filename: string;
  status: string;
  rowsTotal: number | null;
  rowsImported: number | null;
  rowsFailed: number | null;
  createdAt: string;
}

// ─── Real estate ─────────────────────────────────────────────
export interface PropertySummary {
  id: string;
  accountId: string;
  name: string;
  address: string;
  city: string;
  currentValue: number;
  acquisitionPrice: number | null;
  targetRentMonthly: number | null;
  actualRentMonthly: number | null;
  loanRemaining: number | null;
  equity: number | null;
  grossYield: number | null;
  netYield: number | null;
  currency: string;
}
