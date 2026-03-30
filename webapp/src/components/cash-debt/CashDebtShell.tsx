"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CashAccountRow, LoanRow } from "@/app/actions/accounts";
import { addCashAccount, addLoan } from "@/app/actions/accounts";
import { Plus, X, Wallet, TrendingDown } from "lucide-react";

interface Props {
  initialCash: CashAccountRow[];
  initialLoans: LoanRow[];
  isDemo?: boolean;
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

// ── Demo data fallback ────────────────────────────────────────────────────────

const DEMO_CASH: CashAccountRow[] = [
  { id: "ca1", name: "DKB Tagesgeld", institution: "DKB", balance: 85000, currency: "EUR", interestRate: 2.5, type: "Savings" },
  { id: "ca2", name: "ING Girokonto", institution: "ING", balance: 12400, currency: "EUR", interestRate: 0, type: "Current" },
];

const DEMO_LOANS: LoanRow[] = [
  { id: "l1", name: "DKB Hypothek — Berliner Str. 12", lender: "DKB", principal: 320000, remaining: 198000, currency: "EUR", rate: 1.85, monthly: 1820, maturity: "2026-05-01", fixedUntil: "2026-05-01", type: "Mortgage", ltv: 51.4 },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function CashDebtShell({ initialCash, initialLoans, isDemo }: Props) {
  const cashAccounts = isDemo ? DEMO_CASH : initialCash;
  const loans = isDemo ? DEMO_LOANS : initialLoans;

  const [showAddCash, setShowAddCash] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [savingCash, setSavingCash] = useState(false);
  const [savingLoan, setSavingLoan] = useState(false);
  const [cashForm, setCashForm] = useState({ name: "", institution: "", balance: "", currency: "EUR", type: "Current" as const });
  const [loanForm, setLoanForm] = useState({
    name: "", lender: "", principal: "", remaining: "", currency: "EUR", rate: "", monthly: "", maturity: "", fixedUntil: "", type: "Mortgage",
  });

  const totalCash = cashAccounts.reduce(
    (s, c) => s + (c.currency === "EUR" ? c.balance : c.balance * 0.93),
    0
  );
  const totalDebt = loans.reduce((s, l) => s + l.remaining, 0);

  const handleAddCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCash(true);
    try {
      await addCashAccount({
        name: cashForm.name,
        institution: cashForm.institution || undefined,
        balance: parseFloat(cashForm.balance) || 0,
        currency: cashForm.currency,
        type: cashForm.type as "Current" | "Savings" | "Fixed" | "FX",
      });
      setShowAddCash(false);
      setCashForm({ name: "", institution: "", balance: "", currency: "EUR", type: "Current" });
    } finally {
      setSavingCash(false);
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLoan(true);
    try {
      await addLoan({
        name: loanForm.name,
        lender: loanForm.lender || undefined,
        principal: parseFloat(loanForm.principal),
        remaining: parseFloat(loanForm.remaining),
        currency: loanForm.currency,
        rate: parseFloat(loanForm.rate),
        monthly: loanForm.monthly ? parseFloat(loanForm.monthly) : undefined,
        maturity: loanForm.maturity || undefined,
        fixedUntil: loanForm.fixedUntil || undefined,
        type: loanForm.type,
      });
      setShowAddLoan(false);
    } finally {
      setSavingLoan(false);
    }
  };

  const setCash = (k: string, v: string) => setCashForm((f) => ({ ...f, [k]: v }));
  const setLoan = (k: string, v: string) => setLoanForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cash & Verbindlichkeiten</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isDemo ? (
              <span className="text-amber-600">Demo-Daten · Konto hinzufügen um echte Daten zu sehen</span>
            ) : (
              "Liquidität und Verbindlichkeiten"
            )}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-emerald-600" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Cash gesamt (EUR)</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalCash, "EUR")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-500" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Schulden gesamt</p>
          </div>
          <p className="text-2xl font-bold text-red-600">−{formatCurrency(totalDebt, "EUR")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Netto-Liquidität</p>
          <p className={`text-2xl font-bold ${totalCash - totalDebt >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatCurrency(totalCash - totalDebt, "EUR")}
          </p>
        </div>
      </div>

      {/* Cash Accounts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Konten & Tagesgeld</h2>
          <button
            onClick={() => setShowAddCash(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={11} /> Konto hinzufügen
          </button>
        </div>

        {cashAccounts.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Konto", "Typ", "Kontostand", "Währung", "Zinsen"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cashAccounts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    {c.institution && <p className="text-xs text-slate-400">{c.institution}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatCurrency(c.balance, c.currency)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.currency}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.interestRate > 0 ? `${c.interestRate.toFixed(2)}% p.a.` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            Noch keine Konten erfasst. Füge dein erstes Konto hinzu.
          </div>
        )}
      </div>

      {/* Add Cash Account Modal */}
      {showAddCash && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md mx-4 mb-4 sm:mb-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Konto hinzufügen</h3>
              <button onClick={() => setShowAddCash(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddCash} className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kontoname">
                  <input type="text" value={cashForm.name} onChange={(e) => setCash("name", e.target.value)} placeholder="DKB Tagesgeld" required className={inputCls} />
                </Field>
                <Field label="Bank / Institut">
                  <input type="text" value={cashForm.institution} onChange={(e) => setCash("institution", e.target.value)} placeholder="DKB" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kontostand">
                  <input type="number" value={cashForm.balance} onChange={(e) => setCash("balance", e.target.value)} placeholder="0" step="0.01" required className={inputCls} />
                </Field>
                <Field label="Währung">
                  <select value={cashForm.currency} onChange={(e) => setCash("currency", e.target.value)} className={inputCls}>
                    {["EUR", "USD", "GBP", "CHF"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Kontotyp">
                <select value={cashForm.type} onChange={(e) => setCash("type", e.target.value)} className={inputCls}>
                  <option value="Current">Girokonto</option>
                  <option value="Savings">Tagesgeld / Sparkonto</option>
                  <option value="Fixed">Festgeld</option>
                  <option value="FX">Fremdwährungskonto</option>
                </select>
              </Field>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddCash(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">Abbrechen</button>
                <button type="submit" disabled={savingCash} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-medium">
                  {savingCash ? "Speichern…" : "Konto speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loans & Mortgages */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Kredite & Hypotheken</h2>
          <button
            onClick={() => setShowAddLoan(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={11} /> Kredit hinzufügen
          </button>
        </div>

        {loans.length > 0 ? (
          loans.map((loan) => (
            <div key={loan.id} className="px-5 py-4 border-b border-slate-50 last:border-0">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{loan.name}</p>
                  <p className="text-xs text-slate-400">{loan.lender ?? "—"} · {loan.type}</p>
                </div>
                {loan.fixedUntil && new Date(loan.fixedUntil) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                  <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
                    ⚠ Zinsbindung endet {formatDate(loan.fixedUntil)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                {[
                  { label: "Ursprünglicher Betrag", value: formatCurrency(loan.principal, loan.currency) },
                  { label: "Restschuld", value: formatCurrency(loan.remaining, loan.currency), red: true },
                  { label: "Zinssatz", value: `${loan.rate.toFixed(2)}% p.a.` },
                  { label: "Monatliche Rate", value: loan.monthly > 0 ? formatCurrency(loan.monthly, loan.currency) : "—" },
                  { label: "LTV", value: loan.ltv != null ? `${loan.ltv.toFixed(1)}%` : "—" },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <p className={`font-semibold mt-0.5 ${m.red ? "text-red-600" : "text-slate-800"}`}>{m.value}</p>
                  </div>
                ))}
              </div>
              {loan.principal > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Tilgungsfortschritt</span>
                    <span>{(((loan.principal - loan.remaining) / loan.principal) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, ((loan.principal - loan.remaining) / loan.principal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            Noch keine Kredite erfasst. Füge deinen ersten Kredit hinzu.
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      {showAddLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md mx-4 mb-4 sm:mb-0 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Kredit hinzufügen</h3>
              <button onClick={() => setShowAddLoan(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddLoan} className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bezeichnung">
                  <input type="text" value={loanForm.name} onChange={(e) => setLoan("name", e.target.value)} placeholder="DKB Hypothek" required className={inputCls} />
                </Field>
                <Field label="Kreditgeber">
                  <input type="text" value={loanForm.lender} onChange={(e) => setLoan("lender", e.target.value)} placeholder="DKB Bank" className={inputCls} />
                </Field>
              </div>
              <Field label="Kredittyp">
                <select value={loanForm.type} onChange={(e) => setLoan("type", e.target.value)} className={inputCls}>
                  <option value="Mortgage">Hypothek / Baudarlehen</option>
                  <option value="Consumer">Konsumkredit</option>
                  <option value="Auto">Autokredit</option>
                  <option value="Business">Unternehmenskredit</option>
                  <option value="Other">Sonstiger Kredit</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ursprünglicher Betrag">
                  <input type="number" value={loanForm.principal} onChange={(e) => setLoan("principal", e.target.value)} placeholder="300000" step="1" required className={inputCls} />
                </Field>
                <Field label="Restschuld">
                  <input type="number" value={loanForm.remaining} onChange={(e) => setLoan("remaining", e.target.value)} placeholder="200000" step="1" required className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Zinssatz (%)">
                  <input type="number" value={loanForm.rate} onChange={(e) => setLoan("rate", e.target.value)} placeholder="2.50" step="0.01" required className={inputCls} />
                </Field>
                <Field label="Monatliche Rate">
                  <input type="number" value={loanForm.monthly} onChange={(e) => setLoan("monthly", e.target.value)} placeholder="1500" step="1" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Währung">
                  <select value={loanForm.currency} onChange={(e) => setLoan("currency", e.target.value)} className={inputCls}>
                    {["EUR", "USD", "GBP", "CHF"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Zinsbindung bis">
                  <input type="date" value={loanForm.fixedUntil} onChange={(e) => setLoan("fixedUntil", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Laufzeit bis (optional)">
                <input type="date" value={loanForm.maturity} onChange={(e) => setLoan("maturity", e.target.value)} className={inputCls} />
              </Field>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddLoan(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">Abbrechen</button>
                <button type="submit" disabled={savingLoan} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-medium">
                  {savingLoan ? "Speichern…" : "Kredit speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
