import Link from "next/link";
import { cn, formatCurrency, formatPercent, gainColor, ASSET_CLASS_LABELS } from "@/lib/utils";
import type { PositionRow } from "@/lib/types";

interface TopHoldingsProps {
  positions: PositionRow[];
  currency: string;
}

export function TopHoldings({ positions, currency }: TopHoldingsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Top Holdings</h2>
        <Link
          href="/dashboard/holdings"
          className="text-xs text-blue-600 hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {positions.map((pos) => (
          <div key={pos.id} className="flex items-center gap-3">
            {/* Ticker badge */}
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-700">
                {(pos.ticker ?? pos.name.slice(0, 3)).slice(0, 4)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800 truncate">
                  {pos.name}
                </span>
                <span className="text-sm font-semibold text-slate-900 ml-2 shrink-0">
                  {formatCurrency(pos.marketValue, pos.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-slate-400">
                  {ASSET_CLASS_LABELS[pos.assetClass]} · {pos.weight.toFixed(1)}%
                </span>
                <span
                  className={cn(
                    "text-xs font-medium shrink-0",
                    gainColor(pos.unrealizedGainPct)
                  )}
                >
                  {pos.unrealizedGainPct >= 0 ? "+" : ""}
                  {formatPercent(pos.unrealizedGainPct)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
        <span>Total portfolio value</span>
        <span className="font-medium text-slate-700">
          {formatCurrency(
            positions.reduce((s, p) => s + p.marketValue, 0),
            currency
          )}
        </span>
      </div>
    </div>
  );
}
