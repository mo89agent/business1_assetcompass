"use client";

import { useState } from "react";
import { cn, formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { PropertyRecord, PropertyMetrics } from "@/lib/types";
import { ValuationCard } from "./ValuationCard";
import { LoanPanel } from "./LoanPanel";
import { CashflowPanel } from "./CashflowPanel";
import { PropertyForecast } from "./PropertyForecast";
import { AlertTriangle, Home, Building2 } from "lucide-react";

type Tab = "overview" | "financing" | "cashflow" | "forecast";

interface Props {
  property: PropertyRecord;
  metrics: PropertyMetrics;
}

const TYPE_ICONS = {
  residential: Home,
  commercial: Building2,
  mixed: Building2,
  land: Building2,
};

const TYPE_LABELS = {
  residential: "Wohnimmobilie",
  commercial: "Gewerbeimmobilie",
  mixed: "Gemischt",
  land: "Grundstück",
};

function MetricTile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "positive" | "negative" | "warning";
}) {
  const valueClass =
    highlight === "positive"
      ? "text-emerald-700"
      : highlight === "negative"
      ? "text-red-600"
      : highlight === "warning"
      ? "text-amber-700"
      : "text-slate-900";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={cn("text-sm font-bold", valueClass)}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function PropertyDetailShell({ property, metrics }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const TypeIcon = TYPE_ICONS[property.type];

  // Fixed rate urgency check
  const fixedRateExpiry = property.loans.find((l) => l.fixedRateUntil)?.fixedRateUntil;
  const daysToExpiry = fixedRateExpiry
    ? Math.ceil((new Date(fixedRateExpiry).getTime() - new Date("2026-03-28").getTime()) / 86_400_000)
    : null;
  const hasUrgentLoan = daysToExpiry != null && daysToExpiry <= 90;

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "overview", label: "Übersicht" },
    {
      id: "financing",
      label: "Finanzierung",
      badge: hasUrgentLoan ? "!" : undefined,
    },
    { id: "cashflow", label: "Cashflow" },
    { id: "forecast", label: "Forecast" },
  ];

  return (
    <div className="space-y-5">
      {/* Fixed-rate expiry banner */}
      {hasUrgentLoan && daysToExpiry != null && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>Zinsbindung läuft in {daysToExpiry} Tagen ab</strong> — Anschlussfinanzierung planen.
            Aktuelle Zinsen liegen deutlich über dem bisherigen Satz von{" "}
            {property.loans.find((l) => l.fixedRateUntil)?.interestRatePct.toFixed(2)}%.
          </p>
        </div>
      )}

      {/* Property header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <TypeIcon size={20} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">{property.name}</h1>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className="text-sm text-slate-400">{property.city} · {property.postalCode}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-orange-100 text-orange-700">
                {TYPE_LABELS[property.type]}
              </span>
              {property.subtype && (
                <span className="text-xs text-slate-400">{property.subtype}</span>
              )}
              {property.sqm && (
                <span className="text-xs text-slate-400">{property.sqm} m²</span>
              )}
              {property.yearBuilt && (
                <span className="text-xs text-slate-400">Baujahr {property.yearBuilt}</span>
              )}
              {property.energyClass && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                  Energieklasse {property.energyClass}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(property.valuation.estimatedValue, property.currency)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Schätzwert · {property.valuation.confidence === "high" ? "Konfidenz hoch" : property.valuation.confidence === "medium" ? "Konfidenz mittel" : "Konfidenz niedrig"}
            </p>
            <p className={cn(
              "text-sm font-medium mt-1",
              metrics.unrealizedGain >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {metrics.unrealizedGain >= 0 ? "+" : ""}{formatCurrency(metrics.unrealizedGain, property.currency)}
              {" "}({metrics.unrealizedGain >= 0 ? "+" : ""}{metrics.unrealizedGainPct.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px flex items-center gap-1.5",
              activeTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Übersicht ──────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Eigenkapital"
              value={formatCurrency(metrics.equity, property.currency)}
              sub={`EK-Rendite: ${metrics.unrealizedGainPct.toFixed(1)}%`}
              highlight={metrics.equity >= 0 ? "positive" : "negative"}
            />
            <MetricTile
              label="LTV"
              value={metrics.ltv > 0 ? `${metrics.ltv.toFixed(1)}%` : "Schuldenfrei"}
              sub={metrics.ltv > 0 ? `${formatCurrency(metrics.totalLoanBalance, property.currency)} Restschuld` : undefined}
              highlight={metrics.ltv > 70 ? "negative" : metrics.ltv > 60 ? "warning" : undefined}
            />
            <MetricTile
              label="NOI (monatlich)"
              value={`${metrics.netOperatingIncome >= 0 ? "+" : ""}${formatCurrency(metrics.netOperatingIncome, property.currency)}`}
              sub="Vor Kapitaldienst"
              highlight={metrics.netOperatingIncome >= 0 ? "positive" : "negative"}
            />
            <MetricTile
              label="Free Cashflow"
              value={`${metrics.netCashflow >= 0 ? "+" : ""}${formatCurrency(metrics.netCashflow, property.currency)}/mo`}
              sub="Nach Kapitaldienst"
              highlight={metrics.netCashflow >= 0 ? "positive" : "negative"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Valuation card */}
            <ValuationCard property={property} />

            {/* Property details card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Objekt & Kauf</h3>
              <div className="space-y-0">
                {[
                  { label: "Adresse", value: property.address },
                  { label: "Stadt", value: `${property.city}, ${property.country}` },
                  { label: "Kaufdatum", value: formatDate(property.acquisitionDate) },
                  { label: "Kaufpreis", value: formatCurrency(property.acquisitionPrice, property.currency) },
                  {
                    label: "Nebenkosten",
                    value: formatCurrency(property.acquisitionCosts, property.currency),
                  },
                  {
                    label: "Gesamtinvestition",
                    value: formatCurrency(metrics.totalAcquisitionCost, property.currency),
                    bold: true,
                  },
                  ...(property.sqm ? [{ label: "Fläche", value: `${property.sqm} m²` }] : []),
                  ...(property.yearBuilt ? [{ label: "Baujahr", value: String(property.yearBuilt) }] : []),
                  ...(property.energyClass ? [{ label: "Energieklasse", value: property.energyClass }] : []),
                  {
                    label: "Zielmiete",
                    value: `${formatCurrency(property.targetRentMonthly, property.currency)}/mo`,
                  },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className={cn("text-xs", bold ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Yield summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricTile
              label="Bruttomietrendite"
              value={`${metrics.grossYield.toFixed(2)}%`}
              sub="Auf Schätzwert"
            />
            <MetricTile
              label="Nettomietrendite"
              value={`${metrics.netYield.toFixed(2)}%`}
              sub="NOI / Gesamtinvestition"
            />
            <MetricTile
              label="Kaufpreis/m²"
              value={property.sqm ? formatCurrency(property.acquisitionPrice / property.sqm, property.currency) : "—"}
              sub={property.sqm ? `${property.sqm} m²` : undefined}
            />
            <MetricTile
              label="Schätzwert/m²"
              value={property.sqm ? formatCurrency(property.valuation.estimatedValue / property.sqm, property.currency) : "—"}
              sub="Schätzung"
            />
          </div>
        </div>
      )}

      {/* ── Tab: Finanzierung ────────────────────────────────────── */}
      {activeTab === "financing" && (
        <LoanPanel property={property} metrics={metrics} />
      )}

      {/* ── Tab: Cashflow ────────────────────────────────────────── */}
      {activeTab === "cashflow" && (
        <CashflowPanel property={property} metrics={metrics} />
      )}

      {/* ── Tab: Forecast ────────────────────────────────────────── */}
      {activeTab === "forecast" && (
        <PropertyForecast property={property} metrics={metrics} />
      )}
    </div>
  );
}
