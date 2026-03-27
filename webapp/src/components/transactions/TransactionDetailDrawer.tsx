"use client";

import { DrawerShell } from "@/components/ui/DrawerShell";
import { SourceChip } from "@/components/ui/SourceChip";
import { cn, formatCurrency, formatDate, TX_TYPE_LABELS } from "@/lib/utils";
import type { TransactionRow } from "@/lib/types";
import { CheckCircle2, AlertCircle, Copy, AlertTriangle } from "lucide-react";

interface TransactionDetailDrawerProps {
  transaction: TransactionRow | null;
  onClose: () => void;
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0 w-28">{label}</span>
      <span className="text-xs text-slate-800 text-right flex-1 min-w-0">{children}</span>
    </div>
  );
}

export function TransactionDetailDrawer({ transaction: tx, onClose }: TransactionDetailDrawerProps) {
  if (!tx) return null;

  const isPositive = tx.amount >= 0;

  return (
    <DrawerShell
      open={!!tx}
      onClose={onClose}
      title={TX_TYPE_LABELS[tx.type] ?? tx.type}
      subtitle={`${formatDate(tx.executedAt)} · ${tx.accountName}`}
    >
      <div className="px-6 py-5 space-y-6">

        {/* Amount hero */}
        <div className="text-center py-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Betrag</p>
          <p className={cn("text-3xl font-bold", isPositive ? "text-emerald-700" : "text-red-600")}>
            {isPositive ? "+" : ""}{formatCurrency(tx.amount, tx.currency)}
          </p>
          <span
            className={cn(
              "inline-block mt-2 px-2.5 py-0.5 rounded-md text-xs font-medium",
              TX_TYPE_COLOR[tx.type] ?? "bg-slate-100 text-slate-600"
            )}
          >
            {TX_TYPE_LABELS[tx.type] ?? tx.type}
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {tx.isVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <CheckCircle2 size={12} /> Verifiziert
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
              <AlertCircle size={12} /> Nicht verifiziert
            </span>
          )}
          {tx.isDuplicate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
              <Copy size={12} /> Mögliches Duplikat
            </span>
          )}
        </div>

        {/* Review note */}
        {tx.reviewNote && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">{tx.reviewNote}</p>
          </div>
        )}

        {/* Core fields */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Buchungsdetails</h3>
          <div>
            <Row label="Datum">{formatDate(tx.executedAt)}</Row>
            {tx.settledAt && <Row label="Settlement">{formatDate(tx.settledAt)}</Row>}
            <Row label="Konto">{tx.accountName}</Row>
            {tx.instrumentName && (
              <Row label="Instrument">
                {tx.instrumentName}
                {tx.ticker && <span className="ml-1.5 text-slate-400">({tx.ticker})</span>}
              </Row>
            )}
            {tx.quantity != null && (
              <Row label="Anzahl">{tx.quantity.toLocaleString("de-DE")}</Row>
            )}
            {tx.price != null && (
              <Row label="Kurs">{formatCurrency(tx.price, tx.currency, { maximumFractionDigits: 4 })}</Row>
            )}
            <Row label="Betrag">
              <span className={isPositive ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"}>
                {isPositive ? "+" : ""}{formatCurrency(tx.amount, tx.currency)}
              </span>
            </Row>
            {tx.fees > 0 && (
              <Row label="Gebühren">{formatCurrency(tx.fees, tx.currency)}</Row>
            )}
            {tx.taxes > 0 && (
              <Row label="Steuern">{formatCurrency(tx.taxes, tx.currency)}</Row>
            )}
            {tx.description && (
              <Row label="Beschreibung">{tx.description}</Row>
            )}
          </div>
        </section>

        {/* Provenance */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Datenherkunft</h3>
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Quelle</span>
              <SourceChip source={tx.source} />
            </div>
            {tx.source.importFile && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Datei</span>
                <span className="text-xs text-slate-700 font-mono">{tx.source.importFile}</span>
              </div>
            )}
            {tx.source.importRow != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Zeile</span>
                <span className="text-xs text-slate-700">{tx.source.importRow}</span>
              </div>
            )}
            {tx.source.fetchedAt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Abgerufen</span>
                <span className="text-xs text-slate-700">
                  {new Date(tx.source.fetchedAt).toLocaleString("de-DE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">ID</span>
              <span className="text-xs text-slate-400 font-mono">{tx.id}</span>
            </div>
          </div>
        </section>

        {/* Duplicate reference */}
        {tx.duplicateOfId && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Duplikat von</h3>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-red-700 font-mono">{tx.duplicateOfId}</p>
            </div>
          </section>
        )}

      </div>
    </DrawerShell>
  );
}
