"use client";

import { useState, useEffect, useRef } from "react";
import { DrawerShell } from "@/components/ui/DrawerShell";
import { cn } from "@/lib/utils";
import type { YahooSearchResult } from "@/lib/types";
import { addPosition } from "@/app/actions/positions";
import {
  TrendingUp, BarChart2, Home, Bitcoin, Search,
  ChevronRight, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";

type AssetType = "stock_etf" | "crypto" | "real_estate" | "other";
type Step = "type" | "search" | "details" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  prefillSymbol?: string;
}

const ASSET_TYPES: { id: AssetType; label: string; description: string; icon: typeof TrendingUp }[] = [
  { id: "stock_etf",    label: "Aktie / ETF",   description: "Börsengehandelte Wertpapiere",         icon: TrendingUp },
  { id: "crypto",       label: "Krypto",         description: "Bitcoin, Ethereum und andere Coins",   icon: Bitcoin },
  { id: "real_estate",  label: "Immobilie",       description: "Mietobjekte, Eigennutzung",           icon: Home },
  { id: "other",        label: "Sonstiges",       description: "Gold, Rohstoffe, manuelle Position",  icon: BarChart2 },
];

const ACCOUNTS = [
  "Flatex Depot",
  "Trade Republic",
  "Coinbase",
  "DKB Tagesgeld",
  "Xetra Gold",
];

