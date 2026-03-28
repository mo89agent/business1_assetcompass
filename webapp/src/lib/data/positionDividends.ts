import type { PositionDividend } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Position 1 — VWRL (420 shares) — semi-annual, ~€0.50/share
// ──────────────────────────────────────────────────────────────
const VWRL_DIVS: PositionDividend[] = [
  { id: "pv1a", positionId: "1", ticker: "VWRL", exDate: "2024-03-20", payDate: "2024-03-25", amountPerShare: 0.47, sharesHeld: 420, totalAmount: 197.40, currency: "EUR", isProjected: false },
  { id: "pv1b", positionId: "1", ticker: "VWRL", exDate: "2024-06-19", payDate: "2024-06-24", amountPerShare: 0.51, sharesHeld: 420, totalAmount: 214.20, currency: "EUR", isProjected: false },
  { id: "pv1c", positionId: "1", ticker: "VWRL", exDate: "2024-09-18", payDate: "2024-09-23", amountPerShare: 0.49, sharesHeld: 420, totalAmount: 205.80, currency: "EUR", isProjected: false },
  { id: "pv1d", positionId: "1", ticker: "VWRL", exDate: "2024-12-18", payDate: "2024-12-23", amountPerShare: 0.52, sharesHeld: 420, totalAmount: 218.40, currency: "EUR", isProjected: false },
  { id: "pv1e", positionId: "1", ticker: "VWRL", exDate: "2025-03-19", payDate: "2025-03-24", amountPerShare: 0.48, sharesHeld: 420, totalAmount: 201.60, currency: "EUR", isProjected: false },
  { id: "pv1f", positionId: "1", ticker: "VWRL", exDate: "2025-06-18", payDate: "2025-06-23", amountPerShare: 0.53, sharesHeld: 420, totalAmount: 222.60, currency: "EUR", isProjected: false },
  { id: "pv1g", positionId: "1", ticker: "VWRL", exDate: "2025-09-17", payDate: "2025-09-22", amountPerShare: 0.50, sharesHeld: 420, totalAmount: 210.00, currency: "EUR", isProjected: false },
  { id: "pv1h", positionId: "1", ticker: "VWRL", exDate: "2025-12-17", payDate: "2025-12-22", amountPerShare: 0.55, sharesHeld: 420, totalAmount: 231.00, currency: "EUR", isProjected: false },
  // Projected next quarter
  { id: "pv1i", positionId: "1", ticker: "VWRL", exDate: "2026-03-18", payDate: "2026-03-23", amountPerShare: 0.51, sharesHeld: 420, totalAmount: 214.20, currency: "EUR", isProjected: true },
];

// ──────────────────────────────────────────────────────────────
// Position 2 — MSFT (85 shares) — quarterly, ~$0.75/share
// ──────────────────────────────────────────────────────────────
const MSFT_DIVS: PositionDividend[] = [
  { id: "pm2a", positionId: "2", ticker: "MSFT", exDate: "2024-02-14", payDate: "2024-03-14", amountPerShare: 0.75, sharesHeld: 85, totalAmount: 63.75, currency: "USD", isProjected: false },
  { id: "pm2b", positionId: "2", ticker: "MSFT", exDate: "2024-05-15", payDate: "2024-06-13", amountPerShare: 0.75, sharesHeld: 85, totalAmount: 63.75, currency: "USD", isProjected: false },
  { id: "pm2c", positionId: "2", ticker: "MSFT", exDate: "2024-08-14", payDate: "2024-09-12", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: false },
  { id: "pm2d", positionId: "2", ticker: "MSFT", exDate: "2024-11-20", payDate: "2024-12-12", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: false },
  { id: "pm2e", positionId: "2", ticker: "MSFT", exDate: "2025-02-19", payDate: "2025-03-13", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: false },
  { id: "pm2f", positionId: "2", ticker: "MSFT", exDate: "2025-05-14", payDate: "2025-06-12", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: false },
  { id: "pm2g", positionId: "2", ticker: "MSFT", exDate: "2025-08-20", payDate: "2025-09-11", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: false },
  { id: "pm2h", positionId: "2", ticker: "MSFT", exDate: "2025-11-19", payDate: "2025-12-11", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: false },
  // Projected
  { id: "pm2i", positionId: "2", ticker: "MSFT", exDate: "2026-02-18", payDate: "2026-03-12", amountPerShare: 0.83, sharesHeld: 85, totalAmount: 70.55, currency: "USD", isProjected: true },
];

// ──────────────────────────────────────────────────────────────
// Position 5 — AAPL (120 shares) — quarterly, ~$0.24/share
// ──────────────────────────────────────────────────────────────
const AAPL_DIVS: PositionDividend[] = [
  { id: "pa5a", positionId: "5", ticker: "AAPL", exDate: "2024-02-09", payDate: "2024-02-15", amountPerShare: 0.24, sharesHeld: 120, totalAmount: 28.80, currency: "USD", isProjected: false },
  { id: "pa5b", positionId: "5", ticker: "AAPL", exDate: "2024-05-10", payDate: "2024-05-16", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  { id: "pa5c", positionId: "5", ticker: "AAPL", exDate: "2024-08-09", payDate: "2024-08-15", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  { id: "pa5d", positionId: "5", ticker: "AAPL", exDate: "2024-11-08", payDate: "2024-11-14", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  { id: "pa5e", positionId: "5", ticker: "AAPL", exDate: "2025-02-07", payDate: "2025-02-13", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  { id: "pa5f", positionId: "5", ticker: "AAPL", exDate: "2025-05-09", payDate: "2025-05-15", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  { id: "pa5g", positionId: "5", ticker: "AAPL", exDate: "2025-08-08", payDate: "2025-08-14", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  { id: "pa5h", positionId: "5", ticker: "AAPL", exDate: "2025-11-07", payDate: "2025-11-13", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: false },
  // Projected
  { id: "pa5i", positionId: "5", ticker: "AAPL", exDate: "2026-02-06", payDate: "2026-02-12", amountPerShare: 0.25, sharesHeld: 120, totalAmount: 30.00, currency: "USD", isProjected: true },
];

// ──────────────────────────────────────────────────────────────
// Position 6 — XEON (850 shares) — annual, ~€1.20/share
// ──────────────────────────────────────────────────────────────
const XEON_DIVS: PositionDividend[] = [
  { id: "px6a", positionId: "6", ticker: "XEON", exDate: "2024-04-10", payDate: "2024-04-15", amountPerShare: 1.14, sharesHeld: 850, totalAmount: 969.00, currency: "EUR", isProjected: false },
  { id: "px6b", positionId: "6", ticker: "XEON", exDate: "2025-04-09", payDate: "2025-04-14", amountPerShare: 1.21, sharesHeld: 850, totalAmount: 1028.50, currency: "EUR", isProjected: false },
  // Projected
  { id: "px6c", positionId: "6", ticker: "XEON", exDate: "2026-04-08", payDate: "2026-04-13", amountPerShare: 1.25, sharesHeld: 850, totalAmount: 1062.50, currency: "EUR", isProjected: true },
];

const ALL_DIVIDENDS: PositionDividend[] = [
  ...VWRL_DIVS,
  ...MSFT_DIVS,
  ...AAPL_DIVS,
  ...XEON_DIVS,
];

export async function getDividendsForPosition(positionId: string): Promise<PositionDividend[]> {
  return ALL_DIVIDENDS
    .filter((d) => d.positionId === positionId)
    .sort((a, b) => b.exDate.localeCompare(a.exDate)); // newest first
}

export async function getAllPositionDividends(): Promise<PositionDividend[]> {
  return ALL_DIVIDENDS;
}
