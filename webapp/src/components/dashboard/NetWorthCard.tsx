import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NetWorthCardProps {
  title: string;
  value: number;
  currency?: string;
  change?: number;
  changePct?: number;
  subtitle?: string;
  negative?: boolean;
  className?: string;
}

export function NetWorthCard({
  title,
  value,
  currency = "EUR",
  change,
  changePct,
  subtitle,
  negative = false,
  className,
}: NetWorthCardProps) {
  const hasChange = change !== undefined && changePct !== undefined;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1",
        className
      )}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>

      <p
        className={cn(
          "text-2xl font-bold tracking-tight mt-1",
          negative ? "text-red-600" : "text-slate-900"
        )}
      >
        {negative ? "−" : ""}
        {formatCurrency(Math.abs(value), currency)}
      </p>

      {hasChange && (
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? (
            <TrendingUp size={13} className="text-emerald-600" />
          ) : (
            <TrendingDown size={13} className="text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              isPositive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(change!, currency)} ({isPositive ? "+" : ""}
            {formatPercent(changePct!)})
          </span>
          <span className="text-xs text-slate-400">30d</span>
        </div>
      )}

      {subtitle && !hasChange && (
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
