"use client";

import { formatCurrency } from "@/lib/utils";
import type { PropertyRecord, PropertyMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface Props {
  property: PropertyRecord;
  metrics: PropertyMetrics;
}

interface ScenarioInput {
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  appreciationPct: number;    // annual price appreciation
  rentGrowthPct: number;      // annual rent growth
  refinanceRatePct: number;   // rate assumed at next fixed-rate reset
}

const SCENARIOS: ScenarioInput[] = [
  {
    label: "Pessimistisch",
    description: "Wertstagnation, kein Mietwachstum, höhere Zinsen bei Umfinanzierung",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-100",
    appreciationPct: 0,
    rentGrowthPct: 0,
    refinanceRatePct: 4.5,
  },
  {
    label: "Basisfall",
    description: "Moderates Wachstum, leichtes Mietwachstum, marktübliche Zinsen",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
    appreciationPct: 2,
    rentGrowthPct: 1.5,
    refinanceRatePct: 3.5,
  },
  {
    label: "Optimistisch",
    description: "Überdurchschnittliche Wertsteigerung, starkes Mietwachstum, sinkende Zinsen",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    appreciationPct: 4,
    rentGrowthPct: 3,
    refinanceRatePct: 2.5,
  },
];

interface ProjectedYear {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  ltv: number;
  annualNOI: number;
  annualCashflow: number;
  equityMultiple: number; // equity / initial equity investment
}

function projectScenario(
  p: PropertyRecord,
  m: PropertyMetrics,
  scenario: ScenarioInput,
  horizonYears: number
): ProjectedYear {
  const totalAcquisitionCost = p.acquisitionPrice + p.acquisitionCosts;
  const initialEquity = totalAcquisitionCost - m.totalLoanBalance;

  // Loan amortization: simple linear approximation (actual is annuity)
  const annualPrincipal = m.monthlyPrincipal * 12;
  const remainingLoan = Math.max(0, m.totalLoanBalance - annualPrincipal * horizonYears);

  // Has the fixed rate reset by this point?
  const fixedRateExpiry = p.loans[0]?.fixedRateUntil;
  const yearsToRefix = fixedRateExpiry
    ? Math.max(0, (new Date(fixedRateExpiry).getTime() - new Date("2026-03-28").getTime()) / (365 * 86_400_000))
    : Infinity;
  const hasRefinanced = horizonYears > yearsToRefix;

  // Effective monthly debt service after potential refinancing
  // (simplified: assume same amortization speed at new rate, just interest changes)
  const effectiveRate = hasRefinanced ? scenario.refinanceRatePct : (p.loans[0]?.interestRatePct ?? 0);
  const newMonthlyInterest = remainingLoan * (effectiveRate / 100 / 12);
  const newMonthlyDebtService = p.loans.length > 0 ? m.monthlyPrincipal + newMonthlyInterest : 0;

  // Value and rent projections
  const projectedValue = p.valuation.estimatedValue * Math.pow(1 + scenario.appreciationPct / 100, horizonYears);
  const projectedRent = p.actualRentMonthly * Math.pow(1 + scenario.rentGrowthPct / 100, horizonYears);
  const projectedNOI = (projectedRent * (1 - p.vacancyAllowancePct / 100) - m.totalMonthlyCosts) * 12;
  const projectedAnnualCashflow = projectedNOI - newMonthlyDebtService * 12;

  const equity = projectedValue - remainingLoan;
  const ltv = projectedValue > 0 ? (remainingLoan / projectedValue) * 100 : 0;
  const equityMultiple = initialEquity > 0 ? equity / initialEquity : 0;

  return {
    year: new Date("2026-03-28").getFullYear() + horizonYears,
    propertyValue: Math.round(projectedValue),
    loanBalance: Math.round(remainingLoan),
    equity: Math.round(equity),
    ltv,
    annualNOI: Math.round(projectedNOI),
    annualCashflow: Math.round(projectedAnnualCashflow),
    equityMultiple,
  };
}

export function PropertyForecast({ property, metrics }: Props) {
  const { currency } = property;
  const horizons = [5, 10] as const;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500">
          Die nachfolgenden Szenarien sind <strong>illustrative Modellrechnungen</strong>, keine Prognosen.
          Tatsächliche Wertentwicklung, Mietmärkte und Zinsen können erheblich abweichen.
          Grundlage: heutige Kennzahlen, lineare Fortschreibung. Kein Finanzrat.
        </p>
      </div>

      {/* Assumptions summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Modell-Annahmen</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-400 font-medium">Szenario</th>
                <th className="text-right py-2 text-slate-400 font-medium">Wertsteigerung p.a.</th>
                <th className="text-right py-2 text-slate-400 font-medium">Mietwachstum p.a.</th>
                <th className="text-right py-2 text-slate-400 font-medium">Refinanzierungszins</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((s) => (
                <tr key={s.label} className="border-b border-slate-50 last:border-0">
                  <td className={`py-2 font-semibold ${s.color}`}>{s.label}</td>
                  <td className="py-2 text-right text-slate-700">{s.appreciationPct.toFixed(1)}%</td>
                  <td className="py-2 text-right text-slate-700">{s.rentGrowthPct.toFixed(1)}%</td>
                  <td className="py-2 text-right text-slate-700">{s.refinanceRatePct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast grids — one per horizon */}
      {horizons.map((horizon) => (
        <div key={horizon}>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Prognose in {horizon} Jahren ({new Date("2026-03-28").getFullYear() + horizon})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCENARIOS.map((scenario) => {
              const proj = projectScenario(property, metrics, scenario, horizon);
              const isCashflowPositive = proj.annualCashflow >= 0;

              return (
                <div
                  key={scenario.label}
                  className={cn(
                    "rounded-xl border p-4 space-y-4",
                    scenario.bg,
                    scenario.border
                  )}
                >
                  <div>
                    <p className={`text-sm font-bold ${scenario.color}`}>{scenario.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{scenario.description}</p>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        label: "Marktwert",
                        value: formatCurrency(proj.propertyValue, currency),
                        sub: null,
                      },
                      {
                        label: "Eigenkapital",
                        value: formatCurrency(proj.equity, currency),
                        sub: `${proj.equityMultiple.toFixed(1)}× Eigenkapitalmultiple`,
                      },
                      {
                        label: "LTV",
                        value: proj.ltv > 0 ? `${proj.ltv.toFixed(1)}%` : "Schuldenfrei",
                        sub: null,
                      },
                      {
                        label: "NOI p.a.",
                        value: formatCurrency(proj.annualNOI, currency),
                        sub: "Vor Kapitaldienst",
                      },
                      {
                        label: "Free Cashflow p.a.",
                        value: `${proj.annualCashflow >= 0 ? "+" : ""}${formatCurrency(proj.annualCashflow, currency)}`,
                        sub: "Nach Kapitaldienst",
                        valueColor: isCashflowPositive ? "text-emerald-700" : "text-red-600",
                      },
                    ].map(({ label, value, sub, valueColor }) => (
                      <div key={label} className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] text-slate-500">{label}</p>
                          {sub && <p className="text-[9px] text-slate-400">{sub}</p>}
                        </div>
                        <span className={cn("text-xs font-semibold text-right shrink-0", valueColor ?? "text-slate-800")}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