const CRYPTO_TICKERS = [
  { symbol: "BTC-USD", shortname: "Bitcoin", typeDisp: "Cryptocurrency", exchDisp: "CCC" },
  { symbol: "ETH-USD", shortname: "Ethereum", typeDisp: "Cryptocurrency", exchDisp: "CCC" },
  { symbol: "SOL-USD", shortname: "Solana", typeDisp: "Cryptocurrency", exchDisp: "CCC" },
  { symbol: "ADA-USD", shortname: "Cardano", typeDisp: "Cryptocurrency", exchDisp: "CCC" },
  { symbol: "DOT-USD", shortname: "Polkadot", typeDisp: "Cryptocurrency", exchDisp: "CCC" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function AddAssetDrawer({ open, onClose, prefillSymbol }: Props) {
  const [step, setStep] = useState<Step>("type");
  const [assetType, setAssetType] = useState<AssetType | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YahooSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<YahooSearchResult | null>(null);
  const [form, setForm] = useState({
    quantity: "",
    price: "",
    date: new Date().toISOString().slice(0, 10),
    account: ACCOUNTS[0],
    currency: "EUR",
    notes: "",
    fees: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefill from market page
  useEffect(() => {
    if (open && prefillSymbol) {
      setAssetType("stock_etf");
      setSelected({ symbol: prefillSymbol, shortname: prefillSymbol, typeDisp: "Equity", exchDisp: null });
      setStep("details");
    }
  }, [open, prefillSymbol]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("type");
      setAssetType(null);
      setQuery("");
      setResults([]);
      setSelected(null);
      setSaveError(null);
      setSaving(false);
      setForm({ quantity: "", price: "", date: new Date().toISOString().slice(0, 10), account: ACCOUNTS[0], currency: "EUR", notes: "", fees: "" });
    }
  }, [open]);

  // Yahoo Finance search
  useEffect(() => {
    if (step !== "search" || assetType !== "stock_etf") return;
    if (!debouncedQuery || debouncedQuery.length < 2) { setResults([]); return; }

    setSearching(true);
    fetch(`/api/yahoo/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: { results?: YahooSearchResult[] }) => {
        setResults(data.results ?? []);
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, [debouncedQuery, step, assetType]);

  // Auto-fetch real-time price when entering details step
  useEffect(() => {
    if (step !== "details" || !selected?.symbol) return;
    if (assetType === "real_estate") return;

    setPriceLoading(true);
    fetch(`/api/yahoo/quote?symbols=${encodeURIComponent(selected.symbol)}`)
      .then((r) => r.json())
      .then((data: { quotes?: Array<{ regularMarketPrice?: number; currency?: string }> }) => {
        const q = data.quotes?.[0];
        if (q?.regularMarketPrice) {
          setForm((f) => ({
            ...f,
            price: q.regularMarketPrice!.toFixed(2),
            ...(q.currency ? { currency: q.currency } : {}),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setPriceLoading(false));
  }, [step, selected?.symbol, assetType]);

  // Focus search input
  useEffect(() => {
    if (step === "search") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  function handleSelectAssetType(type: AssetType) {
    setAssetType(type);
    if (type === "real_estate") {
      // Navigate to real estate section
      window.location.href = "/dashboard/real-estate";
      return;
    }
    if (type === "crypto") {
      setResults(CRYPTO_TICKERS);
      setStep("search");
    } else {
      setStep("search");
    }
  }

  function handleSelectResult(r: YahooSearchResult) {
    setSelected(r);
    setStep("details");
  }

  async function handleSubmit() {
    if (!selected || !form.quantity || !form.price) return;
    setSaving(true);
    setSaveError(null);

    // Determine asset class
    let assetClass = "STOCK";
    if (assetType === "crypto") {
      assetClass = "CRYPTO";
    } else if (assetType === "other") {
      assetClass = "OTHER";
    } else {
      const td = (selected.typeDisp ?? "").toLowerCase();
      if (td.includes("etf") || td.includes("fund")) assetClass = "ETF";
      else if (td.includes("crypto") || td.includes("currency")) assetClass = "CRYPTO";
      else assetClass = "STOCK";
    }

    try {
      await addPosition({
        ticker: selected.symbol,
        instrumentName: selected.shortname ?? selected.symbol,
        assetClass,
        currency: form.currency,
        quantity: parseFloat(form.quantity),
        pricePerUnit: parseFloat(form.price),
        purchaseDate: form.date,
        accountName: form.account,
        fees: form.fees ? parseFloat(form.fees) : undefined,
        notes: form.notes || undefined,
      });
      setStep("done");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  const isDetailsValid = form.quantity !== "" && form.price !== "" && form.date !== "";

  const STEPS_MAP: Record<Step, number> = { type: 0, search: 1, details: 2, done: 3 };
  const stepIdx = STEPS_MAP[step];

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Position hinzufügen"
      subtitle={
        step === "type" ? "Assetklasse wählen" :
        step === "search" ? "Wertpapier suchen" :
        step === "details" ? (selected?.shortname ?? selected?.symbol ?? "Details") :
        "Fertig"
      }
      widthClass="w-[520px]"
    >
      <div className="flex flex-col h-full">
        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex items-center gap-1.5 px-6 pt-4 pb-0">
            {["Typ", "Suche", "Details"].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors",
                  i < stepIdx ? "bg-emerald-500 text-white" :
                  i === stepIdx ? "bg-blue-600 text-white" :
                  "bg-slate-100 text-slate-400"
                )}>
                  {i < stepIdx ? "✓" : i + 1}
                </div>
                <span className={cn("text-[11px]",
                  i === stepIdx ? "text-slate-700 font-medium" : "text-slate-400"
                )}>{label}</span>
                {i < 2 && <ChevronRight size={11} className="text-slate-300" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── Step: Asset type ── */}
          {step === "type" && (
            <div className="grid grid-cols-2 gap-3">
              {ASSET_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectAssetType(t.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition hover:shadow-sm",
                      assetType === t.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <Icon size={20} className="mb-2 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step: Search ── */}
          {step === "search" && (
            <div className="space-y-3">
              {assetType === "stock_etf" && (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name oder Ticker suchen — z.B. Apple, VWRL, NVDA"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                  {searching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                  )}
                </div>
              )}

              {assetType === "crypto" && (
                <p className="text-xs text-slate-500">Häufige Coins — oder tippe einen Ticker ein:</p>
              )}

              {/* Results list */}
              <div className="space-y-1">
                {results.length === 0 && query.length >= 2 && !searching && (
                  <p className="text-xs text-slate-400 text-center py-6">Keine Ergebnisse für „{query}"</p>
                )}
                {results.length === 0 && (query.length < 2) && assetType === "stock_etf" && (
                  <p className="text-xs text-slate-400 text-center py-6">Mindestens 2 Zeichen eingeben</p>
                )}
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    onClick={() => handleSelectResult(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition text-left"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">
                        {(r.symbol ?? "?").slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {r.shortname ?? r.symbol}
                      </p>
                      <p className="text-xs text-slate-400">
                        {r.symbol} · {r.typeDisp} · {r.exchDisp}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>

              {/* Manual entry fallback */}
              <button
                onClick={() => {
                  setSelected({ symbol: query || "CUSTOM", shortname: query || "Manuelle Eingabe", typeDisp: null, exchDisp: null });
                  setStep("details");
                }}
                className="w-full text-center text-xs text-blue-600 hover:underline py-1"
              >
                Ticker manuell eingeben →
              </button>

              <button
                onClick={() => setStep("type")}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                ← Zurück
              </button>
            </div>
          )}

          {/* ── Step: Details form ── */}
          {step === "details" && selected && (
            <div className="space-y-4">
              {/* Selected instrument */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-blue-600">
                    {(selected.symbol ?? "").slice(0, 3)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selected.shortname ?? selected.symbol}</p>
                  <p className="text-xs text-slate-500">{selected.symbol} · {selected.typeDisp ?? "Equity"}</p>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Menge *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="z.B. 10"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">
                    Kaufkurs *
                    {priceLoading && (
                      <span className="ml-1.5 text-[10px] text-blue-500 font-normal">
                        <Loader2 size={9} className="inline animate-spin mr-0.5" />Echtzeit…
                      </span>
                    )}
                    {!priceLoading && form.price && (
                      <span className="ml-1.5 text-[10px] text-emerald-600 font-normal">Aktueller Kurs</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="Wird automatisch befüllt…"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Kaufdatum *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Währung</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    {["EUR", "USD", "GBP", "CHF", "JPY"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Depot / Konto</label>
                <select
                  value={form.account}
                  onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  {ACCOUNTS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Gebühren (optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.fees}
                    onChange={(e) => setForm((f) => ({ ...f, fees: e.target.value }))}
                    placeholder="z.B. 3.90"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1.5">Notiz (optional)</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="z.B. Sparplan-Kauf"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Total cost preview */}
              {form.quantity && form.price && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Gesamtwert</span>
                    <span className="font-semibold text-slate-900">
                      {(parseFloat(form.quantity) * parseFloat(form.price)).toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {form.currency}
                    </span>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  {saveError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep("search")}
                  disabled={saving}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                >
                  ← Zurück
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isDetailsValid || saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Speichert…" : "Position speichern"}
                </button>
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">Position gespeichert</p>
                <p className="text-sm text-slate-500 mt-1">
                  {selected?.shortname ?? selected?.symbol} wurde zum Portfolio hinzugefügt.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setStep("type");
                    setSelected(null);
                    setQuery("");
                    setResults([]);
                    setForm({ quantity: "", price: "", date: new Date().toISOString().slice(0, 10), account: ACCOUNTS[0], currency: "EUR", notes: "", fees: "" });
                  }}
                  className="w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Weitere Position hinzufügen
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Fertig
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}
