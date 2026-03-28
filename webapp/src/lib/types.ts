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

export type ImportJobStatus = "pending" | "mapped" | "reviewing" | "complete" | "failed";

export type ImportRowStatus =
  | "imported"
  | "unverified"
  | "duplicate"
  | "missing_data"
  | "parse_error"
  | "skipped";

export type ImportIssueType =
  | "duplicate"
  | "missing_cost_basis"
  | "missing_ticker"
  | "ambiguous_type"
  | "invalid_date"
  | "parse_error"
  | "negative_amount";

export interface ImportRowIssue {
  type: ImportIssueType;
  message: string;
  suggestion?: string;
  relatedTransactionId?: string; // for duplicate: ID of the existing tx
}

export interface ImportRow {
  id: string;
  jobId: string;
  rowNumber: number;
  status: ImportRowStatus;
  // Parsed and normalised fields
  parsedDate: string | null;
  parsedType: TransactionType | null;
  parsedAmount: number | null;
  parsedCurrency: string | null;
  parsedInstrument: string | null;
  parsedTicker: string | null;
  parsedQuantity: number | null;
  parsedPrice: number | null;
  parsedFee: number | null;
  parsedDescription: string | null;
  parserConfidence: number; // 0–100
  issues: ImportRowIssue[];
  linkedTransactionId?: string; // set once imported
}

export interface ImportJob {
  id: string;
  filename: string;
  institution: string;
  uploadedAt: string; // ISO datetime
  status: ImportJobStatus;
  rowsTotal: number;
  rowsImported: number;
  rowsWithIssues: number;
  rowsFailed: number;
  rows: ImportRow[];
}

export type ReviewSeverity = "error" | "warning" | "info";

export interface ReviewItem {
  id: string;
  severity: ReviewSeverity;
  issueType: ImportIssueType | "unverified";
  title: string;
  description: string;
  importJobId?: string;
  importJobFilename?: string;
  importRowId?: string;
  transactionId?: string;
  relatedTransactionId?: string; // duplicate: the existing tx
  isResolved: boolean;
  createdAt: string;
}

export interface ImportJobSummary {
  id: string;
  filename: string;
  status: string;
  rowsTotal: number | null;
  rowsImported: number | null;
  rowsFailed: number | null;
  createdAt: string;
}

// ─── Tax Lots ─────────────────────────────────────────────────
export interface TaxLot {
  id: string;
  positionId: string;
  acquiredAt: string; // ISO date
  quantity: number;
  costBasisPerShare: number;
  costBasisTotal: number;
  currentPrice: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
  holdingDays: number;
  isLongTerm: boolean; // >= 365 days
  isTaxFreeGermany: boolean; // crypto >365d = §23 EStG tax-free
  currency: string;
  source: SourceRef;
}

// ─── ETF / Fund Look-through ──────────────────────────────────
export interface EtfTopHolding {
  rank: number;
  name: string;
  ticker?: string;
  weightPct: number;
  country?: string;
  sector?: string;
}

export interface EtfExposure {
  positionId: string;
  asOf: string; // ISO date — data freshness indicator
  totalHoldings: number;
  topHoldings: EtfTopHolding[];
  geographyBreakdown: Array<{ label: string; pct: number }>;
  sectorBreakdown: Array<{ label: string; pct: number }>;
  source: SourceRef;
}

// ─── Per-position Dividends ───────────────────────────────────
export interface PositionDividend {
  id: string;
  positionId: string;
  ticker: string;
  exDate: string; // ISO date
  payDate: string; // ISO date
  amountPerShare: number;
  sharesHeld: number;
  totalAmount: number;
  currency: string;
  isProjected: boolean;
}

// ─── Real estate ─────────────────────────────────────────────

export type ValuationMethod =
  | "purchase_price"
  | "broker_appraisal"
  | "bank_valuation"
  | "online_tool"
  | "self_estimated";

export type ValuationConfidence = "high" | "medium" | "low";

export interface PropertyValuation {
  estimatedValue: number;
  valueLow: number;     // conservative estimate
  valueHigh: number;    // optimistic estimate
  confidence: ValuationConfidence;
  method: ValuationMethod;
  asOf: string;         // ISO date — explicitly shown to user
  notes?: string;
  source: SourceRef;
}

export interface PropertyLoan {
  id: string;
  propertyId: string;
  lender: string;
  originalAmount: number;
  remainingBalance: number;
  interestRatePct: number;
  isFixedRate: boolean;
  fixedRateUntil: string | null; // ISO date
  monthlyPayment: number;        // total annuity payment
  termYears: number;             // original loan term
  startDate: string;             // ISO date
  currency: string;
}

export interface CostLine {
  label: string;
  monthlyAmount: number;
  isEstimated: boolean;          // drives "Schätzung" badge in UI
  category: "management" | "tax" | "insurance" | "maintenance" | "other";
  notes?: string;
}

export type PropertyType = "residential" | "commercial" | "mixed" | "land";

export interface PropertyRecord {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  type: PropertyType;
  subtype?: string;
  sqm: number | null;
  yearBuilt: number | null;
  energyClass: string | null;

  // Purchase
  acquisitionDate: string;   // ISO date
  acquisitionPrice: number;
  acquisitionCosts: number;  // Grunderwerbsteuer + Notar + Makler

  // Valuation — always a range, never a single fake-precise number
  valuation: PropertyValuation;

  // Financing
  loans: PropertyLoan[];

  // Rental model
  targetRentMonthly: number;
  actualRentMonthly: number;
  vacancyAllowancePct: number;   // e.g. 2 = 2% annual vacancy buffer
  costLines: CostLine[];

  currency: string;
}

// Derived metrics (computed from PropertyRecord, not stored)
export interface PropertyMetrics {
  totalAcquisitionCost: number;
  totalLoanBalance: number;
  equity: number;
  ltv: number;
  effectiveMonthlyRent: number;
  totalMonthlyCosts: number;
  totalMonthlyDebtService: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  netOperatingIncome: number;
  netCashflow: number;
  grossYield: number;   // based on current estimated value
  netYield: number;     // NOI / total acquisition cost
  unrealizedGain: number;
  unrealizedGainPct: number;
}

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
