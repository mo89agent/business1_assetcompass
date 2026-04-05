import type { EtfExposure } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// VWRL — Vanguard FTSE All-World (position "1")
// Based on FTSE All-World Index composition (approx. 2025)
// ──────────────────────────────────────────────────────────────
const VWRL_EXPOSURE: EtfExposure = {
  positionId: "1",
  asOf: "2026-02-28",
  totalHoldings: 3_704,
  source: { type: "estimated", label: "Vanguard fund factsheet (Feb 2026)" },
  geographyBreakdown: [
    { label: "Americas", pct: 63.2 },
    { label: "Europa", pct: 17.4 },
    { label: "Asien-Pazifik (Industrieländer)", pct: 10.1 },
    { label: "Schwellenländer", pct: 9.3 },
  ],
  sectorBreakdown: [
    { label: "Technologie", pct: 24.1 },
    { label: "Finanzen", pct: 15.8 },
    { label: "Gesundheit", pct: 12.2 },
    { label: "Zyklischer Konsum", pct: 10.8 },
    { label: "Industrie", pct: 10.1 },
    { label: "Komm. Dienstl.", pct: 8.6 },
    { label: "Basiskonsumgüter", pct: 6.9 },
    { label: "Energie", pct: 5.2 },
    { label: "Materialien", pct: 3.8 },
    { label: "Immobilien", pct: 3.1 },
    { label: "Versorger", pct: 2.9 },
  ],
  topHoldings: [
    { rank: 1, name: "Apple Inc.", ticker: "AAPL", weightPct: 4.21, country: "USA", sector: "Technologie" },
    { rank: 2, name: "Microsoft Corp.", ticker: "MSFT", weightPct: 3.82, country: "USA", sector: "Technologie" },
    { rank: 3, name: "NVIDIA Corp.", ticker: "NVDA", weightPct: 3.61, country: "USA", sector: "Technologie" },
    { rank: 4, name: "Amazon.com Inc.", ticker: "AMZN", weightPct: 2.14, country: "USA", sector: "Zyklischer Konsum" },
    { rank: 5, name: "Alphabet Inc. A", ticker: "GOOGL", weightPct: 1.84, country: "USA", sector: "Komm. Dienstl." },
    { rank: 6, name: "Meta Platforms", ticker: "META", weightPct: 1.63, country: "USA", sector: "Komm. Dienstl." },
    { rank: 7, name: "Alphabet Inc. C", ticker: "GOOG", weightPct: 1.41, country: "USA", sector: "Komm. Dienstl." },
    { rank: 8, name: "Berkshire Hathaway B", ticker: "BRK.B", weightPct: 1.22, country: "USA", sector: "Finanzen" },
    { rank: 9, name: "Broadcom Inc.", ticker: "AVGO", weightPct: 1.09, country: "USA", sector: "Technologie" },
    { rank: 10, name: "Tesla Inc.", ticker: "TSLA", weightPct: 0.98, country: "USA", sector: "Zyklischer Konsum" },
  ],
};

// ──────────────────────────────────────────────────────────────
// XEON — Xtrackers Euro Stoxx 50 (position "6")
// Based on Euro Stoxx 50 Index composition (approx. 2025)
// ──────────────────────────────────────────────────────────────
const XEON_EXPOSURE: EtfExposure = {
  positionId: "6",
  asOf: "2026-02-28",
  totalHoldings: 50,
  source: { type: "estimated", label: "DWS Xtrackers factsheet (Feb 2026)" },
  geographyBreakdown: [
    { label: "Deutschland", pct: 28.4 },
    { label: "Frankreich", pct: 23.1 },
    { label: "Niederlande", pct: 14.2 },
    { label: "Spanien", pct: 8.5 },
    { label: "Italien", pct: 7.8 },
    { label: "Belgien", pct: 4.1 },
    { label: "Finnland", pct: 3.8 },
    { label: "Sonstige", pct: 10.1 },
  ],
  sectorBreakdown: [
    { label: "Technologie", pct: 18.2 },
    { label: "Finanzen", pct: 17.4 },
    { label: "Industrie", pct: 14.8 },
    { label: "Zyklischer Konsum", pct: 10.2 },
    { label: "Gesundheit", pct: 9.6 },
    { label: "Materialien", pct: 7.9 },
    { label: "Energie", pct: 7.2 },
    { label: "Basiskonsumgüter", pct: 6.4 },
    { label: "Versorger", pct: 4.9 },
    { label: "Komm. Dienstl.", pct: 3.4 },
  ],
  topHoldings: [
    { rank: 1, name: "ASML Holding", ticker: "ASML", weightPct: 9.21, country: "Niederlande", sector: "Technologie" },
    { rank: 2, name: "SAP SE", ticker: "SAP", weightPct: 7.38, country: "Deutschland", sector: "Technologie" },
    { rank: 3, name: "LVMH Moët Hennessy", ticker: "MC.PA", weightPct: 6.14, country: "Frankreich", sector: "Zyklischer Konsum" },
    { rank: 4, name: "Linde plc", ticker: "LIN", weightPct: 5.82, country: "Deutschland", sector: "Materialien" },
    { rank: 5, name: "TotalEnergies SE", ticker: "TTE.PA", weightPct: 3.94, country: "Frankreich", sector: "Energie" },
    { rank: 6, name: "Sanofi SA", ticker: "SAN.PA", weightPct: 3.61, country: "Frankreich", sector: "Gesundheit" },
    { rank: 7, name: "Airbus SE", ticker: "AIR.PA", weightPct: 3.42, country: "Frankreich", sector: "Industrie" },
    { rank: 8, name: "Siemens AG", ticker: "SIE.DE", weightPct: 3.24, country: "Deutschland", sector: "Industrie" },
    { rank: 9, name: "L'Oréal SA", ticker: "OR.PA", weightPct: 2.91, country: "Frankreich", sector: "Basiskonsumgüter" },
    { rank: 10, name: "Schneider Electric", ticker: "SU.PA", weightPct: 2.74, country: "Frankreich", sector: "Industrie" },
  ],
};

const ALL_EXPOSURES: EtfExposure[] = [VWRL_EXPOSURE, XEON_EXPOSURE];

export async function getEtfExposureForPosition(positionId: string): Promise<EtfExposure | null> {
  return ALL_EXPOSURES.find((e) => e.positionId === positionId) ?? null;
}
