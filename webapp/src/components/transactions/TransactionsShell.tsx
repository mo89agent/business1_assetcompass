"use client";

import { useState } from "react";
import type { TransactionRow } from "@/lib/types";
import { TransactionLedger } from "./TransactionLedger";
import { AddTransactionDrawer } from "./AddTransactionDrawer";
import { Download, Plus } from "lucide-react";

interface Props {
  transactions: TransactionRow[];
  isDemo?: boolean;
}

function exportCsv(transactions: TransactionRow[]) {
  const headers = ["Datum", "Typ", "Konto", "Instrument", "Ticker", "Anzahl", "Kurs", "Betrag", "Währung", "Gebühren", "Steuern", "Beschreibung"];
  const rows = transactions.map((t) => [
    t.executedAt,
    t.type,
    t.accountName,
    t.instrumentName ?? "",
    t.ticker ?? "",
    t.quantity != null ? t.quantity.toString() : "",
    t.price != null ? t.price.toString() : "",
    t.amount.toString(),
    t.currency,
    t.fees.toString(),
    t.taxes.toString(),
    t.description ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TransactionsShell({ transactions, isDemo }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Transaction Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isDemo ? (
              <span className="text-amber-600">Demo-Daten — füge Transaktionen hinzu um echte Daten zu sehen</span>
            ) : (
              `${transactions.length} Buchungen · vollständiges Protokoll`
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCsv(transactions)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            <Download size={13} />
            Export CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
          >
            <Plus size={13} />
            Transaktion hinzufügen
          </button>
        </div>
      </div>

      <TransactionLedger transactions={transactions} />

      <AddTransactionDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
