"use client";

import { useState } from "react";
import { cn, formatCurrency, formatDate, TX_TYPE_LABELS } from "@/lib/utils";
import type { TransactionRow, TransactionType } from "@/lib/types";
import { CheckCircle2, AlertCircle, Copy } from "lucide-react";

interface TransactionLedgerProps {
  transactions: TransactionRow[];
}

const TX_TYPE_COLOR: Record<string, string> = {
  BUY: "bg-blue-50 text-blue-700",
  SELL: "bg-purple-50 text-purple-700",
  DEPOSIT: "bg-emerald-50 text-emerald-700",
  WITHDRAWAL: "bg-red-50 text-red-700",
  DIVIDEND: "bg-yellow-50 text-yellow-700",
  INTEREST_INCOME: "bg-teal-50 text-teal-700",
  INTEREST_EXPENSE: "bg-red-50 text-red-700",
  RENT_INCOME: "bg-orange-50 text-orange-700",
  FEE: "bg-slate-100 text-slate-600",
  TAX: "bg-slate-100 text-slate-600",
  STAKING_REWARD: "bg-violet-50 text-violet-700",
  LOAN_PAYMENT: "bg-slate-100 text-slate-600",
  TRANSFER_IN: "bg-emerald-50 text-emerald-700",
  TRANSFER_OUT: "bg-amber-50 text-amber-700",
};

const ALL_TYPES: TransactionType[] = ["BUY", "SELL", "DIVIDEND", "DEPOSIT", "WITHDRAWAL", "RENT_INCOME", "INTEREST_INCOME", "FEE", "LOAN_PAYMENT", "STAKING_REWARD"];

export function TransactionLedger({ transactions }: TransactionLedgerProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null);
  const [search, setSearch] = useState("");

  const filtered = transactions
    .filter((t) => !typeFilter || t.type === typeFilter)
    .filter(
      (t) =>
        !search ||
        t.accountName.toLowerCase().includes(search.toLowerCase()) ||
        (t.instrumentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Filters */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 transition"
        />
        <button
          onClick={() => setTypeFilter(null)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition",
            typeFilter === null ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          All
        </button>
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition",
              typeFilter === t ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            {TX_TYPE_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Account / Asset</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Qty</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Price</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Fees/Tax</th>
              <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {formatDate(tx.executedAt)}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap",
                      TX_TYPE_COLOR[tx.type] ?? "bg-slate-100 text-slate-600"
                    )}
                  >
                    {TX_TYPE_LABELS[tx.type] ?? tx.type}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {tx.instrumentName ?? tx.accountName}
                      {tx.ticker && (
                        <span className="ml-1.5 text-xs text-slate-400">{tx.ticker}</span>
                      )}
                    </p>
                    {tx.instrumentName && (
                      <p className="text-xs text-slate-400">{tx.accountName}</p>
                    )}
                    {tx.description && (
                      <p className="text-xs text-slate-400 italic">{tx.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-sm text-slate-600 hidden lg:table-cell">
                  {tx.quantity != null ? tx.quantity.toLocaleString("de-DE") : "—"}
                </td>
                <td className="px-3 py-3 text-right text-sm text-slate-600 hidden lg:table-cell">
                  {tx.price != null ? formatCurrency(tx.price, tx.currency, { maximumFractionDigits: 2 }) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      tx.amount >= 0 ? "text-emerald-700" : "text-red-600"
                    )}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-xs text-slate-400 hidden md:table-cell">
                  {tx.fees > 0 && <span className="block">Fee: {formatCurrency(tx.fees, tx.currency)}</span>}
                  {tx.taxes > 0 && <span className="block">Tax: {formatCurrency(tx.taxes, tx.currency)}</span>}
                  {tx.fees === 0 && tx.taxes === 0 && "—"}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    {tx.isVerified ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={13} className="text-amber-500" />
                    )}
                    {tx.isDuplicate && <span title="Possible duplicate"><Copy size={13} className="text-red-400" /></span>}
                    <span className="text-xs text-slate-400 truncate max-w-24">
                      {tx.provenance?.replace("csv_import:", "") ?? "manual"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            No transactions match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
