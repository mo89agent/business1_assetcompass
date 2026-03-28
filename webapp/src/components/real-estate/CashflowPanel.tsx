"use client";

import { formatCurrency } from "@/lib/utils";
import type { PropertyRecord, PropertyMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, HelpCircle, Info } from "lucide-react";

interface Props {
  property: PropertyRecord;
  metrics: PropertyMetrics;
}

function DataBadge({ isEstimated }: { isEstimated: boolean }) {
  if (isEstimated) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-50 text-amber-600 border border-amber-100">
        <HelpCircle size={9} />
        Schätzung
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle2 size={9} />
      Istwert
    </span>
  );
}

function CashflowRow({
  label,
  value,
  currency,
  isEstimated,
  indent = false,
  bold = false,
  highlight,
  sub,
}: {
  label: string;
  value: number;
  currency: string;
  isEstimated?: boolean;
  indent?: boolean;
  bold?: boolean;
  highlight?: "positive" | "negative" | "neutral";
  sub?: string;
}) {
  const valueColor =
    highlight === "positive"
      ? "text-emerald-700"
      : highlight === "negative"
      ? "text-red-600"
      : "text-slate-800";

  return (
    <div className={cn(
      "flex items-center justify-between py-2 border-b border-slate-50 last:border-0",
      indent ? "pl-4" : ""
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {indent && <div className="w-1 shrink-0 h-full text-slate-300">└</div>}
        <div>
          <span className={cn("text-xs", bold ? "font-semibold text-slate-800" : "text-slate-600")}>{label}</span>
          {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isEstimated != null && <DataBadge isEstimated={isEstimated} />}
        <span className={cn("text-xs font-mono", bold ? "font-bold" : "", valueColor)}>
          {value >= 0 ? "+" : ""}{formatCurrency(value, currency)}/mo
        </span>
      </div>
    </div>
  );
}

export function CashflowPanel({ property, metrics }: Props) {
  const { currency, vacancyAllowancePct } = property;
  const vacancyDeduction = property.actualRentMonthly - metrics.effectiveMonthlyRent;

  const noi = metrics.netOperatingIncome;
  const isNOIPositive = noi >= 0;
  const netCashflow = metrics.netCashflow;
  const isCashflowPositive = netCashflow >= 0;

  // Annual projections
  const annualNOI = noi * 12;
  const annualNetCashflow = netCashflow * 12;
  const annualDebtService = metrics.totalMonthlyDebtService * 12;
  const annualInterest = metrics.monthlyInterest * 12;
  const annualPrincipal = metrics.monthlyPrincipal * 12;

  // Yield metrics
  const totalAcquisitionCost = property.acquisitionPrice + property.acquisitionCosts;
  const grossYieldValue = property.valuation.estimatedValue > 0
    ? (property.targetRentMonthly * 12) / property.valuation.estimatedValue * 100
    : 0;
  const netYieldValue = totalAcquisitionCost > 0
    ? (annualNOI / totalAcquisitionCost) * 100
    : 0;

  return (
    <div className="space-y-5">
      {/* Cashflow breakdown card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Cashflow-Aufstellung (monatlich)</h3>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info size={11} />
            Istwert = bestätigte Zahl · Schätzung = berechnet
          </span>
        </div>

        <div className="space-y-0">
          {/* Income */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-1">Einnahmen</p>
          <CashflowRow
            label="Bruttomiete (Soll)"
            value={property.targetRentMonthly}
            currency={currency}
            isEstimated={false}
          />
          <CashflowRow
            label={`Leerstandspuffer (${vacancyAllowancePct}% p.a.)`}
            value={-vacancyDeduction}
            currency={currency}
            isEstimated={true}
            indent
            sub="Konservative Reserve — keine echte Zahlung"
          />
          <CashflowRow
            label="Effektive Einnahmen (netto)"
            value={metrics.effectiveMonthlyRent}
            currency={currency}
            bold
          />

          {/* Costs */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-1 pt-4">Bewirtschaftungskosten</p>
          {property.costLines.map((line) => (
            <CashflowRow
              key={line.label}
              label={line.label}
              value={-line.monthlyAmount}
              currency={currency}
              isEstimated={line.isEstimated}
              indent
              sub={line.notes}
            />
          ))}
          <CashflowRow
            label="Summe Bewirtschaftungskosten"
            value={-metrics.totalMonthlyCosts}
            currency={currency}
            bold
          />

          {/* NOI */}
          <div className="my-2 pt-2 border-t border-slate-200">
            <CashflowRow
              label="Nettobetriebsergebnis (NOI)"
              value={noi}
              currency={currency}
              bold
              highlight={isNOIPositive ? "positive" : "negative"}
              sub="Vor Kapitaldienst — Renditekennzahl der Immobilie"
            />
          </div>

          {/* Debt service */}
          {metrics.totalMonthlyDebtService > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 pb-1 pt-4">Kapitaldienst</p>
              {property.loans.map((loan) => {
                const loanInterest = loan.remainingBalance * (loan.interestRatePct / 100 / 12);
                const loanPrincipal = loan.monthlyPayment - loanInterest;
                return (
                  <div key={loan.id}>
                    <CashflowRow
                      label={`${loan.lender} — Tilgung`}
                      value={-loanPrincipal}
                      currency={currency}
                      isEstimated={false}
                      indent
                      sub="Eigenkapitalaufbau — kein realer Aufwand"
                    />
                    <CashflowRow
                      label={`${loan.lender} — Zinsen`}
                      value={-loanInterest}
                      currency={currency}
                      isEstimated={false}
                      indent
                    />
                  </div>
                );
              })}
              <CashflowRow
                label="Gesamter Kapitaldienst"
                value={-metrics.totalMonthlyDebtService}
                currency={currency}
                bold
              />
            </>
          )}

          {/* Net cashflow */}
          <div className={`mt-3 pt-3 border-t-2 rounded-lg px-3 py-2 ${isCashflowPositive ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${isCashflowPositive ? "text-emerald-700" : "text-red-700"}`}>
                  Free Cashflow (nach Kapitaldienst)
                </p>
                {!isCashflowPositive && metrics.totalMonthlyDebtService > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Davon {formatCurrency(metrics.monthlyPrincipal, currency)}/mo Tilgung (Eigenkapitalaufbau)
                  </p>
                )}
              </div>
              <span className={`text-lg font-bold ${isCashflowPositive ? "text-emerald-700" : "text-red-700"}`}>
                {netCashflow >= 0 ? "+" : ""}{formatCurrency(netCashflow, currency)}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Annual view + yield metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Jahresbetrachtung</h3>
          <div className="space-y-2">
            {[
              { label: "Mieteinnahmen (effektiv)", value: metrics.effectiveMonthlyRent * 12, bold: false },
              { label: "Bewirtschaftungskosten", value: -metrics.totalMonthlyCosts * 12, bold: false },
              { label: "NOI (Nettobetriebsergebnis)", value: annualNOI, bold: true },
              ...(annualDebtService > 0 ? [
                { label: "Zinszahlungen", value: -annualInterest, bold: false },
                { label: "Tilgung (Eigenkapital)", value: -annualPrincipal, bold: false },
                { label: "Free Cashflow", value: annualNetCashflow, bold: true },
              ] : []),
            ].map(({ label, value, bold }) => (
              <div key={label} className={cn("flex justify-between py-1.5 border-b border-slate-50 last:border-0", bold ? "pt-2" : "")}>
                <span className={cn("text-xs", bold ? "font-semibold text-slate-800" : "text-slate-500")}>{label}</span>
                <span className={cn(
                  "text-xs font-mono",
                  bold ? "font-bold" : "",
                  value >= 0 ? "text-emerald-700" : "text-red-600"
                )}>
                  {value >= 0 ? "+" : ""}{formatCurrency(value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Renditekennzahlen</h3>
          <div className="space-y-3">
            {[
              {
                label: "Bruttomietrendite",
                value: `${grossYieldValue.toFixed(2)}%`,
                sub: "Jahresmiete (Soll) / Schätzwert",
                note: "Marktstandard",
              },
              {
                label: "Nettomietrendite (NOI-Rendite)",
                value: `${netYieldValue.toFixed(2)}%`,
                sub: "Jährl. NOI / Gesamterwerbskosten",
                note: "Auf tatsächliche Investition",
              },
              {
                label: "LTV (Beleihungsauslauf)",
                value: metrics.ltv > 0 ? `${metrics.ltv.toFixed(1)}%` : "0% (Schuldenfrei)",
                sub: "Restschuld / Schätzwert Mitte",
                note: metrics.ltv > 70 ? "Risiko: hoch" : metrics.ltv > 60 ? "Risiko: mittel" : "Risiko: moderat",
              },
            ].map(({ label, value, sub, note }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-slate-700">{label}</p>
                  <p className="text-[10px] text-slate-400">{sub}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{value}</p>
                  <p className="text-[10px] text-slate-400">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-[10px] text-slate-400 flex items-center gap-1">
        <Info size={11} />
        Alle Angaben basieren auf manuell erfassten Daten. Keine automatische Aktualisierung.
        Bewirtschaftungskosten ohne Anspruch auf Vollständigkeit.
      </p>
    </div>
  );
}
