import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProperties, computePropertyMetrics } from "@/lib/data/realEstate";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Home, Building2 } from "lucide-react";

export const metadata = { title: "Real Estate" };

const CONFIDENCE_LABELS = {
  high: { label: "Konfidenz hoch", color: "text-emerald-600", bg: "bg-emerald-50" },
  medium: { label: "Konfidenz mittel", color: "text-amber-600", bg: "bg-amber-50" },
  low: { label: "Konfidenz niedrig", color: "text-red-600", bg: "bg-red-50" },
};

const TYPE_ICONS = {
  residential: Home,
  commercial: Building2,
  mixed: Building2,
  land: Building2,
};

export default async function RealEstatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const properties = await getProperties();
  const withMetrics = properties.map((p) => ({ property: p, metrics: computePropertyMetrics(p) }));

  const totalEstimatedValue = withMetrics.reduce((s, { property: p }) => s + p.valuation.estimatedValue, 0);
  const totalEquity = withMetrics.reduce((s, { metrics: m }) => s + m.equity, 0);
  const totalRent = withMetrics.reduce((s, { property: p }) => s + p.actualRentMonthly, 0);
  const totalNOI = withMetrics.reduce((s, { metrics: m }) => s + m.netOperatingIncome, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Immobilien</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {properties.length} Objekt{properties.length !== 1 ? "e" : ""} ·{" "}
            Alle Werte basieren auf manuellen Schätzungen
          </p>
        </div>
        <button className="px-3 py-1.5 text-sm bg-orange-500 rounded-lg text-white hover:bg-orange-600 transition">
          + Objekt hinzufügen
        </button>
      </div>

      {/* Portfolio KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Portfoliowert (Schätzung)",
            value: formatCurrency(totalEstimatedValue, "EUR"),
            sub: "Summe aller Schätzwerte (Mitte)",
          },
          {
            label: "Eigenkapital gesamt",
            value: formatCurrency(totalEquity, "EUR"),
            sub: "Wert minus Restschulden",
          },
          {
            label: "Monatliche Mieteinnahmen",
            value: `${formatCurrency(totalRent, "EUR")}/mo`,
            sub: "Bruttomiete (Ist)",
          },
          {
            label: "Monatliches NOI",
            value: `${totalNOI >= 0 ? "+" : ""}${formatCurrency(totalNOI, "EUR")}/mo`,
            sub: "Nach Bewirtschaftungskosten",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Property cards */}
      <div className="space-y-4">
        {withMetrics.map(({ property: p, metrics: m }) => {
          const TypeIcon = TYPE_ICONS[p.type];
          const conf = CONFIDENCE_LABELS[p.valuation.confidence];

          // Fixed rate expiry check
          const fixedLoan = p.loans.find((l) => l.fixedRateUntil);
          const daysToExpiry = fixedLoan?.fixedRateUntil
            ? Math.ceil((new Date(fixedLoan.fixedRateUntil).getTime() - new Date("2026-03-28").getTime()) / 86_400_000)
            : null;
          const isUrgent = daysToExpiry != null && daysToExpiry <= 90;

          return (
            <Link
              key={p.id}
              href={`/dashboard/real-estate/${p.id}`}
              className="block bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all overflow-hidden group"
            >
              {/* Card header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <TypeIcon size={17} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 group-hover:text-orange-700 transition-colors">
                      {p.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm text-slate-400">{p.city}</span>
                      {p.sqm && <span className="text-xs text-slate-400">{p.sqm} m²</span>}
                      {p.energyClass && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          Energieklasse {p.energyClass}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUrgent && daysToExpiry != null && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg border border-amber-200">
                      <AlertTriangle size={11} />
                      Zinsbindung in {daysToExpiry}d
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${conf.bg} ${conf.color}`}>
                    {conf.label}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                </div>
              </div>

              {/* Metrics grid */}
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {[
                  {
                    label: "Schätzwert",
                    value: formatCurrency(p.valuation.estimatedValue, p.currency),
                    sub: `${formatCurrency(p.valuation.valueLow, p.currency)} – ${formatCurrency(p.valuation.valueHigh, p.currency)}`,
                  },
                  {
                    label: "Eigenkapital",
                    value: formatCurrency(m.equity, p.currency),
                    sub: `LTV: ${m.ltv > 0 ? m.ltv.toFixed(1) + "%" : "Schuldenfrei"}`,
                  },
                  {
                    label: "Restschuld",
                    value: m.totalLoanBalance > 0 ? formatCurrency(m.totalLoanBalance, p.currency) : "Schuldenfrei",
                    sub: fixedLoan ? `${fixedLoan.interestRatePct.toFixed(2)}% bis ${new Date(fixedLoan.fixedRateUntil!).toLocaleDateString("de-DE", { month: "short", year: "numeric" })}` : undefined,
                  },
                  {
                    label: "Bruttomietrendite",
                    value: `${m.grossYield.toFixed(2)}%`,
                    sub: "Auf Schätzwert",
                  },
                  {
                    label: "NOI (monatlich)",
                    value: `${m.netOperatingIncome >= 0 ? "+" : ""}${formatCurrency(m.netOperatingIncome, p.currency)}`,
                    sub: "Vor Kapitaldienst",
                  },
                  {
                    label: "Free Cashflow",
                    value: `${m.netCashflow >= 0 ? "+" : ""}${formatCurrency(m.netCashflow, p.currency)}/mo`,
                    sub: "Nach Kapitaldienst",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.value}</p>
                    {item.sub && <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>}
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Alle Schätzwerte sind manuell erfasst und nicht durch eine offizielle Bewertung bestätigt.
        Keine Gewähr für Richtigkeit. Keine Anlageberatung.
      </p>
    </div>
  );
}
