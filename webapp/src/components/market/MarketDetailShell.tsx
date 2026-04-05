"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FundamentalsPanel } from "@/components/holdings/FundamentalsPanel";
import { AssetPriceChart } from "@/components/holdings/AssetPriceChart";
import { SignalsPanel } from "@/components/holdings/SignalsPanel";
import { MarketEtfPanel } from "@/components/market/MarketEtfPanel";
import { AddAssetDrawer } from "@/components/holdings/AddAssetDrawer";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  symbol: string;
}

type Tab = "fundamentals" | "chart" | "signals" | "etf";

const TABS: { id: Tab; label: string }[] = [
  { id: "fundamentals", label: "Fundamentals" },
  { id: "chart",        label: "Kurschart" },
  { id: "signals",      label: "Signale & Qualität" },
  { id: "etf",          label: "ETF-Details" },
];

export function MarketDetailShell({ symbol }: Props) {
  const [tab, setTab] = useState<Tab>("fundamentals");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/holdings"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft size={14} />
              Holdings
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">{symbol}</span>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={14} />
            Zum Portfolio hinzufügen
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap",
                tab === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "fundamentals" && (
          <FundamentalsPanel symbol={symbol} />
        )}

        {tab === "chart" && (
          <AssetPriceChart
            ticker={symbol}
            assetClass="STOCK"
            currency="USD"
            name={symbol}
            avgCostBasis={0}
          />
        )}

        {tab === "signals" && (
          <SignalsPanel ticker={symbol} name={symbol} />
        )}

        {tab === "etf" && (
          <MarketEtfPanel symbol={symbol} />
        )}
      </div>

      <AddAssetDrawer open={addOpen} onClose={() => setAddOpen(false)} prefillSymbol={symbol} />
    </>
  );
}
