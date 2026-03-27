import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getDemoPositions } from "@/lib/data/holdings";
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, formatCurrency, formatPercent, gainColor } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const positions = await getDemoPositions();
  const pos = positions.find((p) => p.id === id);
  return { title: pos ? `${pos.name} · Holdings` : "Position" };
}

export default async function HoldingDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const positions = await getDemoPositions();
  const pos = positions.find((p) => p.id === id);
  if (!pos) notFound();

  const color = ASSET_CLASS_COLORS[pos.assetClass];
  const isGain = pos.unrealizedGain >= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/holdings" className="hover:text-slate-700 flex items-center gap-1 transition">
          <ChevronLeft size={14} />
          Holdings
        </Link>
        <span>/</span>
        <span className="text-slate-700">{pos.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: color + "22", color }}
          >
            {(pos.ticker ?? pos.name.slice(0, 4)).slice(0, 4)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">{pos.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {pos.ticker && (
                <span className="text-sm text-slate-400 font-mono">{pos.ticker}</span>
              )}
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: color + "22", color }}
              >
                {ASSET_CLASS_LABELS[pos.assetClass]}
              </span>
              <span className="text-xs text-slate-400">{pos.accountName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(pos.marketValue, pos.currency)}
            </p>
            <p className={`text-sm font-medium mt-0.5 ${isGain ? "text-emerald-600" : "text-red-600"}`}>
              {isGain ? "+" : ""}{formatCurrency(pos.unrealizedGain, pos.currency)}{" "}
              ({isGain ? "+" : ""}{formatPercent(pos.unrealizedGainPct)})
            </p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Quantity", value: pos.quantity.toLocaleString("de-DE") },
          { label: "Avg. Cost", value: formatCurrency(pos.avgCostBasis, pos.currency, { maximumFractionDigits: 2 }) },
          { label: "Book Value", value: formatCurrency(pos.bookValue, pos.currency) },
          { label: "Current Price", value: formatCurrency(pos.currentPrice, pos.currency, { maximumFractionDigits: 2 }) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Price History</h2>
        <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg text-sm text-slate-400">
          Chart coming soon — Yahoo Finance integration
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Transactions</h2>
        <div className="h-24 flex items-center justify-center bg-slate-50 rounded-lg text-sm text-slate-400">
          Transaction history for this position
        </div>
      </div>
    </div>
  );
}
