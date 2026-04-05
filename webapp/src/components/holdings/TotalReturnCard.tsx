"use client";

import { formatCurrency, formatPercent } from "@/lib/utils";
import type { PositionRow, PositionDividend } from "@/lib/types";
import { Info } from "lucide-react";

interface Props {
  position: PositionRow;
  dividends: PositionDividend[];
}

export function TotalReturnCard({ position, dividends }: Props) {
  const totalDividendsReceived = dividends
    .filter((d) => !d.isProjected)
    .reduce((sum, d) => sum + d.totalAmount, 0);

  const priceReturn = position.bookValue > 0
    ? (position.unrealizedGain / position.bookValue) * 100
    : 0;

  const dividendReturn = position.bookValue > 0
    ? (totalDividendsReceived / position.bookValue) * 100
    : 0;

  const totalReturn = priceReturn + dividendReturn;
  const isPositive = totalReturn >= 0;

  // Bar widths: split the total return bar proportionally
  const absTotal = Math.abs(priceReturn) + Math.abs(dividendReturn);
  const priceBarPct = absTotal > 0 ? (Math.abs(priceReturn) / absTotal) * 100 : 50;
  const divBarPct = absTotal > 0 ? (Math.abs(dividendReturn) / absTotal) * 100 : 50;

  const rows = [
    {
      label: "Kursgewinn",
      value: position.unrealizedGain,
      pct: priceReturn,
      color: "bg-blue-500",
      textColor: priceReturn >= 0 ? "text-emerald-700" : "text-red-600",
    },
    {
      label: "Dividenden",
      value: totalDividendsReceived,
      pct: dividendReturn,
      color: "bg-yellow-400",
      textColor: "text-yellow-700",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Total Return</h3>
        <span className="flex items-center gap-1 text-[10px] text-slate-400 cursor-help group relative">
          <Info size={11} />
          Basis: Einstandswert
          <span className="hidden group-hover:block absolute right-0 top-5 z-10 bg-slate-800 text-white text-[10px] rounded px-2 py-1 w-48 shadow-lg">
            Alle Renditen basieren auf dem durchschnittlichen Einstandswert (Buchwert).
          </span>
        </span>
      </div>

      {/* Big number */}
      <div>
        <span className={`text-3xl font-bold ${isPositive ? "text-emerald-700" : "text-red-600"}`}>
          {isPositive ? "+" : ""}{totalReturn.toFixed(2)}%
        </span>
        <span className="ml-2 text-sm text-slate-400">
          ({isPositive ? "+" : ""}{formatCurrency(position.unrealizedGain + totalDividendsReceived, position.currency)})
        </span>
      </div>

      {/* Stacked bar */}
      <div className="space-y-1">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Zusammensetzung</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 gap-0.5">
          <div
            className={`h-full rounded-l-full transition-all ${priceReturn >= 0 ? "bg-blue-500" : "bg-red-400"}`}
            style={{ width: `${priceBarPct}%` }}
          />
          {dividendReturn > 0 && (
            <div
              className="h-full rounded-r-full bg-yellow-400 transition-all"
              style={{ width: `${divBarPct}%` }}
            />
          )}
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-sm ${row.color}`} />
              <span className="text-xs text-slate-600">{row.label}</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold ${row.textColor}`}>
                {row.pct >= 0 ? "+" : ""}{row.pct.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-400 ml-1">
                ({row.value >= 0 ? "+" : ""}{formatCurrency(row.value, position.currency)})
              </span>
            </div>
          </div>
        ))}

        <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Total Return</span>
          <span className={`text-xs font-bold ${isPositive ? "text-emerald-700" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{totalReturn.toFixed(2)}%
          </span>
        </div>
      </div>

      {dividends.filter((d) => !d.isProjected).length === 0 && (
        <p className="text-[10px] text-slate-400 italic">
          Keine Dividendenbuchungen vorhanden — nur Kursrendite berücksichtigt.
        </p>
      )}
    </div>
  );
}
