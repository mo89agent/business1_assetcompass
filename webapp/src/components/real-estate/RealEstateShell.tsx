"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Home, Building2, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PropertyRecord, PropertyMetrics } from "@/lib/types";
import { computePropertyMetrics } from "@/lib/data/realEstate";
import { addProperty, type AddPropertyInput } from "@/app/actions/realEstate";

const CONFIDENCE_LABELS = {
  high:   { label: "Konfidenz hoch",    color: "text-emerald-600", bg: "bg-emerald-50" },
  medium: { label: "Konfidenz mittel",   color: "text-amber-600",   bg: "bg-amber-50" },
  low:    { label: "Konfidenz niedrig",  color: "text-red-600",     bg: "bg-red-50" },
};

const TYPE_ICONS = {
  residential: Home,
  commercial:  Building2,
  mixed:       Building2,
  land:        Building2,
};

const PROPERTY_TYPE_OPTIONS = [
  { value: "residential", label: "Wohnimmobilie" },
  { value: "commercial",  label: "Gewerbeimmobilie" },
  { value: "mixed",       label: "Gemischt genutzt" },
  { value: "land",        label: "Grundstück" },
];

const ENERGY_CLASSES = ["A+", "A", "B", "C", "D", "E", "F", "G", "H"];

interface Props {
  properties: PropertyRecord[];
  isDemo: boolean;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent";
const selectCls = inputCls;

export function RealEstateShell({ properties: initialProps, isDemo }: Props) {
  const [properties, setProperties] = useState(initialProps);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AddPropertyInput>>({
    propertyType: "residential",
    country: "DE",
    vacancyRate: 2,
  });

  const withMetrics = properties.map((p) => ({ property: p, metrics: computePropertyMetrics(p) }));

  const totalValue  = withMetrics.reduce((s, { property: p }) => s + p.valuation.estimatedValue, 0);
  const totalEquity = withMetrics.reduce((s, { metrics: m }) => s + m.equity, 0);
  const totalRent   = withMetrics.reduce((s, { property: p }) => s + p.actualRentMonthly, 0);
  const totalNOI    = withMetrics.reduce((s, { metrics: m }) => s + m.netOperatingIncome, 0);

  function set(k: keyof AddPropertyInput, v: string | number | undefined) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.address || !form.city || !form.acquisitionPrice) {
      setError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await addProperty(form as AddPropertyInput);
      if (!res.success) { setError(res.error ?? "Fehler"); return; }
      // Optimistic close — page will revalidate
      setAddOpen(false);
      setForm({ propertyType: "residential", country: "DE", vacancyRate: 2 });
      // Force a refresh so new property appears
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Immobilien</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {properties.length} Objekt{properties.length !== 1 ? "e" : ""}{" "}
              {isDemo && <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">Demo-Daten</span>}
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            <Plus size={14} />
            Objekt hinzufügen
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Portfoliowert (Schätzung)", value: formatCurrency(totalValue, "EUR"),  sub: "Summe aller Schätzwerte" },
            { label: "Eigenkapital gesamt",        value: formatCurrency(totalEquity, "EUR"), sub: "Wert minus Restschulden" },
            { label: "Monatliche Mieteinnahmen",   value: `${formatCurrency(totalRent, "EUR")}/mo`, sub: "Bruttomiete (Ist)" },
            { label: "Monatliches NOI",            value: `${totalNOI >= 0 ? "+" : ""}${formatCurrency(totalNOI, "EUR")}/mo`, sub: "Nach Bewirtschaftungskosten" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
            <Home size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Noch keine Immobilien erfasst</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Füge dein erstes Objekt hinzu, um Cashflow, LTV und Rendite zu tracken.</p>
            <button
              onClick={() => setAddOpen(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
            >
              Erstes Objekt hinzufügen
            </button>
          </div>
        )}

        {/* Property cards */}
        <div className="space-y-4">
          {withMetrics.map(({ property: p, metrics: m }) => {
            const TypeIcon = TYPE_ICONS[p.type] ?? Home;
            const conf = CONFIDENCE_LABELS[p.valuation.confidence];
            const fixedLoan = p.loans.find((l) => l.fixedRateUntil);
            const daysToExpiry = fixedLoan?.fixedRateUntil
              ? Math.ceil((new Date(fixedLoan.fixedRateUntil).getTime() - Date.now()) / 86_400_000)
              : null;
            const isUrgent = daysToExpiry != null && daysToExpiry <= 90;

            return (
              <Link
                key={p.id}
                href={`/dashboard/real-estate/${p.id}`}
                className="block bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all overflow-hidden group"
              >
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

                <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {[
                    { label: "Schätzwert",       value: formatCurrency(p.valuation.estimatedValue, p.currency),
                      sub: `${formatCurrency(p.valuation.valueLow, p.currency)} – ${formatCurrency(p.valuation.valueHigh, p.currency)}` },
                    { label: "Eigenkapital",      value: formatCurrency(m.equity, p.currency),
                      sub: `LTV: ${m.ltv > 0 ? m.ltv.toFixed(1) + "%" : "Schuldenfrei"}` },
                    { label: "Restschuld",        value: m.totalLoanBalance > 0 ? formatCurrency(m.totalLoanBalance, p.currency) : "Schuldenfrei",
                      sub: fixedLoan ? `${fixedLoan.interestRatePct.toFixed(2)}% bis ${new Date(fixedLoan.fixedRateUntil!).toLocaleDateString("de-DE", { month: "short", year: "numeric" })}` : undefined },
                    { label: "Bruttomietrendite", value: `${m.grossYield.toFixed(2)}%`, sub: "Auf Schätzwert" },
                    { label: "NOI (monatlich)",   value: `${m.netOperatingIncome >= 0 ? "+" : ""}${formatCurrency(m.netOperatingIncome, p.currency)}`, sub: "Vor Kapitaldienst" },
                    { label: "Free Cashflow",     value: `${m.netCashflow >= 0 ? "+" : ""}${formatCurrency(m.netCashflow, p.currency)}/mo`, sub: "Nach Kapitaldienst" },
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
          Alle Schätzwerte sind manuell erfasst. Keine Gewähr für Richtigkeit. Keine Anlageberatung.
        </p>
      </div>

      {/* ── Add Property Modal ──────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-semibold text-slate-900">Neues Objekt erfassen</h2>
              <button onClick={() => setAddOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              {/* Section: Grunddaten */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Grunddaten</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Bezeichnung" required>
                      <input className={inputCls} placeholder="z.B. Wohnung Berlin Mitte" value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Typ" required>
                    <select className={selectCls} value={form.propertyType ?? "residential"} onChange={e => set("propertyType", e.target.value)}>
                      {PROPERTY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Energieklasse">
                    <select className={selectCls} value={form.energyClass ?? ""} onChange={e => set("energyClass", e.target.value || undefined)}>
                      <option value="">Unbekannt</option>
                      {ENERGY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Straße & Hausnummer" required>
                    <input className={inputCls} placeholder="Musterstr. 1" value={form.address ?? ""} onChange={e => set("address", e.target.value)} />
                  </Field>
                  <Field label="Stadt" required>
                    <input className={inputCls} placeholder="Berlin" value={form.city ?? ""} onChange={e => set("city", e.target.value)} />
                  </Field>
                  <Field label="PLZ">
                    <input className={inputCls} placeholder="10115" value={form.postalCode ?? ""} onChange={e => set("postalCode", e.target.value)} />
                  </Field>
                  <Field label="Fläche (m²)">
                    <input className={inputCls} type="number" placeholder="80" value={form.floorAreaSqm ?? ""} onChange={e => set("floorAreaSqm", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Baujahr">
                    <input className={inputCls} type="number" placeholder="1980" value={form.buildYear ?? ""} onChange={e => set("buildYear", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                </div>
              </div>

              {/* Section: Kauf */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Kauf & Bewertung</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Kaufdatum">
                    <input className={inputCls} type="date" value={form.acquisitionDate ?? ""} onChange={e => set("acquisitionDate", e.target.value)} />
                  </Field>
                  <Field label="Kaufpreis (€)" required>
                    <input className={inputCls} type="number" placeholder="350000" value={form.acquisitionPrice ?? ""} onChange={e => set("acquisitionPrice", Number(e.target.value))} />
                  </Field>
                  <Field label="Erwerbsnebenkosten (€)">
                    <input className={inputCls} type="number" placeholder="28000" value={form.ancillaryCosts ?? ""} onChange={e => set("ancillaryCosts", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Aktueller Schätzwert (€)">
                    <input className={inputCls} type="number" placeholder="380000" value={form.currentValue ?? ""} onChange={e => set("currentValue", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                </div>
              </div>

              {/* Section: Miete & Kosten */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Miete & Kosten</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Sollmiete/Monat (€)">
                    <input className={inputCls} type="number" placeholder="1200" value={form.targetRentMonthly ?? ""} onChange={e => set("targetRentMonthly", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Istmiete/Monat (€)">
                    <input className={inputCls} type="number" placeholder="1200" value={form.actualRentMonthly ?? ""} onChange={e => set("actualRentMonthly", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Leerstandsquote (%)">
                    <input className={inputCls} type="number" step="0.1" placeholder="2" value={form.vacancyRate ?? ""} onChange={e => set("vacancyRate", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Bewirtschaftungskosten/Monat (€)">
                    <input className={inputCls} type="number" placeholder="200" value={form.operatingCostsMonthly ?? ""} onChange={e => set("operatingCostsMonthly", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Instandhaltungsrücklage/Monat (€)">
                    <input className={inputCls} type="number" placeholder="80" value={form.maintenanceReserve ?? ""} onChange={e => set("maintenanceReserve", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                </div>
              </div>

              {/* Section: Finanzierung */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Finanzierung (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Kreditgeber">
                    <input className={inputCls} placeholder="DKB, Sparkasse, …" value={form.mortgageLender ?? ""} onChange={e => set("mortgageLender", e.target.value || undefined)} />
                  </Field>
                  <Field label="Ursprüngliches Darlehen (€)">
                    <input className={inputCls} type="number" placeholder="250000" value={form.mortgagePrincipal ?? ""} onChange={e => set("mortgagePrincipal", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Restschuld (€)">
                    <input className={inputCls} type="number" placeholder="210000" value={form.mortgageRemaining ?? ""} onChange={e => set("mortgageRemaining", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Zinssatz (%)">
                    <input className={inputCls} type="number" step="0.01" placeholder="2.5" value={form.mortgageRate ?? ""} onChange={e => set("mortgageRate", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Monatliche Rate (€)">
                    <input className={inputCls} type="number" placeholder="1100" value={form.mortgageMonthly ?? ""} onChange={e => set("mortgageMonthly", e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Zinsbindung bis">
                    <input className={inputCls} type="date" value={form.mortgageFixedUntil ?? ""} onChange={e => set("mortgageFixedUntil", e.target.value || undefined)} />
                  </Field>
                </div>
              </div>

              <Field label="Notizen">
                <textarea className={inputCls} rows={2} placeholder="Optionale Anmerkungen…" value={form.notes ?? ""} onChange={e => set("notes", e.target.value || undefined)} />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition"
                >
                  {saving ? "Speichern…" : "Objekt speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
