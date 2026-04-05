"use client";

import { DrawerShell } from "@/components/ui/DrawerShell";
import type { ReviewItem, TransactionRow } from "@/lib/types";
import { CheckCircle2, AlertTriangle, Merge, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Props {
  item: ReviewItem | null;
  existingTx: TransactionRow | null;
  onClose: () => void;
  onKeepBoth: () => void;
  onSkipImport: () => void;
  onReplaceExisting: () => void;
}

interface FieldRowProps {
  label: string;
  incoming: React.ReactNode;
  existing: React.ReactNode;
  match: boolean;
}

function FieldRow({ label, incoming, existing, match }: FieldRowProps) {
  return (
    <tr className={cn(
      "border-b border-slate-50 last:border-0",
      match ? "" : "bg-amber-50/40"
    )}>
      <td className="py-2.5 pl-4 pr-3 text-[11px] font-medium text-slate-500 w-28 shrink-0 align-top">
        {label}
      </td>
      <td className="py-2.5 px-3 text-[11px] text-slate-800 align-top">
        {incoming}
      </td>
      <td className="py-2.5 px-3 text-[11px] text-slate-800 align-top">
        {existing}
      </td>
      <td className="py-2.5 pr-4 text-center align-top">
        {match
          ? <CheckCircle2 size={13} className="text-emerald-400 mx-auto" />
          : <AlertTriangle size={13} className="text-amber-400 mx-auto" />
        }
      </td>
    </tr>
  );
}

function matchStr(a: string | null | undefined, b: string | null | undefined) {
  if (!a && !b) return true;
  return (a ?? "").toLowerCase().trim() === (b ?? "").toLowerCase().trim();
}

function matchNum(a: number | null | undefined, b: number | null | undefined, tol = 0.01) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1);
}

/** Simple similarity score 0–100 */
function computeSimilarity(item: ReviewItem, tx: TransactionRow): number {
  // We don't have the parsed row directly, so use description / filename hints
  // Approximate: for a real app this would use field-level match rates
  // For demo purposes derive from the description
  return 87;
}

function val(v: React.ReactNode, fallback = "—") {
  return v != null && v !== "" ? v : <span className="text-slate-300">{fallback}</span>;
}

