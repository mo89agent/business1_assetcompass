"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import type { PropertyValuation, PropertyRecord } from "@/lib/types";
import { AlertCircle, CheckCircle2, Info, MinusCircle } from "lucide-react";
import { SourceChip } from "@/components/ui/SourceChip";

const METHOD_LABELS: Record<PropertyValuation["method"], string> = {
  purchase_price: "Kaufpreis",
  broker_appraisal: "Makler-Gutachten",
  bank_valuation: "Bankbewertung",
  online_tool: "Online-Schätzwerkzeug",
  self_estimated: "Eigene Schätzung",
};

const CONFIDENCE_CONFIG: Record<
  PropertyValuation["confidence"],
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  high: {
    label: "Hoch",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-100",
    icon: CheckCircle2,
  },
  medium: {
    label: "Mittel",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-100",
    icon: MinusCircle,
  },
  low: {
    label: "Niedrig",
    color: "text-red-700",
    bg: "bg-red-50 border-red-100",
    icon: AlertCircle,
  },
};

interface Props {
  property: PropertyRecord;
}

export function ValuationCard({ property }: Props) {
  const { valuation, acquisitionPrice, acquisitionCosts, currency } = property;
  const totalAcquisitionCost = acquisitionPrice + acquisitionCosts;
  const conf = CONFIDENCE_CONFIG[valuation.confidence];
  const ConfIcon = conf.icon;

  // Calculate position of mid-value on the range bar (0–100%)
  const range = valuation.valueHigh - valuation.valueLow;
  const midPct = range > 0
    ? ((valuation.estimatedValue - valuation.valueLow) / range) * 100
    : 50;

  const gainVsAcquisition = valuation.estimatedValue - totalAcquisitionCost;
  const gainPct = totalAcquisitionCost > 0
    ? (gainVsAcquisition / totalAcquisitionCost) * 100
    : 0;

  // How stale is the valuation?
  const daysSinceValuation = Math.floor(
    (new Date("2026-03-28").getTime() - new Date(valuation.asOf).getTime()) / 86_400_000
  );
  const monthsSince = Math.floor(daysSinceValuation / 30);
  const isStale = daysSinceValuation > 180;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Marktwert</h3>
        <SourceChip source={valuation.source} />
      </div>

      {/* Main value — shown as range, not single number */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-3xl font-bold text-slate-900">
            {formatCurrency(valuation.estimatedValue, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Schätzwert (Mitte)</p>
        </div>

        {/* Range bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Niedrig</span>
            <span>Hoch</span>
          </div>
          <div className="relative h-5 bg-slate-100 rounded-full overflow-visible">
            {/* Filled range */}
            <div className="absolute inset-y-0 left-0 right-0 bg-orange-100 rounded-full" />
            {/* Center marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm z-10"
              style={{ left: `calc(${midPct}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-sm font-semibold text-slate-600">
            <span>{formatCurrency(valuation.valueLow, currency)}</span>
            <span>{formatCurrency(valuation.valueHigh, currency)}</span>
          </div>
        </div>
      </div>

      {/* Confidence + method */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${conf.bg}`}>
        <ConfIcon size={13} className={conf.color} />
        <span className={`text-xs font-medium ${conf.color}`}>
          Konfidenz: {conf.label}
        </span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-500">{METHOD_LABELS[valuation.method]}</span>
      </div>

      {/* Staleness warning */}
      {isStale && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
          <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Bewertung ist <strong>{monthsSince} Monate alt</strong> (Stand: {formatDate(valuation.asOf)}).
            Empfehlung: Wert aktualisieren.
          </p>
        </div>
      )}

      {/* Valuation notes */}
      {valuation.notes && (
        <p className="text-xs text-slate-400 italic">{valuation.notes}</p>
      )}

      {/* vs acquisition */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Gesamterwerbskosten</p>
          <p className="text-sm font-semibold text-slate-700">{formatCurrency(totalAcquisitionCost, currency)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {formatCurrency(acquisitionPrice, currency)} + {formatCurrency(acquisitionCosts, currency)} NK
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Buchgewinn</p>
          <p className={`text-sm font-semibold ${gainVsAcquisition >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {gainVsAcquisition >= 0 ? "+" : ""}{formatCurrency(gainVsAcquisition, currency)}
          </p>
          <p className={`text-[10px] mt-0.5 ${gainVsAcquisition >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}% auf Gesamtkosten
          </p>
        </div>
      </div>

      <p className="text-[10px] text-slate-300">
        Kein verbindlicher Wert — nur zur eigenen Orientierung.
        Keine Haftung für Entscheidungen auf Basis dieser Schätzung.
      </p>
    </div>
  );
}
