import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatting ─────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency = "EUR",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function formatCurrencyPrecise(
  amount: number,
  currency = "EUR"
): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Percentage formatting ───────────────────────────────────
export function formatPercent(
  value: number,
  decimals = 1,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  }).format(value / 100);
}

// ─── Number formatting ───────────────────────────────────────
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompact(value: number, currency = "EUR"): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, 1)}M ${currency}`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${formatNumber(value / 1_000, 1)}K ${currency}`;
  }
  return formatCurrency(value, currency);
}

// ─── Date formatting ─────────────────────────────────────────
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Gain/loss color ─────────────────────────────────────────
export function gainColor(value: number): string {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
}

export function gainBg(value: number): string {
  if (value > 0) return "bg-emerald-50 text-emerald-700";
  if (value < 0) return "bg-red-50 text-red-700";
  return "bg-muted text-muted-foreground";
}

// ─── Asset class label ───────────────────────────────────────
export const ASSET_CLASS_LABELS: Record<string, string> = {
  STOCK: "Equities",
  ETF: "ETFs",
  FUND: "Funds",
  BOND: "Bonds",
  CASH: "Cash",
  CRYPTO: "Crypto",
  REAL_ESTATE: "Real Estate",
  PRIVATE_EQUITY: "Private Equity",
  GOLD: "Gold",
  COLLECTIBLE: "Collectibles",
  LOAN_RECEIVABLE: "Loans Receivable",
  LIABILITY: "Liabilities",
  OTHER: "Other",
};

export const ASSET_CLASS_COLORS: Record<string, string> = {
  STOCK: "#3b82f6",
  ETF: "#6366f1",
  FUND: "#8b5cf6",
  BOND: "#06b6d4",
  CASH: "#10b981",
  CRYPTO: "#f59e0b",
  REAL_ESTATE: "#f97316",
  PRIVATE_EQUITY: "#ec4899",
  GOLD: "#eab308",
  COLLECTIBLE: "#84cc16",
  LOAN_RECEIVABLE: "#14b8a6",
  LIABILITY: "#ef4444",
  OTHER: "#6b7280",
};

// ─── Transaction type labels ─────────────────────────────────
export const TX_TYPE_LABELS: Record<string, string> = {
  BUY: "Buy",
  SELL: "Sell",
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
  DIVIDEND: "Dividend",
  INTEREST_INCOME: "Interest Income",
  INTEREST_EXPENSE: "Interest Expense",
  RENT_INCOME: "Rent Income",
  FEE: "Fee",
  TAX: "Tax",
  STOCK_SPLIT: "Stock Split",
  MANUAL_ADJUSTMENT: "Adjustment",
  LOAN_PAYMENT: "Loan Payment",
  STAKING_REWARD: "Staking Reward",
  TOKEN_SWAP: "Token Swap",
};

// ─── Generate slug ───────────────────────────────────────────
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