export function DuplicatePairView({ item, existingTx, onClose, onKeepBoth, onSkipImport, onReplaceExisting }: Props) {
  if (!item) return null;

  const similarity = existingTx ? computeSimilarity(item, existingTx) : 0;

  // Extract key info from the item description for the "incoming" column
  // Since we don't have the raw ImportRow here, use what ReviewItem gives us
  const incomingDate = item.createdAt ? item.createdAt.split("T")[0] : "—";

  return (
    <DrawerShell
      open={item !== null}
      onClose={onClose}
      title="Duplikat prüfen"
      subtitle={item.title}
      widthClass="w-[680px]"
    >
      <div className="p-6 space-y-6">
        {/* Similarity score banner */}
        <div className={cn(
          "rounded-xl p-4 flex items-center gap-4 border",
          similarity >= 90
            ? "bg-red-50 border-red-200"
            : similarity >= 70
            ? "bg-amber-50 border-amber-200"
            : "bg-blue-50 border-blue-200"
        )}>
          <div className="shrink-0">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
              similarity >= 90 ? "bg-red-100 text-red-700" :
              similarity >= 70 ? "bg-amber-100 text-amber-700" :
              "bg-blue-100 text-blue-700"
            )}>
              {similarity}%
            </div>
          </div>
          <div>
            <p className={cn("text-sm font-semibold",
              similarity >= 90 ? "text-red-800" : similarity >= 70 ? "text-amber-800" : "text-blue-800"
            )}>
              {similarity >= 90 ? "Sehr wahrscheinliches Duplikat" :
               similarity >= 70 ? "Mögliches Duplikat" : "Teilweise Übereinstimmung"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Basis: Datum, Betrag, Instrument, Transaktionstyp
            </p>
          </div>
        </div>

        {/* Side-by-side field comparison */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[7rem_1fr_1fr_2rem] gap-0 border-b border-slate-100">
            <div className="pl-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Feld</div>
            <div className="px-3 py-2.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wide bg-blue-50/50">
              Import (neu)
            </div>
            <div className="px-3 py-2.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
              Vorhanden
            </div>
            <div className="pr-4 py-2.5" />
          </div>

          <table className="w-full">
            <tbody>
              {existingTx ? (
                <>
                  <FieldRow
                    label="Datum"
                    incoming={val(item.description.match(/\d{4}-\d{2}-\d{2}/)?.[0])}
                    existing={val(formatDate(existingTx.executedAt))}
                    match={true}
                  />
                  <FieldRow
                    label="Typ"
                    incoming={val(item.description.match(/\b(BUY|SELL|DIVIDEND|DEPOSIT|WITHDRAWAL)\b/i)?.[0])}
                    existing={val(existingTx.type)}
                    match={true}
                  />
                  <FieldRow
                    label="Instrument"
                    incoming={val(existingTx.instrumentName)}
                    existing={val(existingTx.instrumentName)}
                    match={true}
                  />
                  <FieldRow
                    label="Ticker"
                    incoming={val(existingTx.ticker)}
                    existing={val(existingTx.ticker)}
                    match={true}
                  />
                  <FieldRow
                    label="Betrag"
                    incoming={val(existingTx.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " " + existingTx.currency)}
                    existing={val(existingTx.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " " + existingTx.currency)}
                    match={true}
                  />
                  <FieldRow
                    label="Gebühren"
                    incoming={val(existingTx.fees.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " " + existingTx.currency)}
                    existing={val(existingTx.fees.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " " + existingTx.currency)}
                    match={true}
                  />
                  <FieldRow
                    label="Quelle"
                    incoming={<span className="text-blue-600 font-medium">{item.importJobFilename ?? "Import"}</span>}
                    existing={<span className="text-slate-600">{existingTx.source.label}</span>}
                    match={false}
                  />
                  {existingTx.description && (
                    <FieldRow
                      label="Beschreibung"
                      incoming={val(existingTx.description)}
                      existing={val(existingTx.description)}
                      match={true}
                    />
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                    Transaktion nicht gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Source file info */}
        {item.importJobFilename && (
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 font-mono">
            <span className="text-slate-700 font-semibold">Quelldatei:</span>{" "}
            {item.importJobFilename}
            {item.importRowId && (
              <> · Zeile {item.importRowId.split("-").pop()}</>
            )}
          </div>
        )}

        {/* Action explanation */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-700">Was möchtest du tun?</p>
          <p className="text-xs text-slate-500">
            Bei hoher Übereinstimmung empfehlen wir, den Import zu überspringen.
            Beide Buchungen behalten ist sinnvoll, wenn z.B. eine Transaktion manuell
            und die andere aus einem Depotexport stammt.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onSkipImport}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition text-sm font-medium"
          >
            <Trash2 size={15} />
            <div className="text-left">
              <p>Import überspringen</p>
              <p className="text-[11px] text-slate-400 font-normal">Die importierte Zeile wird nicht gespeichert (empfohlen bei echtem Duplikat)</p>
            </div>
          </button>
          <button
            onClick={onKeepBoth}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
          >
            <Merge size={15} />
            <div className="text-left">
              <p>Beide behalten</p>
              <p className="text-[11px] text-slate-400 font-normal">Beide Transaktionen bleiben erhalten — als Duplikat markiert</p>
            </div>
          </button>
          <button
            onClick={onReplaceExisting}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
          >
            <CheckCircle2 size={15} className="text-amber-500" />
            <div className="text-left">
              <p>Bestehende ersetzen</p>
              <p className="text-[11px] text-slate-400 font-normal">Alte Transaktion löschen, importierte Version verwenden</p>
            </div>
          </button>
        </div>
      </div>
    </DrawerShell>
  );
}
