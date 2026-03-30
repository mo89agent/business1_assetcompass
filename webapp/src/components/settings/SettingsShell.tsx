"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateWorkspaceSettings, updateTaxPolicy, updateForecastAssumption } from "@/app/actions/settings";
import { CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";

interface WorkspaceProps { id: string; name: string; currency: string; country: string; timezone: string; }
interface TaxPolicyProps { id: string; name: string; capitalGainsTaxRate: number; soliRate: number; churchTaxRate: number; freistellungsauftrag: number; spekulationsfristYears: number; }
interface ForecastProps { id: string; name: string; equityReturnAnnual: number; bondReturnAnnual: number; realEstateAppreciation: number; cryptoReturnAnnual: number; cashReturnAnnual: number; inflationRate: number; effectiveTaxRate: number; avgFeeRate: number; }

interface Props {
  workspace: WorkspaceProps | null;
  taxPolicy: TaxPolicyProps | null;
  forecastAssumption: ForecastProps | null;
}

function Field({ label, value, onChange, type = "text", suffix, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; suffix?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={type === "number" ? "0.001" : undefined}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
        {suffix && <span className="text-xs text-slate-400 shrink-0">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ saving, saved, error, onClick }: { saving: boolean; saved: boolean; error: string | null; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button onClick={onClick} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? "Speichert…" : "Speichern"}
      </button>
      {saved && !error && <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={12} />Gespeichert</span>}
      {error && <span className="flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} />{error}</span>}
    </div>
  );
}

export function SettingsShell({ workspace, taxPolicy, forecastAssumption }: Props) {

  // ── Workspace state ───────────────────────────────────────────────────
  const [ws, setWs] = useState({
    name:     workspace?.name     ?? "Mein Portfolio",
    currency: workspace?.currency ?? "EUR",
    country:  workspace?.country  ?? "DE",
    timezone: workspace?.timezone ?? "Europe/Berlin",
  });
  const [wsSaving, setWsSaving] = useState(false);
  const [wsSaved,  setWsSaved]  = useState(false);
  const [wsError,  setWsError]  = useState<string | null>(null);

  async function saveWorkspace() {
    setWsSaving(true); setWsSaved(false); setWsError(null);
    try {
      await updateWorkspaceSettings(ws);
      setWsSaved(true); setTimeout(() => setWsSaved(false), 3000);
    } catch (e) { setWsError(String(e)); }
    finally { setWsSaving(false); }
  }

  // ── Tax policy state ──────────────────────────────────────────────────
  const [tax, setTax] = useState({
    capitalGainsTaxRate:  String(((taxPolicy?.capitalGainsTaxRate  ?? 0.25) * 100).toFixed(1)),
    soliRate:             String(((taxPolicy?.soliRate             ?? 0.055) * 100).toFixed(1)),
    churchTaxRate:        String(((taxPolicy?.churchTaxRate        ?? 0)    * 100).toFixed(1)),
    freistellungsauftrag: String(taxPolicy?.freistellungsauftrag   ?? 1000),
    spekulationsfristYears: String(taxPolicy?.spekulationsfristYears ?? 10),
  });
  const [taxSaving, setTaxSaving] = useState(false);
  const [taxSaved,  setTaxSaved]  = useState(false);
  const [taxError,  setTaxError]  = useState<string | null>(null);

  async function saveTax() {
    setTaxSaving(true); setTaxSaved(false); setTaxError(null);
    try {
      await updateTaxPolicy({
        capitalGainsTaxRate:    parseFloat(tax.capitalGainsTaxRate) / 100,
        soliRate:               parseFloat(tax.soliRate) / 100,
        churchTaxRate:          parseFloat(tax.churchTaxRate) / 100,
        freistellungsauftrag:   parseFloat(tax.freistellungsauftrag),
        spekulationsfristYears: parseFloat(tax.spekulationsfristYears),
      });
      setTaxSaved(true); setTimeout(() => setTaxSaved(false), 3000);
    } catch (e) { setTaxError(String(e)); }
    finally { setTaxSaving(false); }
  }

  // ── Forecast assumption state ─────────────────────────────────────────
  const [fc, setFc] = useState({
    equityReturnAnnual:     String(((forecastAssumption?.equityReturnAnnual     ?? 0.07) * 100).toFixed(1)),
    bondReturnAnnual:       String(((forecastAssumption?.bondReturnAnnual       ?? 0.03) * 100).toFixed(1)),
    realEstateAppreciation: String(((forecastAssumption?.realEstateAppreciation ?? 0.03) * 100).toFixed(1)),
    cryptoReturnAnnual:     String(((forecastAssumption?.cryptoReturnAnnual     ?? 0.15) * 100).toFixed(1)),
    cashReturnAnnual:       String(((forecastAssumption?.cashReturnAnnual       ?? 0.025) * 100).toFixed(1)),
    inflationRate:          String(((forecastAssumption?.inflationRate          ?? 0.02) * 100).toFixed(1)),
    effectiveTaxRate:       String(((forecastAssumption?.effectiveTaxRate       ?? 0.265) * 100).toFixed(1)),
    avgFeeRate:             String(((forecastAssumption?.avgFeeRate             ?? 0.005) * 100).toFixed(2)),
  });
  const [fcSaving, setFcSaving] = useState(false);
  const [fcSaved,  setFcSaved]  = useState(false);
  const [fcError,  setFcError]  = useState<string | null>(null);

  async function saveForecast() {
    setFcSaving(true); setFcSaved(false); setFcError(null);
    try {
      await updateForecastAssumption({
        equityReturnAnnual:     parseFloat(fc.equityReturnAnnual) / 100,
        bondReturnAnnual:       parseFloat(fc.bondReturnAnnual) / 100,
        realEstateAppreciation: parseFloat(fc.realEstateAppreciation) / 100,
        cryptoReturnAnnual:     parseFloat(fc.cryptoReturnAnnual) / 100,
        cashReturnAnnual:       parseFloat(fc.cashReturnAnnual) / 100,
        inflationRate:          parseFloat(fc.inflationRate) / 100,
        effectiveTaxRate:       parseFloat(fc.effectiveTaxRate) / 100,
        avgFeeRate:             parseFloat(fc.avgFeeRate) / 100,
      });
      setFcSaved(true); setTimeout(() => setFcSaved(false), 3000);
    } catch (e) { setFcError(String(e)); }
    finally { setFcSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Einstellungen</h1>
        <p className="text-sm text-slate-500 mt-0.5">Workspace, Steuern und Prognose-Annahmen konfigurieren</p>
      </div>

      {/* ── Workspace ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Workspace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Workspace-Name" value={ws.name} onChange={(v) => setWs(w => ({ ...w, name: v }))} />
          <SelectField label="Basiswährung" value={ws.currency} onChange={(v) => setWs(w => ({ ...w, currency: v }))}
            options={[{ value: "EUR", label: "EUR — Euro" }, { value: "USD", label: "USD — US Dollar" }, { value: "GBP", label: "GBP — British Pound" }, { value: "CHF", label: "CHF — Schweizer Franken" }]} />
          <SelectField label="Land / Steuerort" value={ws.country} onChange={(v) => setWs(w => ({ ...w, country: v }))}
            options={[{ value: "DE", label: "Deutschland" }, { value: "AT", label: "Österreich" }, { value: "CH", label: "Schweiz" }, { value: "US", label: "USA" }, { value: "GB", label: "Großbritannien" }]} />
          <SelectField label="Zeitzone" value={ws.timezone} onChange={(v) => setWs(w => ({ ...w, timezone: v }))}
            options={[{ value: "Europe/Berlin", label: "Europe/Berlin (CET)" }, { value: "Europe/Zurich", label: "Europe/Zurich" }, { value: "Europe/Vienna", label: "Europe/Vienna" }, { value: "UTC", label: "UTC" }]} />
        </div>
        <SaveButton saving={wsSaving} saved={wsSaved} error={wsError} onClick={saveWorkspace} />
      </div>

      {/* ── Tax Policy ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Steuereinstellungen (Deutschland)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Abgeltungsteuer" value={tax.capitalGainsTaxRate} onChange={(v) => setTax(t => ({ ...t, capitalGainsTaxRate: v }))} type="number" suffix="%" hint="Standard: 25%" />
          <Field label="Solidaritätszuschlag" value={tax.soliRate} onChange={(v) => setTax(t => ({ ...t, soliRate: v }))} type="number" suffix="% auf Steuer" hint="Standard: 5,5%" />
          <Field label="Kirchensteuer" value={tax.churchTaxRate} onChange={(v) => setTax(t => ({ ...t, churchTaxRate: v }))} type="number" suffix="%" hint="0% wenn nicht kirchensteuerpflichtig" />
          <Field label="Freistellungsauftrag" value={tax.freistellungsauftrag} onChange={(v) => setTax(t => ({ ...t, freistellungsauftrag: v }))} type="number" suffix="EUR/Jahr" hint="Ab 2024: 1.000 € (2.000 € Eheleute)" />
          <Field label="Spekulationsfrist (Immobilien)" value={tax.spekulationsfristYears} onChange={(v) => setTax(t => ({ ...t, spekulationsfristYears: v }))} type="number" suffix="Jahre" hint="Standard: 10 Jahre" />
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Diese Werte dienen der Planungshilfe. Bitte konsultieren Sie für die offizielle Steuererklärung einen Steuerberater.
        </div>
        <SaveButton saving={taxSaving} saved={taxSaved} error={taxError} onClick={saveTax} />
      </div>

      {/* ── Forecast Assumptions ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Prognose-Annahmen (Base Case)</h2>
        <p className="text-xs text-slate-400 mb-4">Werden für Szenario-Simulationen und Prognosen verwendet</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aktienrendite p.a." value={fc.equityReturnAnnual} onChange={(v) => setFc(f => ({ ...f, equityReturnAnnual: v }))} type="number" suffix="%" hint="Historischer MSCI World Ø ~7–8%" />
          <Field label="Anleiherendite p.a." value={fc.bondReturnAnnual} onChange={(v) => setFc(f => ({ ...f, bondReturnAnnual: v }))} type="number" suffix="%" />
          <Field label="Immobilien-Wertsteigerung" value={fc.realEstateAppreciation} onChange={(v) => setFc(f => ({ ...f, realEstateAppreciation: v }))} type="number" suffix="%" />
          <Field label="Krypto-Rendite p.a." value={fc.cryptoReturnAnnual} onChange={(v) => setFc(f => ({ ...f, cryptoReturnAnnual: v }))} type="number" suffix="%" hint="Hoch spekulativ" />
          <Field label="Sparrate / Cash-Zins" value={fc.cashReturnAnnual} onChange={(v) => setFc(f => ({ ...f, cashReturnAnnual: v }))} type="number" suffix="%" />
          <Field label="Inflationsrate" value={fc.inflationRate} onChange={(v) => setFc(f => ({ ...f, inflationRate: v }))} type="number" suffix="%" hint="EZB-Ziel: 2%" />
          <Field label="Effektiver Steuersatz" value={fc.effectiveTaxRate} onChange={(v) => setFc(f => ({ ...f, effectiveTaxRate: v }))} type="number" suffix="%" hint="Inkl. Soli: ca. 26,4%" />
          <Field label="Ø Kostenquote (Fonds/ETF)" value={fc.avgFeeRate} onChange={(v) => setFc(f => ({ ...f, avgFeeRate: v }))} type="number" suffix="%" />
        </div>
        <SaveButton saving={fcSaving} saved={fcSaved} error={fcError} onClick={saveForecast} />
      </div>

      {/* ── Depots / Accounts ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Verknüpfte Depots & Konten</h2>
          <a href="/dashboard/import" className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            + Daten importieren
          </a>
        </div>
        <p className="text-xs text-slate-500">
          Depots und Konten werden automatisch angelegt wenn Sie Positionen hinzufügen oder Transaktionen importieren (Trade Republic, Comdirect, etc.).
          Für direkten Datenabruf über eine Broker-API besuchen Sie den{" "}
          <a href="/dashboard/import" className="text-blue-600 hover:underline">Import-Bereich</a>.
        </p>
      </div>

      {/* ── Data & Privacy ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Daten & Datenschutz</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p>Alle Daten werden lokal in Ihrer SQLite-Datenbank gespeichert. Keine Daten werden an externe Server übermittelt.</p>
          <p>Kursdaten werden in Echtzeit von Yahoo Finance abgerufen (öffentliche Börsenpreise).</p>
        </div>
      </div>
    </div>
  );
}
