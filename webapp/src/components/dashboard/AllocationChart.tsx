"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { AllocationSlice } from "@/lib/types";

interface AllocationChartProps {
  allocations: AllocationSlice[];
  currency: string;
}

export function AllocationChart({ allocations, currency }: AllocationChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Allocation</h2>

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
          >
            {allocations.map((entry) => (
              <Cell key={entry.assetClass} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value), currency), ""]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-2">
        {allocations.map((item) => (
          <div key={item.assetClass} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600 truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-slate-400">{formatPercent(item.percentage)}</span>
              <span className="text-xs font-medium text-slate-700 w-20 text-right">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
