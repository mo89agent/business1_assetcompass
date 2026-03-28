import type { TaxLot, SourceRef } from "@/lib/types";

// Reference date for holding-day calculations
const TODAY = new Date("2026-03-28");

function daysHeld(acquiredAt: string): number {
  return Math.floor((TODAY.getTime() - new Date(acquiredAt).getTime()) / 86_400_000);
}

function lot(
  id: string,
  positionId: string,
  acquiredAt: string,
  quantity: number,
  costBasisPerShare: number,
  currentPrice: number,
  currency: string,
  isCrypto: boolean,
  source: SourceRef
): TaxLot {
  const holdingDays = daysHeld(acquiredAt);
  const isLongTerm = holdingDays >= 365;
  const costBasisTotal = quantity * costBasisPerShare;
  const currentValue = quantity * currentPrice;
  const unrealizedGain = currentValue - costBasisTotal;
  const unrealizedGainPct = costBasisTotal > 0 ? (unrealizedGain / costBasisTotal) * 100 : 0;
  return {
    id,
    positionId,
    acquiredAt,
    quantity,
    costBasisPerShare,
    costBasisTotal,
    currentPrice,
    currentValue,
    unrealizedGain,
    unrealizedGainPct,
    holdingDays,
    isLongTerm,
    isTaxFreeGermany: isCrypto && isLongTerm,
    currency,
    source,
  };
}

const MANUAL: SourceRef = { type: "manual", label: "Manuell erfasst" };
const CSV_FLAT: SourceRef = { type: "import", label: "Flatex CSV", importFile: "flatex_export_2024.csv" };
const CSV_TR: SourceRef = { type: "import", label: "Trade Republic CSV", importFile: "tr_export_2024.csv" };
const API: SourceRef = { type: "import", label: "Coinbase API", fetchedAt: "2024-01-22T09:15:00Z" };

// ──────────────────────────────────────────────────────────────
// Position 1 — VWRL (420 shares, current €112.40)
// ──────────────────────────────────────────────────────────────
const VWRL_LOTS: TaxLot[] = [
  lot("l1a", "1", "2021-02-15", 200, 89.20, 112.40, "EUR", false, CSV_FLAT),
  lot("l1b", "1", "2022-08-10", 120, 98.50, 112.40, "EUR", false, CSV_FLAT),
  lot("l1c", "1", "2023-11-05", 100, 110.80, 112.40, "EUR", false, CSV_FLAT),
];

// ──────────────────────────────────────────────────────────────
// Position 2 — MSFT (85 shares, current $378.50)
// ──────────────────────────────────────────────────────────────
const MSFT_LOTS: TaxLot[] = [
  lot("l2a", "2", "2021-09-03", 50, 255.00, 378.50, "USD", false, CSV_FLAT),
  lot("l2b", "2", "2023-04-20", 35, 350.00, 378.50, "USD", false, CSV_FLAT),
];

// ──────────────────────────────────────────────────────────────
// Position 3 — NVDA (50 shares, current $618)
// ──────────────────────────────────────────────────────────────
const NVDA_LOTS: TaxLot[] = [
  lot("l3a", "3", "2023-01-25", 30, 382.00, 618.00, "USD", false, CSV_TR),
  lot("l3b", "3", "2024-06-12", 20, 490.00, 618.00, "USD", false, CSV_TR),
];

// ──────────────────────────────────────────────────────────────
// Position 4 — BTC (0.85 BTC, current $54,200)
// Lot 1 (796d, >365) → §23 EStG steuerfrei
// Lot 2 (310d, <365) → steuerpflichtig
// ──────────────────────────────────────────────────────────────
const BTC_LOTS: TaxLot[] = [
  lot("l4a", "4", "2024-01-22", 0.50, 42_000, 54_200, "USD", true, API),
  lot("l4b", "4", "2025-05-22", 0.35, 32_000, 54_200, "USD", true, API),
];

// ──────────────────────────────────────────────────────────────
// Position 5 — AAPL (120 shares, current $189.50)
// ──────────────────────────────────────────────────────────────
const AAPL_LOTS: TaxLot[] = [
  lot("l5a", "5", "2022-03-14", 80, 140.00, 189.50, "USD", false, CSV_FLAT),
  lot("l5b", "5", "2023-08-15", 40, 185.00, 189.50, "USD", false, CSV_FLAT),
];

// ──────────────────────────────────────────────────────────────
// Position 6 — XEON (850 shares, current €48.50)
// ──────────────────────────────────────────────────────────────
const XEON_LOTS: TaxLot[] = [
  lot("l6a", "6", "2022-01-10", 500, 39.50, 48.50, "EUR", false, CSV_TR),
  lot("l6b", "6", "2023-06-20", 350, 43.80, 48.50, "EUR", false, CSV_TR),
];

// ──────────────────────────────────────────────────────────────
// Position 7 — ETH (8.5 ETH, current $2,280)
// Lot 1 (720d, >365) → steuerfrei
// Lot 2 (195d, <365) → steuerpflichtig
// ──────────────────────────────────────────────────────────────
const ETH_LOTS: TaxLot[] = [
  lot("l7a", "7", "2024-04-08", 5.0, 1_600, 2_280, "USD", true, API),
  lot("l7b", "7", "2025-09-14", 3.5, 2_050, 2_280, "USD", true, API),
];

// ──────────────────────────────────────────────────────────────
// Position 9 — AMZN (45 shares, current $186)
// ──────────────────────────────────────────────────────────────
const AMZN_LOTS: TaxLot[] = [
  lot("l9a", "9", "2024-10-30", 45, 142.00, 186.00, "USD", false, MANUAL),
];

// ──────────────────────────────────────────────────────────────
// Position 10 — 4GLD (300 shares, current €150)
// ──────────────────────────────────────────────────────────────
const GOLD_LOTS: TaxLot[] = [
  lot("l10a", "10", "2023-04-20", 200, 127.00, 150.00, "EUR", false, MANUAL),
  lot("l10b", "10", "2024-06-12", 100, 151.00, 150.00, "EUR", false, MANUAL),
];

const ALL_LOTS: TaxLot[] = [
  ...VWRL_LOTS,
  ...MSFT_LOTS,
  ...NVDA_LOTS,
  ...BTC_LOTS,
  ...AAPL_LOTS,
  ...XEON_LOTS,
  ...ETH_LOTS,
  ...AMZN_LOTS,
  ...GOLD_LOTS,
];

export async function getTaxLotsForPosition(positionId: string): Promise<TaxLot[]> {
  return ALL_LOTS.filter((l) => l.positionId === positionId);
}

export async function getAllTaxLots(): Promise<TaxLot[]> {
  return ALL_LOTS;
}
