"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PositionRow, PortfolioBreakdown } from "@/lib/types";
import { HoldingsTable } from "./HoldingsTable";
import { PortfolioAnalytics } from "./PortfolioAnalytics";
import { PortfolioSignalsRadar } from "./PortfolioSignalsRadar";
import { AddAssetDrawer } from "./AddAssetDrawer";
import { MasterDataDrawer } from "./MasterDataDrawer";
import { useLivePrices, type LivePrice } from "@/hooks/useLivePrices";
import { cn, ASSET_CLASS_LABELS } from "@/lib/utils";
import { Plus, BarChart2, List, X, Zap } from "lucide-react";

type Tab = "positions" | "analytics" | "signals";

interface Props {
  positions: PositionRow[];
  breakdown: PortfolioBreakdown;
  filterClass?: string;
}

export function HoldingsShell({ positions, breakdown, filterClass }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("positions");
  const [addOpen, setAddOpen] = useState(false);
  const [masterDataPos, setMasterDataPos] = useState<PositionRow | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});

  const handlePricesUpdate = useCallback((prices: Record<string, LivePrice>) => {
    setLivePrices(prices);
  }, []);

  useLivePrices(positions, handlePricesUpdate);

  const liveUpdatedAt = Object.values(livePrices)[0]?.lastUpdated ?? null;

  const filtered = useMemo(() => {
    if (!filterClass) return positions;
    return positions.filter(
      (p) => p.assetClass.toLowerCase() === filterClass.toLowerCase()
    );
  }, [positions, filterClass]);

  const filterLabel = filterClass
    ? (ASSET_CLASS_LABELS as Record<string, string>)[filterClass.toUpperCase()] ?? filterClass
    : null;

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Holdings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} Positionen
              {filterLabel ? ` · Filter: ${filterLabel}` : " · alle Depots"}
            </p>
            {filterLabel && (
              <button
                onClick={() => router.push("/dashboard/holdings")}
                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
              >
                <X size={11} /> Filter entfernen
              </button>
            )}
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
            { id: "signals"   as Tab, label: "Signale",    icon: Zap },
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
            positions={filtered}
            livePrices={livePrices}
            liveUpdatedAt={liveUpdatedAt}
            onEditMasterData={setMasterDataPos}
          />
        )}
        {tab === "analytics" && <PortfolioAnalytics breakdown={breakdown} />}
        {tab === "signals" && <PortfolioSignalsRadar positions={filtered} />}
      </div>

      <AddAssetDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <MasterDataDrawer
        open={masterDataPos !== null}
        onClose={() => setMasterDataPos(null)}
        position={masterDataPos}
      />
    </>
  );
}
