"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, AlertCircle, ChevronRight, Loader2, X } from "lucide-react";
import { importTransactions } from "@/app/actions/import";

type Step = "upload" | "preview" | "done";

const SUPPORTED_INSTITUTIONS = [
  { id: "trade_republic", name: "Trade Republic", logo: "📱", description: "Portfolio-Export CSV (Konto → Export)" },
  { id: "comdirect", name: "Comdirect", logo: "🏦", description: "Depotauszug / Umsätze CSV" },
  { id: "flatex", name: "Flatex", logo: "🏛️", description: "Depot- und Kontoauszüge" },
  { id: "coinbase", name: "Coinbase", logo: "🪙", description: "Transaction history CSV" },
  { id: "generic", name: "Universell (CSV)", logo: "📄", description: "Beliebiges CSV — Spalten automatisch erkannt" },
];

interface ParsedRow {
  date: string; type: string; ticker: string | null; isin: string | null;
  name: string | null; quantity: number; price: number; amount: number;
  currency: string; fees: number; status: "ok" | "warning" | "error"; warning?: string;
}
interface ParseResult {
  institution: string; headers: string[];
  rows: ParsedRow[];
  stats: { total: number; errors: number; warnings: number; ok: number };
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [institution, setInstitution] = useState<string>("generic");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true); setParseError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("institution", institution);
      const res = await fetch("/api/import/parse", { method: "POST", body: form });
      const data = await res.json() as ParseResult & { error?: string };
      if (data.error) { setParseError(data.error); return; }
      setParseResult(data);
      // Pre-select all ok rows
      setSelectedRows(new Set(data.rows.map((_, i) => i).filter(i => data.rows[i].status !== "error")));
      setStep("preview");
    } catch (e) {
      setParseError("Fehler beim Parsen: " + String(e));
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!parseResult) return;
    setImporting(true);
    const toImport = parseResult.rows.filter((_, i) => selectedRows.has(i));
    try {
      const result = await importTransactions(toImport);
      setImportResult(result);
      setStep("done");
    } catch (e) {
      setParseError("Import-Fehler: " + String(e));
    } finally {
      setImporting(false);
    }
  }

  function toggleRow(i: number) {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const TYPE_COLORS: Record<string, string> = {
    BUY: "bg-emerald-100 text-emerald-700",
    SELL: "bg-red-100 text-red-700",
    DIVIDEND: "bg-blue-100 text-blue-700",
    DEPOSIT: "bg-violet-100 text-violet-700",
    WITHDRAWAL: "bg-amber-100 text-amber-700",
    OTHER: "bg-slate-100 text-slate-600",
  };

  const stepIdx = ["upload", "preview", "done"].indexOf(step);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {["Upload", "Vorschau", "Fertig"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
              i < stepIdx ? "bg-emerald-500 text-white" : i === stepIdx ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
            )}>
              {i < stepIdx ? "✓" : i + 1}
            </div>
            <span className={cn("text-sm", i === stepIdx ? "font-medium text-slate-800" : "text-slate-400")}>{s}</span>
            {i < 2 && <ChevronRight size={14} className="text-slate-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── Step: Upload ──────────────────────────────────────── */}
      {step === "upload" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Datenquelle wählen</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUPPORTED_INSTITUTIONS.map((inst) => (
                <button key={inst.id} onClick={() => setInstitution(inst.id)}
                  className={cn("p-4 rounded-xl border text-left transition",
                    institution === inst.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                  )}>
                  <div className="text-2xl mb-1">{inst.logo}</div>
                  <p className="text-sm font-semibold text-slate-800">{inst.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{inst.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Anleitung */}
          {institution === "trade_republic" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Trade Republic CSV exportieren:</p>
              <p>App → Konto → Aktivität → Exportieren → CSV · Alle Transaktionen</p>
            </div>
          )}
          {institution === "comdirect" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Comdirect CSV exportieren:</p>
              <p>Online Banking → Depot → Depotauszug → als CSV exportieren</p>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Datei hochladen</h2>
            <label htmlFor="file-upload"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition",
                isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                file ? "border-emerald-400 bg-emerald-50" : ""
              )}>
              {file ? (
                <div className="text-center">
                  <FileText size={28} className="text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="mt-1.5 text-xs text-red-500 hover:underline">
                    Entfernen
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={28} className="text-slate-300 mx-auto mb-1.5" />
                  <p className="text-sm text-slate-600">CSV hier ablegen oder klicken</p>
                  <p className="text-xs text-slate-400 mt-0.5">CSV · XLSX · TXT</p>
                </div>
              )}
              <input id="file-upload" type="file" className="hidden" accept=".csv,.xlsx,.txt" onChange={handleFileChange} />
            </label>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={14} className="shrink-0" />{parseError}
            </div>
          )}

          <div className="flex justify-end">
            <button disabled={!file || parsing} onClick={handleParse}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition">
              {parsing && <Loader2 size={14} className="animate-spin" />}
              {parsing ? "Analysiere…" : "Datei analysieren →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Preview ─────────────────────────────────────── */}
      {step === "preview" && parseResult && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600 font-medium">✓ {parseResult.stats.ok} bereit</span>
              {parseResult.stats.warnings > 0 && <span className="text-amber-600 font-medium">⚠ {parseResult.stats.warnings} Warnungen</span>}
              {parseResult.stats.errors > 0 && <span className="text-red-600 font-medium">✗ {parseResult.stats.errors} Fehler</span>}
            </div>
            <span className="text-xs text-slate-400 ml-auto">
              {selectedRows.size} von {parseResult.rows.length} ausgewählt
            </span>
            <button onClick={() => setSelectedRows(new Set(parseResult.rows.map((_, i) => i).filter(i => parseResult.rows[i].status !== "error")))}
              className="text-xs text-blue-600 hover:underline">Alle Ok auswählen</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input type="checkbox"
                        checked={selectedRows.size === parseResult.rows.filter(r => r.status !== "error").length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows(new Set(parseResult.rows.map((_, i) => i).filter(i => parseResult.rows[i].status !== "error")));
                          else setSelectedRows(new Set());
                        }}
                        className="rounded"
                      />
                    </th>
                    {["Datum", "Typ", "ISIN / Ticker", "Name", "Menge", "Kurs", "Betrag", "Status"].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.map((row, i) => (
                    <tr key={i} onClick={() => row.status !== "error" && toggleRow(i)}
                      className={cn("border-b border-slate-50 transition-colors",
                        selectedRows.has(i) ? "bg-blue-50/50" : "hover:bg-slate-50",
                        row.status === "error" ? "opacity-40" : "cursor-pointer"
                      )}>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={selectedRows.has(i)} readOnly disabled={row.status === "error"}
                          className="rounded pointer-events-none" />
                      </td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{row.date}</td>
                      <td className="px-3 py-2">
                        <span className={cn("px-1.5 py-0.5 rounded-md font-medium", TYPE_COLORS[row.type] ?? TYPE_COLORS.OTHER)}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-500">{row.isin ?? row.ticker ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-[140px] truncate">{row.name ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-600 tabular-nums">{row.quantity > 0 ? row.quantity.toLocaleString("de-DE", { maximumFractionDigits: 4 }) : "—"}</td>
                      <td className="px-3 py-2 text-slate-600 tabular-nums">{row.price > 0 ? row.price.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                      <td className="px-3 py-2 text-slate-700 font-medium tabular-nums">{row.amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.currency}</td>
                      <td className="px-3 py-2">
                        {row.status === "ok" && <CheckCircle2 size={13} className="text-emerald-500" />}
                        {row.status === "warning" && <span title={row.warning}><AlertCircle size={13} className="text-amber-500" /></span>}
                        {row.status === "error" && <X size={13} className="text-red-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {parseError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={14} className="shrink-0" />{parseError}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => { setStep("upload"); setParseResult(null); }}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">← Zurück</button>
            <button disabled={selectedRows.size === 0 || importing} onClick={handleImport}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition">
              {importing && <Loader2 size={14} className="animate-spin" />}
              {importing ? "Importiere…" : `${selectedRows.size} Transaktionen importieren →`}
            </button>
          </div>
        </div>
      )}

      {/* ── Done ─────────────────────────────────────────────── */}
      {step === "done" && importResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Import abgeschlossen</h2>
          <p className="text-sm text-slate-500 mb-6">
            <span className="font-semibold text-emerald-600">{importResult.imported} Transaktionen</span> importiert
            {importResult.skipped > 0 && <> · {importResult.skipped} übersprungen</>}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep("upload"); setFile(null); setParseResult(null); setImportResult(null); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">
              Weitere Datei importieren
            </button>
            <a href="/dashboard/holdings" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Portfolio ansehen →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
