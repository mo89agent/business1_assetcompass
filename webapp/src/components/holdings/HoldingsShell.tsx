"use client";

import { useState, useCallback } from "react";
import type { PositionRow, PortfolioBreakdown } from "@/lib/types";
import { HoldingsTable } from "./HoldingsTable";
import { PortfolioAnalytics } from "./PortfolioAnalytics";
import { AddAssetDrawer } from "./AddAssetDrawer";
import { useLivePrices, type LivePrice } from "@/hooks/useLivePrices";
import { cn } from "@/lib/utils";
import { Plus, BarChart2, List } from "lucide-react";

type Tab = "positions" | "analytics";

interface Props {
  positions: PositionRow[];
  breakdown: PortfolioBreakdown;
}

export function HoldingsShell({ positions, breakdown }: Props) {
  const [tab, setTab] = useState<Tab>("positions");
  const [addOpen, setAddOpen] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});

  const handlePricesUpdate = useCallback((prices: Record<string, LivePrice>) => {
    setLivePrices(prices);
  }, []);

  useLivePrices(positions, handlePricesUpdate);

  const liveUpdatedAt = Object.values(livePrices)[0]?.lastUpdated ?? null;

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Holdings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {positions.length} Positionen · alle Depots
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0"
          >
            <Plus size={14} />
            Position hinzufügen
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {([
            { id: "positions" as Tab, label: "Positionen", icon: List },
            { id: "analytics" as Tab, label: "Analyse",    icon: BarChart2 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition",
                tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {tab === "positions" && (
          <HoldingsTable
            positions={positions}
            livePrices={livePrices}
            liveUpdatedAt={liveUpdatedAt}
          />
        )}
        {tab === "analytics" && <PortfolioAnalytics breakdown={breakdown} />}
      </div>

      <AddAssetDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
