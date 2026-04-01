import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  xirrRate: number | null;
  isDemo?: boolean;
  className?: string;
}

export function IrrCard({ xirrRate, isDemo, className }: Props) {
  const pct = xirrRate !== null ? xirrRate * 100 : null;
  const isPositive = pct !== null && pct >= 0;

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Interner Zinsfuß (XIRR)
        </p>
        <span
          title="Annualisierte, kapitalgewichtete Rendite aller externen Zahlungsströme (Einzahlungen/Entnahmen) + aktueller Portfoliowert."
          className="text-slate-300 hover:text-slate-500 transition cursor-help"
        >
          <Info size={13} />
        </span>
      </div>

      {/* Value */}
      {pct !== null ? (
        <p className={cn("text-2xl font-bold tracking-tight mt-1", isPositive ? "text-emerald-700" : "text-red-600")}>
          {isPositive ? "+" : ""}
          {pct.toFixed(2)}&thinsp;% p.a.
        </p>
      ) : (
        <p className="text-2xl font-bold tracking-tight mt-1 text-slate-300">—</p>
      )}

      {/* Trend icon + label */}
      {pct !== null ? (
        <div className="flex items-center gap-1.5 mt-1">
          {isPositive
            ? <TrendingUp size={13} className="text-emerald-500" />
            : <TrendingDown size={13} className="text-red-500" />
          }
          <span className="text-xs text-slate-400">
            {isDemo ? "Demo-Daten (Sparplan seit 2023)" : "Kapitalgewichtete Rendite"}
          </span>
        </div>
      ) : (
        <p className="text-xs text-slate-400 mt-1">Nicht genug Transaktionsdaten</p>
      )}

      {/* Tooltip explanation */}
      <p className="text-[10px] text-slate-400 leading-snug mt-1">
        Berücksichtigt: Einzahlungen · Entnahmen · aktuellen Portfoliowert
      </p>
    </div>
  );
}
