"use client";

import { useState, useEffect } from "react";
import { DrawerShell } from "@/components/ui/DrawerShell";
import { updateInstrumentMasterData } from "@/app/actions/positions";
import type { PositionRow } from "@/lib/types";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  position: PositionRow | null;
  onSaved?: () => void;
}

const SECTORS = [
  "Technology", "Healthcare", "Financials", "Consumer Discretionary",
  "Consumer Staples", "Energy", "Industrials", "Materials",
  "Real Estate", "Utilities", "Communication Services", "Sonstiges",
];

const COUNTRIES = [
  "USA", "Deutschland", "Japan", "Großbritannien", "Frankreich",
  "China", "Schweiz", "Kanada", "Australien", "Südkorea",
  "Niederlande", "Indien", "Schweden", "Dänemark", "Sonstiges",
];

export function MasterDataDrawer({ open, onClose, position, onSaved }: Props) {
  const [form, setForm] = useState({
    name: "",
    isin: "",
    exchange: "",
    country: "",
    sector: "",
    ter: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from position when opened
  useEffect(() => {
    if (open && position) {
      setForm({
        name: position.name ?? "",
        isin: position.isin ?? "",
        exchange: "",
        country: position.country ?? "",
        sector: position.sector ?? "",
        ter: position.ter != null ? String(position.ter) : "",
        description: position.description ?? "",
      });
      setSaved(false);
      setError(null);
    }
  }, [open, position]);

  async function handleSave() {
    if (!position) return;
    setSaving(true);
    setError(null);
    try {
      await updateInstrumentMasterData({
        instrumentId: position.instrumentId,
        name: form.name || undefined,
        isin: form.isin || undefined,
        exchange: form.exchange || undefined,
        country: form.country || undefined,
        sector: form.sector || undefined,
        ter: form.ter !== "" ? parseFloat(form.ter) : undefined,
        description: form.description || undefined,
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => {
        onClose();
        setSaved(false);
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  if (!position) return null;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Stammdaten bearbeiten"
      subtitle={position.ticker ?? position.name}
      widthClass="w-[480px]"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {saved ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <p className="text-base font-semibold text-slate-900">Gespeichert</p>
              <p className="text-sm text-slate-500 mt-1">Stammdaten wurden aktualisiert.</p>
            </div>
          ) : (
            <>
              {/* Instrument info */}
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-blue-600">
                      {(position.ticker ?? position.name).slice(0, 4)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{position.name}</p>
                    <p className="text-xs text-slate-400">{position.assetClass} · {position.ticker}</p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  Name / Bezeichnung
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. iShares Core MSCI World ETF"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* ISIN */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  ISIN
                  <span className="ml-1.5 text-slate-400 font-normal">International Securities Identification Number</span>
                </label>
                <input
                  type="text"
                  value={form.isin}
                  onChange={(e) => setForm((f) => ({ ...f, isin: e.target.value.toUpperCase() }))}
                  placeholder="z.B. IE00B4L5Y983"
                  maxLength={12}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                />
              </div>

              {/* Exchange */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Börse / Exchange</label>
                <input
                  type="text"
                  value={form.exchange}
                  onChange={(e) => setForm((f) => ({ ...f, exchange: e.target.value }))}
                  placeholder="z.B. XETRA, NYSE, NASDAQ"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Country + Sector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Hauptland</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">— wählen —</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Branche / Sektor</label>
                  <select
                    value={form.sector}
                    onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">— wählen —</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TER */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  TER / Kostenquote
                  <span className="ml-1.5 text-slate-400 font-normal">Total Expense Ratio in % p.a.</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={form.ter}
                    onChange={(e) => setForm((f) => ({ ...f, ter: e.target.value }))}
                    placeholder="z.B. 0.20"
                    className="w-full px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                </div>
                {form.ter !== "" && parseFloat(form.ter) > 0.5 && (
                  <p className="text-xs text-amber-600 mt-1">
                    TER über 0.5% — vergleiche mit günstigeren Alternativen
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Beschreibung / Notiz</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="z.B. Weltweiter Aktien-ETF, physisch replizierend, thesaurierend"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Speichert…" : "Stammdaten speichern"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}
