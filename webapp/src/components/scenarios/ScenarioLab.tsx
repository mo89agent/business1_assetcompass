"use client";

import { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";

const PRESET_SCENARIOS = [
  {
    id: "equity_crash",
    name: "Equity Crash",
    description: "2008-style equity market decline",
    icon: "📉",
    params: { equityShock: -40, cryptoShock: -60, realEstateShock: -15, interestRateChange: 0 },
  },
  {
    id: "crypto_crash",
    name: "Crypto Winter",
    description: "Deep crypto bear market",
    icon: "🥶",
    params: { equityShock: -10, cryptoShock: -80, realEstateShock: 0, interestRateChange: 0 },
  },
  {
    id: "rate_shock",
    name: "Rate Shock +300bps",
    description: "Rapid interest rate increase",
    icon: "📈",
    params: { equityShock: -20, cryptoShock: -30, realEstateShock: -20, interestRateChange: 3 },
  },
  {
    id: "inflation",
    name: "Inflation Shock",
    description: "Persistent high inflation scenario",
    icon: "🔥",
    params: { equityShock: -15, cryptoShock: 20, realEstateShock: 10, interestRateChange: 2 },
  },
  {
    id: "mild_downturn",
    name: "Mild Correction",
    description: "Normal market correction",
    icon: "📊",
    params: { equityShock: -15, cryptoShock: -25, realEstateShock: -5, interestRateChange: 0 },
  },
];

// Demo portfolio values
const DEMO_PORTFOLIO = {
  equity: 505000,
  crypto: 65000,
  realEstate: 350000, // market value (property)
  cash: 85000,
  gold: 45000,
  liabilities: 145000,
};

function calcImpact(params: { equityShock: number; cryptoShock: number; realEstateShock: number; interestRateChange: number }) {
  const equityAfter = DEMO_PORTFOLIO.equity * (1 + params.equityShock / 100);
  const cryptoAfter = DEMO_PORTFOLIO.crypto * (1 + params.cryptoShock / 100);
  const realEstateAfter = DEMO_PORTFOLIO.realEstate * (1 + params.realEstateShock / 100);
  const cashAfter = DEMO_PORTFOLIO.cash;
  const goldAfter = DEMO_PORTFOLIO.gold * (params.equityShock < -20 ? 1.05 : 1); // gold as safe haven
  const liabilitiesAfter = DEMO_PORTFOLIO.liabilities * (1 + Math.max(params.interestRateChange * 0.02, 0));

  const totalAssets = equityAfter + cryptoAfter + realEstateAfter + cashAfter + goldAfter;
  const netWorthAfter = totalAssets - liabilitiesAfter;
  const totalAssetsBefore = Object.values(DEMO_PORTFOLIO).slice(0, 5).reduce((a, b) => a + b, 0);
  const netWorthBefore = totalAssetsBefore - DEMO_PORTFOLIO.liabilities;
  const delta = netWorthAfter - netWorthBefore;
  const deltaPct = (delta / netWorthBefore) * 100;

  return { netWorthAfter, netWorthBefore, delta, deltaPct, equityAfter, cryptoAfter, realEstateAfter };
}

export function ScenarioLab() {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState({
    equityShock: 0,
    cryptoShock: 0,
    realEstateShock: 0,
    interestRateChange: 0,
  });

  const activeParams =
    selected === "custom"
      ? custom
      : PRESET_SCENARIOS.find((s) => s.id === selected)?.params ?? null;

  const result = activeParams ? calcImpact(activeParams) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scenario selector */}
      <div className="lg:col-span-1 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Preset Scenarios</h2>
        {PRESET_SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(selected === s.id ? null : s.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition ${
              selected === s.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>
            </div>
          </button>
        ))}

        {/* Custom scenario */}
        <div className={`bg-white rounded-xl border p-4 transition ${selected === "custom" ? "border-blue-500" : "border-slate-200"}`}>
          <button
            onClick={() => setSelected(selected === "custom" ? null : "custom")}
            className="w-full text-left"
          >
            <p className="text-sm font-semibold text-slate-800 mb-1">⚙️ Custom Scenario</p>
          </button>

          {selected === "custom" && (
            <div className="space-y-3 mt-3">
              {[
                { key: "equityShock", label: "Equity shock (%)" },
                { key: "cryptoShock", label: "Crypto shock (%)" },
                { key: "realEstateShock", label: "Real estate shock (%)" },
                { key: "interestRateChange", label: "Rate change (bps)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-slate-500">{label}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min={key === "interestRateChange" ? 0 : -80}
                      max={key === "interestRateChange" ? 10 : 30}
                      value={custom[key as keyof typeof custom]}
                      onChange={(e) => setCustom((c) => ({ ...c, [key]: Number(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-right text-slate-700">
                      {custom[key as keyof typeof custom]}
                      {key === "interestRateChange" ? "%" : "%"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-2">
        {result ? (
          <div className="space-y-4">
            {/* Summary card */}
            <div className={`rounded-xl p-6 border ${result.delta < 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
              <p className="text-sm text-slate-600 mb-1">Net Worth Impact</p>
              <div className="flex items-baseline gap-3">
                <span className={`text-3xl font-bold ${result.delta < 0 ? "text-red-700" : "text-emerald-700"}`}>
                  {result.delta >= 0 ? "+" : ""}
                  {formatCurrency(result.delta, "EUR")}
                </span>
                <span className={`text-lg font-semibold ${result.delta < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  ({result.deltaPct >= 0 ? "+" : ""}{result.deltaPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-slate-500">Before: </span>
                  <span className="font-medium">{formatCurrency(result.netWorthBefore, "EUR")}</span>
                </div>
                <div>
                  <span className="text-slate-500">After: </span>
                  <span className="font-medium">{formatCurrency(result.netWorthAfter, "EUR")}</span>
                </div>
              </div>
            </div>

            {/* By asset class */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Impact by Asset Class</h3>
              <div className="space-y-3">
                {[
                  { label: "Equities", before: DEMO_PORTFOLIO.equity, after: result.equityAfter, color: "#3b82f6" },
                  { label: "Crypto", before: DEMO_PORTFOLIO.crypto, after: result.cryptoAfter, color: "#f59e0b" },
                  { label: "Real Estate", before: DEMO_PORTFOLIO.realEstate, after: result.realEstateAfter, color: "#f97316" },
                ].map((item) => {
                  const delta = item.after - item.before;
                  const deltaPct = (delta / item.before) * 100;
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{item.label}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-slate-900">
                              {formatCurrency(item.after, "EUR")}
                            </span>
                            <span className={`ml-2 text-xs font-medium ${delta < 0 ? "text-red-600" : "text-emerald-600"}`}>
                              {delta >= 0 ? "+" : ""}{formatPercent(deltaPct)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((item.after / item.before) * 60, 100)}%`,
                              backgroundColor: delta < 0 ? "#ef4444" : item.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-700">
                <strong>Disclaimer:</strong> These are simplified estimates based on direct price shocks. Real outcomes depend on asset correlations, timing, rebalancing, and tax effects. This is informational only — not financial advice.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center h-72">
            <div className="text-center">
              <div className="text-4xl mb-3">🔬</div>
              <p className="text-sm font-medium text-slate-600">Select a scenario to see the impact</p>
              <p className="text-xs text-slate-400 mt-1">Pick a preset or create a custom scenario</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
