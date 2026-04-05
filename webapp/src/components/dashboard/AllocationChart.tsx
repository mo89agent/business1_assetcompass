"use client";

import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { AllocationSlice } from "@/lib/types";

interface AllocationChartProps {
  allocations: AllocationSlice[];
  currency: string;
}

export function AllocationChart({ allocations, currency }: AllocationChartProps) {
  const router = useRouter();

  function handleClick(assetClass: string) {
    router.push(`/dashboard/holdings?filter=${assetClass}`);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Allocation</h2>
        <span className="text-[10px] text-slate-400">Klicken zum Filtern</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={allocations}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            onClick={(d) => handleClick((d as unknown as { assetClass: string }).assetClass)}
            cursor="pointer"
          >
            {allocations.map((entry) => (
              <Cell key={entry.assetClass} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, props) => [
              formatCurrency(Number(value), currency),
              props?.payload?.label ?? "",
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-1">
        {allocations.map((item) => (
          <button
            key={item.assetClass}
            onClick={() => handleClick(item.assetClass)}
            className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600 truncate group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-slate-400">{formatPercent(item.percentage)}</span>
              <span className="text-xs font-medium text-slate-700 w-20 text-right">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
