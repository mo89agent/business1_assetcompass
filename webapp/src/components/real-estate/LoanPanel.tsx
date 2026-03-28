"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import type { PropertyRecord, PropertyMetrics } from "@/lib/types";
import { AlertTriangle, Clock, Shield, TrendingUp } from "lucide-react";

interface Props {
  property: PropertyRecord;
  metrics: PropertyMetrics;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - new Date("2026-03-28").getTime()) / 86_400_000);
}

function refinancePayment(balance: number, annualRatePct: number, months: number): number {
  if (months <= 0 || balance <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return balance / months;
  return balance * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function LoanPanel({ property, metrics }: Props) {
  const { loans, currency } = property;

  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
        <Shield size={28} className="text-emerald-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Schuldenfreiheit</p>
        <p className="text-xs text-slate-400">
          Diese Immobilie ist vollständig entschuldet. Kein Kapitaldienst.
        </p>
      </div>
    );
  }

  const totalLoanBalance = metrics.totalLoanBalance;
  const ltv = metrics.ltv;

  return (
    <div className="space-y-5">
      {loans.map((loan) => {
        const monthlyInterest = loan.remainingBalance * (loan.interestRatePct / 100 / 12);
        const monthlyPrincipal = loan.monthlyPayment - monthlyInterest;
        const principalPct = loan.monthlyPayment > 0 ? (monthlyPrincipal / loan.monthlyPayment) * 100 : 0;
        const interestPct = 100 - principalPct;

        // Fixed rate countdown
        const fixedDaysLeft = loan.fixedRateUntil ? daysUntil(loan.fixedRateUntil) : null;
        const isUrgent = fixedDaysLeft != null && fixedDaysLeft <= 90;
        const isExpired = fixedDaysLeft != null && fixedDaysLeft < 0;

        // Remaining term from today to loan end
        const loanEndYear = new Date(loan.startDate).getFullYear() + loan.termYears;
        const loanEndDate = new Date(loan.startDate);
        loanEndDate.setFullYear(loanEndYear);
        const remainingMonths = Math.max(
          0,
          Math.round((loanEndDate.getTime() - new Date("2026-03-28").getTime()) / (30 * 86_400_000))
        );

        // Balance at fixed rate expiry (approx: simple monthly amortization)
        const monthsUntilRefix = fixedDaysLeft != null ? Math.max(0, Math.round(fixedDaysLeft / 30)) : 0;
        const balanceAtRefix = loan.remainingBalance - monthlyPrincipal * monthsUntilRefix;
        const remainingMonthsAtRefix = Math.max(0, remainingMonths - monthsUntilRefix);

        // Rate sensitivity scenarios for refinancing
        const sensitivityRates = [1.85, 3.0, 3.5, 4.0, 4.5];
        const sensitivityRows = sensitivityRates.map((rate) => {
          const newPmt = refinancePayment(balanceAtRefix, rate, remainingMonthsAtRefix);
          const delta = newPmt - loan.monthlyPayment;
          return { rate, newPmt, delta };
        });

        return (
          <div key={loan.id} className="space-y-4">
            {/* Fixed rate expiry alert */}
            {loan.isFixedRate && loan.fixedRateUntil && (
              <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                isExpired
                  ? "bg-red-50 border-red-200"
                  : isUrgent
                  ? "bg-amber-50 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <AlertTriangle
                  size={16}
                  className={`shrink-0 mt-0.5 ${isExpired ? "text-red-500" : isUrgent ? "text-amber-500" : "text-slate-400"}`}
                />
                <div>
                  <p className={`text-sm font-semibold ${isExpired ? "text-red-700" : isUrgent ? "text-amber-700" : "text-slate-700"}`}>
                    {isExpired
                      ? "Zinsbindung abgelaufen!"
                      : isUrgent
                      ? `Zinsbindung läuft in ${fixedDaysLeft} Tagen ab`
                      : `Zinsbindung bis ${formatDate(loan.fixedRateUntil)}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aktueller Zinssatz: {loan.interestRatePct.toFixed(2)}% p.a. fest ·
                    Restschuld bei Auslauf: ca.{" "}
                    {formatCurrency(Math.max(0, balanceAtRefix), currency)}
                  </p>
                </div>
              </div>
            )}

            {/* Loan summary card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{loan.lender}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ursprünglich {formatCurrency(loan.originalAmount, currency)} ·{" "}
                    Laufzeit {loan.termYears} Jahre · Start {formatDate(loan.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(loan.remainingBalance, currency)}
                  </p>
                  <p className="text-xs text-slate-400">Restschuld</p>
                </div>
              </div>

              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Zinssatz</p>
                  <p className="text-sm font-semibold text-slate-800">{loan.interestRatePct.toFixed(2)}%</p>
                  <p className="text-[10px] text-slate-400">{loan.isFixedRate ? "Fest" : "Variabel"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Monatliche Rate</p>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(loan.monthlyPayment, currency)}</p>
                  <p className="text-[10px] text-slate-400">Annuität</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">LTV (aktuell)</p>
                  <p className={`text-sm font-semibold ${ltv > 70 ? "text-red-600" : ltv > 60 ? "text-amber-600" : "text-slate-800"}`}>
                    {ltv.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-400">auf Schätzwert Mitte</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Restlaufzeit</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {Math.floor(remainingMonths / 12)}J {remainingMonths % 12}M
                  </p>
                  <p className="text-[10px] text-slate-400">~{remainingMonths} Monate</p>
                </div>
              </div>

              {/* Principal vs interest bar */}
              <div className="px-5 pb-4 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Aktuelle Ratenaufteilung (diesen Monat)</p>
                <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="h-full bg-blue-500 flex items-center justify-center"
                    style={{ width: `${principalPct}%` }}
                  >
                    {principalPct > 15 && (
                      <span className="text-[9px] text-white font-medium">Tilgung</span>
                    )}
                  </div>
                  <div
                    className="h-full bg-red-300 flex items-center justify-center"
                    style={{ width: `${interestPct}%` }}
                  >
                    {interestPct > 10 && (
                      <span className="text-[9px] text-white font-medium">Zins</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span>
                    <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1" />
                    Tilgung: <strong>{formatCurrency(monthlyPrincipal, currency)}</strong>
                    <span className="text-slate-400 ml-1">(Eigenkapitalaufbau)</span>
                  </span>
                  <span>
                    <span className="inline-block w-2 h-2 rounded-sm bg-red-300 mr-1" />
                    Zinsen: <strong>{formatCurrency(monthlyInterest, currency)}</strong>
                    <span className="text-slate-400 ml-1">(Aufwand)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Rate sensitivity table */}
            {loan.isFixedRate && loan.fixedRateUntil && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={14} className="text-slate-400" />
                    Anschlussfinanzierung — Zinssensitivität
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Restschuld {formatCurrency(Math.max(0, balanceAtRefix), currency)} ·{" "}
                    Restlaufzeit {Math.floor(remainingMonthsAtRefix / 12)}J {remainingMonthsAtRefix % 12}M ·{" "}
                    Was kostet ein höherer Zins?
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-50 bg-slate-50/50">
                        <th className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Zinssatz</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Neue Monatsrate</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Δ zur heutigen Rate</th>
                        <th className="text-right px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Mehrkosten p.a.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sensitivityRows.map((row) => {
                        const isCurrent = row.rate === loan.interestRatePct;
                        const isHigher = row.delta > 0;
                        return (
                          <tr key={row.rate} className={isCurrent ? "bg-blue-50/40" : ""}>
                            <td className="px-5 py-3 text-sm text-slate-700">
                              {row.rate.toFixed(2)}%
                              {isCurrent && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Aktuell</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                              {formatCurrency(row.newPmt, currency)}
                            </td>
                            <td className={`px-4 py-3 text-right text-sm font-semibold ${isCurrent ? "text-slate-400" : isHigher ? "text-red-600" : "text-emerald-600"}`}>
                              {isCurrent ? "—" : `${isHigher ? "+" : ""}${formatCurrency(row.delta, currency)}`}
                            </td>
                            <td className={`px-5 py-3 text-right text-sm ${isCurrent ? "text-slate-400" : isHigher ? "text-red-500" : "text-emerald-600"}`}>
                              {isCurrent ? "—" : `${isHigher ? "+" : ""}${formatCurrency(row.delta * 12, currency)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400">
                    Schätzung auf Basis der heutigen Restschuld und Restlaufzeit. Kein Finanzrat.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
