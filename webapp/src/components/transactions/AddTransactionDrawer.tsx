"use client";

import { useState } from "react";
import { DrawerShell } from "@/components/ui/DrawerShell";
import { addTransaction } from "@/app/actions/transactions";

const TX_TYPES = [
  { value: "BUY", label: "Kauf" },
  { value: "SELL", label: "Verkauf" },
  { value: "DIVIDEND", label: "Dividende" },
  { value: "DEPOSIT", label: "Einzahlung" },
  { value: "WITHDRAWAL", label: "Auszahlung" },
  { value: "INTEREST_INCOME", label: "Zinserträge" },
  { value: "RENT_INCOME", label: "Mieteinnahmen" },
  { value: "FEE", label: "Gebühr" },
  { value: "TAX", label: "Steuer" },
  { value: "LOAN_PAYMENT", label: "Kreditzahlung" },
  { value: "STAKING_REWARD", label: "Staking Reward" },
];

const NEEDS_INSTRUMENT = new Set(["BUY", "SELL", "DIVIDEND", "STAKING_REWARD"]);
const NEEDS_QTY_PRICE = new Set(["BUY", "SELL"]);

interface Props {
  open: boolean;
  onClose: () => void;
  defaultAccount?: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

export function AddTransactionDrawer({ open, onClose, defaultAccount = "" }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "BUY",
    executedAt: new Date().toISOString().split("T")[0],
    accountName: defaultAccount,
    ticker: "",
    quantity: "",
    price: "",
    amount: "",
    currency: "EUR",
    fees: "",
    taxes: "",
    description: "",
  });

  const needsInstrument = NEEDS_INSTRUMENT.has(form.type);
  const needsQtyPrice = NEEDS_QTY_PRICE.has(form.type);

  // Auto-calc amount from qty * price
  const calcAmount = () => {
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.price);
    if (!isNaN(qty) && !isNaN(price)) {
      const sign = form.type === "SELL" ? 1 : -1;
      const fees = parseFloat(form.fees) || 0;
      return String((qty * price * sign - (form.type === "BUY" ? fees : 0)).toFixed(2));
    }
    return form.amount;
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const amount = needsQtyPrice ? parseFloat(calcAmount()) : parseFloat(form.amount);
      await addTransaction({
        type: form.type,
        executedAt: form.executedAt,
        accountName: form.accountName.trim(),
        ticker: needsInstrument && form.ticker ? form.ticker.trim() : null,
        quantity: needsQtyPrice && form.quantity ? parseFloat(form.quantity) : null,
        price: needsQtyPrice && form.price ? parseFloat(form.price) : null,
        amount,
        currency: form.currency,
        fees: form.fees ? parseFloat(form.fees) : 0,
        taxes: form.taxes ? parseFloat(form.taxes) : 0,
        description: form.description || undefined,
      });
      onClose();
      setForm((f) => ({ ...f, ticker: "", quantity: "", price: "", amount: "", fees: "", taxes: "", description: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DrawerShell open={open} onClose={onClose} title="Transaktion hinzufügen" subtitle="Manuell erfassen">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <Field label="Typ">
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inputCls}
            >
              {TX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Datum">
            <input
              type="date"
              value={form.executedAt}
              onChange={(e) => set("executedAt", e.target.value)}
              required
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Konto / Depot">
          <input
            type="text"
            value={form.accountName}
            onChange={(e) => set("accountName", e.target.value)}
            placeholder="z.B. Flatex Depot"
            required
            className={inputCls}
          />
        </Field>

        {needsInstrument && (
          <Field label="Ticker (optional)">
            <input
              type="text"
              value={form.ticker}
              onChange={(e) => set("ticker", e.target.value.toUpperCase())}
              placeholder="z.B. AAPL, VWRL, BTC"
              className={inputCls}
            />
          </Field>
        )}

        {needsQtyPrice ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Anzahl">
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="0"
                step="any"
                min="0"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Kurs">
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                required
                className={inputCls}
              />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Betrag">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
                step="any"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Währung">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls}>
                {["EUR", "USD", "GBP", "CHF", "JPY"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {needsQtyPrice && (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Währung">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls}>
                {["EUR", "USD", "GBP", "CHF", "JPY"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Gebühren">
              <input
                type="number"
                value={form.fees}
                onChange={(e) => set("fees", e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                className={inputCls}
              />
            </Field>
            <Field label="Steuern">
              <input
                type="number"
                value={form.taxes}
                onChange={(e) => set("taxes", e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {!needsQtyPrice && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gebühren">
              <input
                type="number"
                value={form.fees}
                onChange={(e) => set("fees", e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                className={inputCls}
              />
            </Field>
            <Field label="Steuern">
              <input
                type="number"
                value={form.taxes}
                onChange={(e) => set("taxes", e.target.value)}
                placeholder="0.00"
                step="any"
                min="0"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        <Field label="Beschreibung (optional)">
          <input
            type="text"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Notiz zur Transaktion"
            className={inputCls}
          />
        </Field>

        {needsQtyPrice && form.quantity && form.price && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Berechneter Betrag: </span>
              {(parseFloat(form.quantity) * parseFloat(form.price)).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {form.currency}
              {form.fees ? ` (+ ${parseFloat(form.fees).toFixed(2)} Gebühren)` : ""}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-medium"
          >
            {saving ? "Speichern…" : "Transaktion speichern"}
          </button>
        </div>
      </form>
    </DrawerShell>
  );
}
