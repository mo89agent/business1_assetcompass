import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatPercent } from "@/lib/utils";

export const metadata = { title: "Real Estate" };

const DEMO_PROPERTIES = [
  {
    id: "p1",
    name: "Berliner Str. 12, Wohnung A",
    city: "Berlin",
    type: "Residential Rental",
    acquisitionPrice: 320000,
    currentValue: 385000,
    loanRemaining: 198000,
    targetRent: 1450,
    actualRent: 1450,
    vacancyRate: 0,
    operatingCosts: 280,
    equity: 187000,
    grossYield: 5.38,
    netYield: 4.27,
    ltv: 51.4,
    fixedRateUntil: "2026-05-01",
    energyClass: "C",
  },
  {
    id: "p2",
    name: "Hauptstr. 7, Gewerbeeinheit",
    city: "München",
    type: "Commercial",
    acquisitionPrice: 480000,
    currentValue: 530000,
    loanRemaining: 0,
    targetRent: 2100,
    actualRent: 2100,
    vacancyRate: 0,
    operatingCosts: 450,
    equity: 530000,
    grossYield: 5.25,
    netYield: 4.12,
    ltv: 0,
    fixedRateUntil: null,
    energyClass: "B",
  },
];

export default async function RealEstatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const totalValue = DEMO_PROPERTIES.reduce((s, p) => s + p.currentValue, 0);
  const totalEquity = DEMO_PROPERTIES.reduce((s, p) => s + p.equity, 0);
  const totalRent = DEMO_PROPERTIES.reduce((s, p) => s + p.actualRent, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Real Estate</h1>
          <p className="text-sm text-slate-500 mt-0.5">{DEMO_PROPERTIES.length} properties</p>
        </div>
        <button className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition">
          + Add property
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Portfolio Value", value: formatCurrency(totalValue, "EUR") },
          { label: "Total Equity", value: formatCurrency(totalEquity, "EUR") },
          { label: "Monthly Rent", value: formatCurrency(totalRent, "EUR") + "/mo" },
          { label: "Properties", value: String(DEMO_PROPERTIES.length) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Property cards */}
      <div className="space-y-4">
        {DEMO_PROPERTIES.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{p.name}</h2>
                <p className="text-sm text-slate-500">{p.city} · {p.type} · Energy: {p.energyClass}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.fixedRateUntil && new Date(p.fixedRateUntil) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                  <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
                    ⚠ Rate expires {new Date(p.fixedRateUntil).toLocaleDateString("de-DE")}
                  </span>
                )}
                <button className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">
                  Details
                </button>
              </div>
            </div>

            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { label: "Current Value", value: formatCurrency(p.currentValue, "EUR") },
                { label: "Acquisition", value: formatCurrency(p.acquisitionPrice, "EUR") },
                { label: "Equity", value: formatCurrency(p.equity, "EUR") },
                { label: "Loan", value: p.loanRemaining > 0 ? formatCurrency(p.loanRemaining, "EUR") : "Debt-free" },
                { label: "Gross Yield", value: `${p.grossYield.toFixed(2)}%` },
                { label: "Net Yield", value: `${p.netYield.toFixed(2)}%` },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs text-slate-400">{m.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Cashflow mini bar */}
            <div className="px-6 pb-4">
              <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-500">Target rent: </span>
                  <span className="font-medium text-slate-700">{formatCurrency(p.targetRent, "EUR")}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500">Actual rent: </span>
                  <span className="font-medium text-emerald-700">{formatCurrency(p.actualRent, "EUR")}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500">Operating costs: </span>
                  <span className="font-medium text-slate-700">−{formatCurrency(p.operatingCosts, "EUR")}/mo</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500">Net cashflow: </span>
                  <span className="font-medium text-emerald-700">+{formatCurrency(p.actualRent - p.operatingCosts, "EUR")}/mo</span>
                </div>
                {p.ltv > 0 && (
                  <div>
                    <span className="text-slate-500">LTV: </span>
                    <span className={`font-medium ${p.ltv > 70 ? "text-red-600" : "text-slate-700"}`}>{p.ltv.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
