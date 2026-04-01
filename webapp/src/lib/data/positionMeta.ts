import type { PositionRow, PortfolioBreakdown, WeightedLabel } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Per-stock fundamental metadata (static, sourced from Yahoo/
// fund factsheets; would come from API in production)
// ──────────────────────────────────────────────────────────────
const STOCK_META: Record<string, {
  country: string;
  sector: string;
  marketCap: "Large" | "Mid" | "Small";
  style: "Growth" | "Value" | "Blend" | "Dividend";
}> = {
  MSFT: { country: "USA",    sector: "Technologie",         marketCap: "Large", style: "Growth" },
  NVDA: { country: "USA",    sector: "Technologie",         marketCap: "Large", style: "Growth" },
  AAPL: { country: "USA",    sector: "Technologie",         marketCap: "Large", style: "Blend"  },
  AMZN: { country: "USA",    sector: "Zyklischer Konsum",   marketCap: "Large", style: "Growth" },
};

// ETF country distributions  (label → pct within ETF)
const ETF_COUNTRY: Record<string, Array<{ label: string; pct: number }>> = {
  VWRL: [
    { label: "Amerika",        pct: 63.2 },
    { label: "Europa",         pct: 17.4 },
    { label: "Asien-Pazifik",  pct: 10.1 },
    { label: "Schwellenländer",pct: 9.3  },
  ],
  XEON: [
    { label: "Deutschland",   pct: 28.4 },
    { label: "Frankreich",    pct: 23.1 },
    { label: "Niederlande",   pct: 14.2 },
    { label: "Spanien",       pct: 8.5  },
    { label: "Italien",       pct: 7.8  },
    { label: "Belgien",       pct: 4.1  },
    { label: "Sonstige EU",   pct: 13.9 },
  ],
  "4GLD": [
    { label: "Deutschland",   pct: 100 },
  ],
};

// ETF sector distributions
// ── VWRL sector weights (MSCI ACWI / FTSE All-World approximation) ──────────
// Sum must equal exactly 100.0 — verified: 23.0+15.8+12.2+10.0+10.1+8.6+6.9+4.6+3.2+3.1+2.5 = 100.0
const ETF_SECTOR: Record<string, Array<{ label: string; pct: number }>> = {
  VWRL: [
    { label: "Technologie",         pct: 23.0 },
    { label: "Finanzen",            pct: 15.8 },
    { label: "Gesundheit",          pct: 12.2 },
    { label: "Zyklischer Konsum",   pct: 10.0 },
    { label: "Industrie",           pct: 10.1 },
    { label: "Kommunikation",       pct: 8.6  },
    { label: "Basiskonsumgüter",    pct: 6.9  },
    { label: "Energie",             pct: 4.6  },
    { label: "Materialien",         pct: 3.2  },
    { label: "Immobilien",          pct: 3.1  },
    { label: "Versorger",           pct: 2.5  },
  ],
  XEON: [
    { label: "Finanzen",            pct: 22.4 },
    { label: "Industrie",           pct: 18.3 },
    { label: "Zyklischer Konsum",   pct: 14.7 },
    { label: "Technologie",         pct: 11.6 },
    { label: "Gesundheit",          pct: 10.1 },
    { label: "Basiskonsumgüter",    pct: 9.2  },
    { label: "Energie",             pct: 7.3  },
    { label: "Versorger",           pct: 6.4  },
  ],
};

// ETF market-cap breakdown
const ETF_MARKETCAP: Record<string, Array<{ label: string; pct: number }>> = {
  VWRL: [
    { label: "Large Cap",  pct: 82 },
    { label: "Mid Cap",    pct: 15 },
    { label: "Small Cap",  pct: 3  },
  ],
  XEON: [
    { label: "Large Cap",  pct: 100 },
  ],
};

// ETF style breakdown
const ETF_STYLE: Record<string, Array<{ label: string; pct: number }>> = {
  VWRL: [
    { label: "Blend",     pct: 46 },
    { label: "Growth",    pct: 36 },
    { label: "Value",     pct: 12 },
    { label: "Dividend",  pct: 6  },
  ],
  XEON: [
    { label: "Value",     pct: 48 },
    { label: "Blend",     pct: 34 },
    { label: "Dividend",  pct: 12 },
    { label: "Growth",    pct: 6  },
  ],
};

// ──────────────────────────────────────────────────────────────
// Aggregate breakdown computation
// ──────────────────────────────────────────────────────────────

type Accumulator = Record<string, number>;

function addWeighted(acc: Accumulator, slices: Array<{ label: string; pct: number }>, weight: number) {
  for (const s of slices) {
    acc[s.label] = (acc[s.label] ?? 0) + (s.pct / 100) * weight;
  }
}

function toSorted(acc: Accumulator, totalWeight: number): WeightedLabel[] {
  return Object.entries(acc)
    .map(([label, raw]) => ({ label, pct: totalWeight > 0 ? (raw / totalWeight) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct);
}

export function getPortfolioBreakdown(positions: PositionRow[]): PortfolioBreakdown {
  // Only equities and ETFs contribute to the breakdown
  const equitySlice = positions.filter(
    (p) => p.assetClass === "STOCK" || p.assetClass === "ETF"
  );

  const totalMV = positions.reduce((s, p) => s + p.marketValue, 0);
  const equityMV = equitySlice.reduce((s, p) => s + p.marketValue, 0);

  const countries: Accumulator = {};
  const sectors: Accumulator   = {};
  const marketCap: Accumulator = {};
  const style: Accumulator     = {};

  for (const pos of equitySlice) {
    const w = pos.marketValue; // raw market value as weight
    const ticker = pos.ticker ?? "";

    if (pos.assetClass === "STOCK") {
      const meta = STOCK_META[ticker];
      if (!meta) continue;
      addWeighted(countries,  [{ label: meta.country,   pct: 100 }], w);
      addWeighted(sectors,    [{ label: meta.sector,    pct: 100 }], w);
      addWeighted(marketCap,  [{ label: meta.marketCap + " Cap", pct: 100 }], w);
      addWeighted(style,      [{ label: meta.style,     pct: 100 }], w);
    } else if (pos.assetClass === "ETF") {
      const etfCountry   = ETF_COUNTRY[ticker];
      const etfSector    = ETF_SECTOR[ticker];
      const etfMarketCap = ETF_MARKETCAP[ticker];
      const etfStyle     = ETF_STYLE[ticker];
      if (etfCountry)   addWeighted(countries,  etfCountry,   w);
      if (etfSector)    addWeighted(sectors,    etfSector,    w);
      if (etfMarketCap) addWeighted(marketCap,  etfMarketCap, w);
      if (etfStyle)     addWeighted(style,      etfStyle,     w);
    }
  }

  return {
    countries:      toSorted(countries,  equityMV),
    sectors:        toSorted(sectors,    equityMV),
    marketCap:      toSorted(marketCap,  equityMV),
    style:          toSorted(style,      equityMV),
    equitySlicePct: totalMV > 0 ? (equityMV / totalMV) * 100 : 0,
  };
}
