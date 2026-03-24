import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Cash & Debt" };

const DEMO_CASH = [
  { id: "ca1", name: "DKB Tagesgeld", institution: "DKB", balance: 85000, currency: "EUR", interestRate: 2.5, type: "Savings" },
  { id: "ca2", name: "ING Girokonto", institution: "ING", balance: 12400, currency: "EUR", interestRate: 0, type: "Current" },
  { id: "ca3", name: "Wise USD Account", institution: "Wise", balance: 4200, currency: "USD", interestRate: 0, type: "FX" },
];

const DEMO_LOANS = [
  { id: "l1", name: "DKB Mortgage — Berliner Str. 12", lender: "DKB", principal: 320000, remaining: 198000, currency: "EUR", rate: 1.85, monthly: 1820, maturity: "2026-05-01", fixedUntil: "2026-05-01", type: "Mortgage", ltv: 51.4 },
];

const totalCash = DEMO_CASH.reduce((s, c) => s + (c.currency === "EUR" ? c.balance : c.balance * 0.93), 0);
const totalDebt = DEMO_LOANS.reduce((s, l) => s + l.remaining, 0);

export default async function CashDebtPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Cash & Debt</h1>
        <p className="text-sm text-slate-500 mt-0.5">Liquidity and liabilities overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Cash (EUR equiv.)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalCash, "EUR")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Debt</p>
          <p className="text-2xl font-bold text-red-600 mt-1">−{formatCurrency(totalDebt, "EUR")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Net Liquidity</p>
          <p className={`text-2xl font-bold mt-1 ${totalCash - totalDebt >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatCurrency(totalCash - totalDebt, "EUR")}
          </p>
        </div>
      </div>

      {/* Cash accounts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Cash & Savings</h2>
          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ Add account</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Account", "Type", "Balance", "Currency", "Rate"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {DEMO_CASH.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.institution}</p>
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
      </div>

      {/* Loans */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Loans & Mortgages</h2>
          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ Add loan</button>
        </div>
        {DEMO_LOANS.map((loan) => (
          <div key={loan.id} className="px-5 py-4 border-b border-slate-50 last:border-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{loan.name}</p>
                <p className="text-xs text-slate-400">{loan.lender} · {loan.type}</p>
              </div>
              {new Date(loan.fixedUntil) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg">
                  ⚠ Fixed rate expires {formatDate(loan.fixedUntil)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              {[
                { label: "Original principal", value: formatCurrency(loan.principal, loan.currency) },
                { label: "Remaining", value: formatCurrency(loan.remaining, loan.currency), red: true },
                { label: "Interest rate", value: `${loan.rate}% fixed` },
                { label: "Monthly payment", value: formatCurrency(loan.monthly, loan.currency) },
                { label: "LTV", value: `${loan.ltv.toFixed(1)}%` },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-xs text-slate-400">{m.label}</p>
                  <p className={`font-semibold mt-0.5 ${m.red ? "text-red-600" : "text-slate-800"}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Amortization progress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Principal paid off</span>
                <span>{(((loan.principal - loan.remaining) / loan.principal) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${((loan.principal - loan.remaining) / loan.principal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
