"use client";

import { useState } from "react";
import { cn, formatCurrency, formatPercent, formatNumber, gainColor, gainBg, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from "@/lib/utils";
import type { PositionRow } from "@/lib/types";

interface HoldingsTableProps {
  positions: PositionRow[];
}

type SortKey = "name" | "marketValue" | "unrealizedGainPct" | "weight" | "assetClass";

export function HoldingsTable({ positions }: HoldingsTableProps) {
  const [sort, setSort] = useState<SortKey>("marketValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<string | null>(null);

  const assetClasses = [...new Set(positions.map((p) => p.assetClass))];

  const filtered = filter ? positions.filter((p) => p.assetClass === filter) : positions;
  const sorted = [...filtered].sort((a, b) => {
    const mult = sortDir === "asc" ? 1 : -1;
    if (sort === "name") return mult * a.name.localeCompare(b.name);
    if (sort === "assetClass") return mult * a.assetClass.localeCompare(b.assetClass);
    return mult * (a[sort] - b[sort]);
  });

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(key); setSortDir("desc"); }
  }

  const totalValue = sorted.reduce((s, p) => s + p.marketValue, 0);
  const totalGain = sorted.reduce((s, p) => s + p.unrealizedGain, 0);
  const totalBook = sorted.reduce((s, p) => s + p.bookValue, 0);
  const totalGainPct = totalBook > 0 ? (totalGain / totalBook) * 100 : 0;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn(
        "text-xs font-medium uppercase tracking-wide hover:text-slate-700 transition",
        sort === k ? "text-slate-800" : "text-slate-400"
      )}
    >
      {label}
      {sort === k && <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition",
            filter === null ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          All ({positions.length})
        </button>
        {assetClasses.map((ac) => (
          <button
            key={ac}
            onClick={() => setFilter(filter === ac ? null : ac)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1",
              filter === ac ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }}
            />
            {ASSET_CLASS_LABELS[ac]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-2.5">
                <SortBtn k="name" label="Asset" />
              </th>
              <th className="text-left px-3 py-2.5 hidden md:table-cell">
                <SortBtn k="assetClass" label="Class" />
              </th>
              <th className="text-right px-3 py-2.5 hidden lg:table-cell">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Qty</span>
              </th>
              <th className="text-right px-3 py-2.5 hidden lg:table-cell">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Avg Cost</span>
              </th>
              <th className="text-right px-3 py-2.5">
                <SortBtn k="marketValue" label="Value" />
              </th>
              <th className="text-right px-3 py-2.5">
                <SortBtn k="unrealizedGainPct" label="Gain/Loss" />
              </th>
              <th className="text-right px-4 py-2.5 hidden md:table-cell">
                <SortBtn k="weight" label="Weight" />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {sorted.map((pos) => (
              <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                {/* Asset name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: ASSET_CLASS_COLORS[pos.assetClass] + "33", color: ASSET_CLASS_COLORS[pos.assetClass] }}
                    >
                      {(pos.ticker ?? pos.name.slice(0, 3)).slice(0, 4)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{pos.name}</p>
                      <p className="text-xs text-slate-400">{pos.accountName}</p>
                    </div>
                  </div>
                </td>

                {/* Class */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: ASSET_CLASS_COLORS[pos.assetClass] + "20",
                      color: ASSET_CLASS_COLORS[pos.assetClass],
                    }}
                  >
                    {ASSET_CLASS_LABELS[pos.assetClass]}
                  </span>
                </td>

                {/* Quantity */}
                <td className="px-3 py-3 text-right hidden lg:table-cell">
                  <span className="text-sm text-slate-600">
                    {formatNumber(pos.quantity, pos.assetClass === "CRYPTO" ? 4 : 0)}
                  </span>
                </td>

                {/* Avg cost */}
                <td className="px-3 py-3 text-right hidden lg:table-cell">
                  <span className="text-sm text-slate-600">
                    {formatCurrency(pos.avgCostBasis, pos.currency, { maximumFractionDigits: 2 })}
                  </span>
                </td>

                {/* Market value */}
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(pos.marketValue, pos.currency)}
                  </span>
                </td>

                {/* Gain/loss */}
                <td className="px-3 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        gainBg(pos.unrealizedGain)
                      )}
                    >
                      {pos.unrealizedGain >= 0 ? "+" : ""}
                      {formatPercent(pos.unrealizedGainPct)}
                    </span>
                    <span className={cn("text-xs mt-0.5", gainColor(pos.unrealizedGain))}>
                      {pos.unrealizedGain >= 0 ? "+" : ""}
                      {formatCurrency(pos.unrealizedGain, pos.currency)}
                    </span>
                  </div>
                </td>

                {/* Weight */}
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(pos.weight * 5, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">
                      {pos.weight.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Totals */}
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-4 py-3 text-sm font-semibold text-slate-700" colSpan={4}>
                Total ({sorted.length} positions)
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-slate-900">
                {formatCurrency(totalValue, "EUR")}
              </td>
              <td className="px-3 py-3 text-right">
                <span
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    gainBg(totalGain)
                  )}
                >
                  {totalGain >= 0 ? "+" : ""}
                  {formatPercent(totalGainPct)}
                </span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
