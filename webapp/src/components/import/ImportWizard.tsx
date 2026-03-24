"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle2, AlertCircle, ChevronRight, X } from "lucide-react";

type Step = "upload" | "mapping" | "preview" | "done";

const SUPPORTED_INSTITUTIONS = [
  { id: "flatex", name: "Flatex", logo: "🏦", description: "Depot statements, trade confirmations" },
  { id: "trade_republic", name: "Trade Republic", logo: "📱", description: "Portfolio export CSV" },
  { id: "dkb", name: "DKB", logo: "🏛️", description: "Account statements, securities" },
  { id: "coinbase", name: "Coinbase", logo: "🪙", description: "Transaction history CSV" },
  { id: "kraken", name: "Kraken", logo: "🐙", description: "Ledger export" },
  { id: "generic", name: "Generic CSV", logo: "📄", description: "Map columns manually" },
];

interface UploadedFile {
  name: string;
  size: number;
  rows?: number;
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [institution, setInstitution] = useState<string | null>(null);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile({ name: f.name, size: f.size, rows: undefined });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile({ name: f.name, size: f.size });
  }

  const STEPS = ["Upload", "Mapping", "Preview", "Done"];
  const stepIdx = ["upload", "mapping", "preview", "done"].indexOf(step);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                i < stepIdx ? "bg-emerald-500 text-white" : i === stepIdx ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
              )}
            >
              {i < stepIdx ? "✓" : i + 1}
            </div>
            <span className={cn("text-sm", i === stepIdx ? "font-medium text-slate-800" : "text-slate-400")}>
              {s}
            </span>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-5">
          {/* Institution selector */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Select source</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUPPORTED_INSTITUTIONS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setInstitution(institution === inst.id ? null : inst.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition",
                    institution === inst.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="text-2xl mb-1">{inst.logo}</div>
                  <p className="text-sm font-semibold text-slate-800">{inst.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{inst.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* File drop zone */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Upload file</h2>
            <label
              htmlFor="file-upload"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition",
                isDragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                file ? "border-emerald-400 bg-emerald-50" : ""
              )}
            >
              {file ? (
                <div className="text-center">
                  <FileText size={32} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Drop your CSV or PDF here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              disabled={!file}
              onClick={() => setStep("mapping")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step: Mapping */}
      {step === "mapping" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Column Mapping</h2>
            <p className="text-xs text-slate-500 mb-4">
              We detected{" "}
              <strong className="text-slate-700">
                {institution ? SUPPORTED_INSTITUTIONS.find((i) => i.id === institution)?.name : "Generic"}
              </strong>{" "}
              format. Verify the mapping below.
            </p>

            <div className="space-y-2">
              {[
                { field: "Date", detected: "Datum", status: "ok" },
                { field: "Amount", detected: "Betrag", status: "ok" },
                { field: "Currency", detected: "Währung", status: "ok" },
                { field: "Transaction Type", detected: "(auto-detected from description)", status: "ok" },
                { field: "ISIN / Ticker", detected: "ISIN", status: "ok" },
                { field: "Quantity", detected: "Anzahl", status: "warning" },
                { field: "Price", detected: "Kurs", status: "ok" },
                { field: "Fee", detected: "Provision", status: "ok" },
              ].map((row) => (
                <div key={row.field} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-36 text-xs font-medium text-slate-600">{row.field}</div>
                  <div className="flex-1 text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                    {row.detected}
                  </div>
                  {row.status === "ok" ? (
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep("upload")} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
              ← Back
            </button>
            <button onClick={() => setStep("preview")} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Preview import →
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Preview (first 5 rows)</h2>
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-600">✓ 47 rows ready</span>
                <span className="text-amber-600">⚠ 2 warnings</span>
                <span className="text-red-600">✗ 0 errors</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Date", "Type", "Asset", "Qty", "Price", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["20.03.2026", "BUY", "VWRL", "10", "€112.40", "€1,127.90", "✓"],
                    ["19.03.2026", "DIVIDEND", "MSFT", "—", "—", "$187.50", "✓"],
                    ["15.03.2026", "FEE", "Depot", "—", "—", "−€3.90", "⚠"],
                    ["10.03.2026", "SELL", "NVDA", "5", "$618", "$3,086", "✓"],
                    ["01.03.2026", "DEPOSIT", "EUR Cash", "—", "—", "€5,000", "✓"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      {row.map((cell, j) => (
                        <td key={j} className={`px-3 py-2 ${j === 6 ? (cell === "✓" ? "text-emerald-600" : "text-amber-600") : "text-slate-700"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
            <strong>Duplicate detection:</strong> 0 potential duplicates found. Matching is based on date, amount, and instrument.
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep("mapping")} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">
              ← Back
            </button>
            <button
              onClick={() => setStep("done")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Import 47 transactions →
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Import complete</h2>
          <p className="text-sm text-slate-500 mb-6">
            47 transactions imported · 2 flagged for review · 0 errors
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep("upload"); setFile(null); setInstitution(null); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Import another file
            </button>
            <a href="/dashboard/transactions" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              View transactions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
