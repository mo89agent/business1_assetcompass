import type { PropertyRecord, PropertyMetrics } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Property 1 — Berliner Str. 12, Wohnung A (Berlin)
// Residential rental apartment
// ──────────────────────────────────────────────────────────────
const BERLIN_PROPERTY: PropertyRecord = {
  id: "re1",
  name: "Berliner Str. 12, Wohnung A",
  address: "Berliner Straße 12, Wohnung A",
  city: "Berlin",
  country: "DE",
  postalCode: "10711",
  type: "residential",
  subtype: "apartment",
  sqm: 78,
  yearBuilt: 1972,
  energyClass: "C",

  acquisitionDate: "2020-06-15",
  acquisitionPrice: 320_000,
  acquisitionCosts: 28_800, // ~9%: 6% GrESt Berlin + 1.5% Notar + 1.5% Makler

  valuation: {
    estimatedValue: 385_000,
    valueLow: 365_000,
    valueHigh: 405_000,
    confidence: "medium",
    method: "self_estimated",
    asOf: "2025-10-01",
    notes: "Basiert auf vergleichbaren Verkäufen im Umfeld. Keine offizielle Bewertung seit Kauf.",
    source: { type: "manual", label: "Eigene Schätzung (Vergleichswerte ImmobilienScout24)" },
  },

  loans: [
    {
      id: "loan1",
      propertyId: "re1",
      lender: "DKB – Immobilienkredit",
      originalAmount: 250_000,
      remainingBalance: 198_000,
      interestRatePct: 1.85,
      isFixedRate: true,
      fixedRateUntil: "2026-05-01", // ← URGENT: expires in ~34 days from 2026-03-28
      monthlyPayment: 1_247,
      termYears: 20,
      startDate: "2020-06-01",
      currency: "EUR",
    },
  ],

  targetRentMonthly: 1_450,
  actualRentMonthly: 1_450,
  vacancyAllowancePct: 2,

  costLines: [
    { label: "Hausgeld (Verwaltung + Rücklage)", monthlyAmount: 220, isEstimated: false, category: "management", notes: "Laut Abrechnung Eigentümergemeinschaft" },
    { label: "Grundsteuer (umgelegt)", monthlyAmount: 52, isEstimated: true, category: "tax", notes: "Basierend auf Grundsteuerbescheid / 12" },
    { label: "Gebäudeversicherung", monthlyAmount: 25, isEstimated: false, category: "insurance" },
    { label: "Instandhaltungsrücklage (eigen)", monthlyAmount: 50, isEstimated: true, category: "maintenance", notes: "Empfehlung: ~€0.75/sqm/mo für 1972er Gebäude" },
  ],

  currency: "EUR",
};

// ──────────────────────────────────────────────────────────────
// Property 2 — Hauptstr. 7, Gewerbeeinheit (München)
// Commercial unit, debt-free
// ──────────────────────────────────────────────────────────────
const MUNICH_PROPERTY: PropertyRecord = {
  id: "re2",
  name: "Hauptstr. 7, Gewerbeeinheit",
  address: "Hauptstraße 7",
  city: "München",
  country: "DE",
  postalCode: "80331",
  type: "commercial",
  subtype: "retail",
  sqm: 145,
  yearBuilt: 1985,
  energyClass: "B",

  acquisitionDate: "2018-09-01",
  acquisitionPrice: 480_000,
  acquisitionCosts: 38_400, // ~8%: 3.5% GrESt Bayern + 2% Notar + 2.5% Makler

  valuation: {
    estimatedValue: 530_000,
    valueLow: 490_000,
    valueHigh: 570_000,
    confidence: "low",
    method: "self_estimated",
    asOf: "2025-06-01",
    notes: "Letzte offizielle Bewertung bei Kauf 2018. Keine aktuelle Bankbewertung. Breite Schätzspanne.",
    source: { type: "manual", label: "Eigene Schätzung (keine aktuelle Bankbewertung)" },
  },

  loans: [], // debt-free

  targetRentMonthly: 2_100,
  actualRentMonthly: 2_100,
  vacancyAllowancePct: 5, // commercial: higher vacancy risk

  costLines: [
    { label: "Grundsteuer", monthlyAmount: 162, isEstimated: false, category: "tax", notes: "Laut Grundsteuerbescheid 2025" },
    { label: "Gebäudeversicherung", monthlyAmount: 82, isEstimated: false, category: "insurance" },
    { label: "Instandhaltungsrücklage", monthlyAmount: 150, isEstimated: true, category: "maintenance", notes: "Schätzung ca. €1.05/sqm/mo für Gewerbe" },
    { label: "Hausverwaltung", monthlyAmount: 105, isEstimated: false, category: "management", notes: "Verwaltungsvertrag: 5% der Nettomiete" },
  ],

  currency: "EUR",
};

const ALL_PROPERTIES: PropertyRecord[] = [BERLIN_PROPERTY, MUNICH_PROPERTY];

export async function getProperties(): Promise<PropertyRecord[]> {
  return ALL_PROPERTIES;
}

export async function getPropertyById(id: string): Promise<PropertyRecord | null> {
  return ALL_PROPERTIES.find((p) => p.id === id) ?? null;
}

// ──────────────────────────────────────────────────────────────
// Derived metrics computation — single source of truth
// Never store derived values, always compute from the record
// ──────────────────────────────────────────────────────────────
export function computePropertyMetrics(p: PropertyRecord): PropertyMetrics {
  const totalAcquisitionCost = p.acquisitionPrice + p.acquisitionCosts;
  const totalLoanBalance = p.loans.reduce((s, l) => s + l.remainingBalance, 0);
  const equity = p.valuation.estimatedValue - totalLoanBalance;
  const ltv = p.valuation.estimatedValue > 0
    ? (totalLoanBalance / p.valuation.estimatedValue) * 100
    : 0;

  // Vacancy applied as annual buffer (not lockstep month reduction)
  const effectiveMonthlyRent = p.actualRentMonthly * (1 - p.vacancyAllowancePct / 100);
  const totalMonthlyCosts = p.costLines.reduce((s, c) => s + c.monthlyAmount, 0);
  const totalMonthlyDebtService = p.loans.reduce((s, l) => s + l.monthlyPayment, 0);

  // Interest for current month (simple approximation on remaining balance)
  const monthlyInterest = p.loans.reduce(
    (s, l) => s + l.remainingBalance * (l.interestRatePct / 100 / 12),
    0
  );
  const monthlyPrincipal = totalMonthlyDebtService - monthlyInterest;

  const netOperatingIncome = effectiveMonthlyRent - totalMonthlyCosts;
  const netCashflow = netOperatingIncome - totalMonthlyDebtService;

  const grossYield = p.valuation.estimatedValue > 0
    ? (p.targetRentMonthly * 12) / p.valuation.estimatedValue * 100
    : 0;
  const netYield = totalAcquisitionCost > 0
    ? (netOperatingIncome * 12) / totalAcquisitionCost * 100
    : 0;

  const unrealizedGain = p.valuation.estimatedValue - totalAcquisitionCost;
  const unrealizedGainPct = totalAcquisitionCost > 0
    ? (unrealizedGain / totalAcquisitionCost) * 100
    : 0;

  return {
    totalAcquisitionCost,
    totalLoanBalance,
    equity,
    ltv,
    effectiveMonthlyRent,
    totalMonthlyCosts,
    totalMonthlyDebtService,
    monthlyPrincipal,
    monthlyInterest,
    netOperatingIncome,
    netCashflow,
    grossYield,
    netYield,
    unrealizedGain,
    unrealizedGainPct,
  };
}
