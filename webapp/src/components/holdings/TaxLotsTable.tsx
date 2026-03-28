"use client";

import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { TaxLot, AssetClass } from "@/lib/types";
import { SourceChip } from "@/components/ui/SourceChip";
import { ShieldCheck, ShieldAlert, Info } from "lucide-react";

interface Props {
  lots: TaxLot[];
  assetClass: AssetClass;
  currentPrice: number;
  currency: string;
}

function formatHoldingPeriod(days: number): string {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}M ${days % 30}d`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}J ${months}M` : `${years}J`;
}

function TaxStatusBadge({ lot, assetClass }: { lot: TaxLot; assetClass: AssetClass }) {
  const isCrypto = assetClass === "CRYPTO";

  if (isCrypto && lot.isTaxFreeGermany) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium">
        <ShieldCheck size={10} />
        Steuerfrei (§23)
      </span>
    );
  }

  if (isCrypto && !lot.isTaxFreeGermany) {
    const daysRemaining = 365 - lot.holdingDays;
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium">
        <ShieldAlert size={10} />
        Steuerpflichtig{" "}
        <span className="text-amber-500">({daysRemaining}d bis §23)</span>
      </span>
    );
  }

  // Stocks / ETFs: always Abgeltungsteuer in Germany
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px]">
      Abgeltungsteuer
    </span>
  );
}

export function TaxLotsTable({ lots, assetClass, currentPrice, currency }: Props) {
  const sortedLots = [...lots].sort((a, b) => a.acquiredAt.localeCompare(b.acquiredAt));

  const totalCostBasis = sortedLots.reduce((s, l) => s + l.costBasisTotal, 0);
  const totalCurrentValue = sortedLots.reduce((s, l) => s + l.currentValue, 0);
  const totalGain = totalCurrentValue - totalCostBasis;
  const totalGainPct = totalCostBasis > 0 ? (totalGain / totalCostBasis) * 100 : 0;
  const totalQty = sortedLots.reduce((s, l) => s + l.quantity, 0);

  const isCrypto = assetClass === "CRYPTO";
  const taxFreeGain = sortedLots.filter((l) => l.isTaxFreeGermany).reduce((s, l) => s + l.unrealizedGain, 0);
  const taxableGain = sortedLots.filter((l) => !l.isTaxFreeGermany).reduce((s, l) => s + Math.max(0, l.unrealizedGain), 0);

  if (sortedLots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Keine Kauflots vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Crypto tax summary */}
      {isCrypto && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1">
              <ShieldCheck size={12} /> Steuerfreier Gewinn (§23 EStG)
            </p>
            <p className="text-lg font-bold text-emerald-700">
              {taxFreeGain >= 0 ? "+" : ""}{formatCurrency(taxFreeGain, currency)}
            </p>
            <p className="text-[10px] text-emerald-500 mt-0.5">Lots gehalten &gt; 365 Tage</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
              <ShieldAlert size={12} /> Steuerpflichtiger Gewinn
            </p>
            <p className="text-lg font-bold text-amber-700">
              {taxableGain >= 0 ? "+" : ""}{formatCurrency(taxableGain, currency)}
            </p>
            <p className="text-[10px] text-amber-500 mt-0.5">Lots gehalten ≤ 365 Tage</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kaufdatum</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Anzahl</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Einstand/St.</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Aktuell/St.</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">G&V</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Haltedauer</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Steuer</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hidden lg:table-cell">Quelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedLots.map((lot) => {
                const isGain = lot.unrealizedGain >= 0;
                return (
                  <tr key={lot.id} className={cn(
                    "transition-colors",
                    lot.isTaxFreeGermany ? "bg-emerald-50/20" : ""
                  )}>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap font-medium">
                      {formatDate(lot.acquiredAt)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-slate-600 font-mono">
                      {isCrypto ? lot.quantity.toFixed(4) : lot.quantity.toLocaleString("de-DE")}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-slate-600 font-mono">
                      {formatCurrency(lot.costBasisPerShare, currency, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-slate-600 font-mono">
                      {formatCurrency(lot.currentPrice, currency, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isGain ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {isGain ? "+" : ""}{lot.unrealizedGainPct.toFixed(1)}%
                        </span>
                        <span className={`text-[10px] mt-0.5 ${isGain ? "text-emerald-600" : "text-red-500"}`}>
                          {isGain ? "+" : ""}{formatCurrency(lot.unrealizedGain, currency)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell">
                      <span className={`text-xs ${lot.isLongTerm ? "text-slate-600" : "text-amber-600"}`}>
                        {formatHoldingPeriod(lot.holdingDays)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TaxStatusBadge lot={lot} assetClass={assetClass} />
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <SourceChip source={lot.source} compact />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals */}
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                  {sortedLots.length} Lot{sortedLots.length !== 1 ? "s" : ""}
                </td>
                <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700 font-mono">
                  {isCrypto ? totalQty.toFixed(4) : totalQty.toLocaleString("de-DE")}
                </td>
                <td className="px-3 py-3 text-right text-xs text-slate-500 font-mono">
                  {formatCurrency(totalCostBasis / totalQty, currency, { maximumFractionDigits: 2 })}
                  <span className="block text-[10px] text-slate-400">Ø Einstand</span>
                </td>
                <td className="px-3 py-3 text-right text-xs text-slate-500 font-mono">
                  {formatCurrency(currentPrice, currency, { maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${totalGain >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {totalGain >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${totalGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain, currency)}
                  </span>
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* FIFO note */}
      <p className="text-[10px] text-slate-400 flex items-center gap-1">
        <Info size={11} />
        Lots sortiert nach Kaufdatum (FIFO). Steuerliche Berechnung dient nur der Orientierung — kein Steuerrat.
      </p>
    </div>
  );
}
