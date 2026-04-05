"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { ImportJob, ImportRow } from "@/lib/types";
import {
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, AlertTriangle,
  FileWarning, Clock, XCircle, Copy, DollarSign, Info,
} from "lucide-react";

interface Props {
  jobs: ImportJob[];
}

const STATUS_CONFIG: Record<ImportJob["status"], { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending:   { label: "Ausstehend",   color: "text-slate-500",   icon: Clock },
  mapped:    { label: "Gemappt",      color: "text-blue-600",    icon: Clock },
  reviewing: { label: "In Prüfung",   color: "text-amber-600",   icon: AlertTriangle },
  complete:  { label: "Abgeschlossen",color: "text-emerald-600", icon: CheckCircle2 },
  failed:    { label: "Fehlgeschlagen",color: "text-red-600",    icon: XCircle },
};

const ROW_STATUS_CONFIG: Record<ImportRow["status"], { label: string; color: string; bg: string }> = {
  imported:     { label: "Importiert",  color: "text-emerald-700", bg: "bg-emerald-50" },
  unverified:   { label: "Unverifiziert", color: "text-blue-700",  bg: "bg-blue-50" },
  duplicate:    { label: "Duplikat",    color: "text-amber-700",   bg: "bg-amber-50" },
  missing_data: { label: "Daten fehlen", color: "text-orange-700", bg: "bg-orange-50" },
  parse_error:  { label: "Parse-Fehler", color: "text-red-700",   bg: "bg-red-50" },
  skipped:      { label: "Übersprungen", color: "text-slate-500",  bg: "bg-slate-50" },
};

const ISSUE_ICONS: Record<string, typeof AlertCircle> = {
  duplicate:          Copy,
  missing_cost_basis: DollarSign,
  missing_ticker:     AlertCircle,
  ambiguous_type:     AlertTriangle,
  invalid_date:       FileWarning,
  parse_error:        FileWarning,
  negative_amount:    AlertCircle,
};

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "bg-emerald-500" :
    value >= 50 ? "bg-amber-400" :
    "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-[10px] font-mono tabular-nums",
        value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-red-500"
      )}>
        {value}%
      </span>
    </div>
  );
}

function RowPreview({ row }: { row: ImportRow }) {
  const rs = ROW_STATUS_CONFIG[row.status];
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="pl-14 pr-3 py-2 text-[11px] text-slate-400 font-mono tabular-nums">
        #{row.rowNumber}
      </td>
      <td className="px-3 py-2 text-[11px] text-slate-600 font-mono">
        {row.parsedDate ?? <span className="text-red-400">—</span>}
      </td>
      <td className="px-3 py-2 text-[11px] text-slate-700">
        <span className="font-mono">{row.parsedType ?? "?"}</span>
      </td>
      <td className="px-3 py-2 text-[11px] text-slate-700">
        {row.parsedInstrument ?? <span className="text-slate-400">—</span>}
        {row.parsedTicker && (
          <span className="ml-1 text-slate-400">({row.parsedTicker})</span>
        )}
      </td>
      <td className="px-3 py-2 text-[11px] text-slate-700 tabular-nums font-mono text-right">
        {row.parsedAmount != null
          ? `${row.parsedCurrency ?? ""} ${row.parsedAmount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : <span className="text-slate-400">—</span>}
      </td>
      <td className="px-3 py-2">
        <ConfidenceBar value={row.parserConfidence} />
      </td>
      <td className="px-3 py-2">
        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium", rs.bg, rs.color)}>
          {rs.label}
        </span>
      </td>
      <td className="px-3 py-2 pr-5">
        {row.issues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.issues.map((issue, i) => {
              const IssueIcon = ISSUE_ICONS[issue.type] ?? Info;
              return (
                <span key={i} title={issue.message} className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                  <IssueIcon size={10} />
                </span>
              );
            })}
          </div>
        ) : (
          <CheckCircle2 size={12} className="text-emerald-400" />
        )}
      </td>
    </tr>
  );
}

function JobRow({ job }: { job: ImportJob }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[job.status];
  const StatusIcon = cfg.icon;

  const successPct = job.rowsTotal > 0 ? (job.rowsImported / job.rowsTotal) * 100 : 0;
  const issuePct   = job.rowsTotal > 0 ? (job.rowsWithIssues / job.rowsTotal) * 100 : 0;

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Job header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        {/* Status */}
        <StatusIcon size={15} className={cn("shrink-0", cfg.color)} />

        {/* File name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{job.filename}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {job.institution} · {formatDate(job.uploadedAt)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="hidden md:flex flex-col gap-1 w-32">
          <div className="h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${successPct}%` }} />
            <div className="bg-amber-400 h-full transition-all" style={{ width: `${issuePct}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 text-right">
            {job.rowsImported}/{job.rowsTotal} Zeilen
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {job.rowsWithIssues > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} />
              {job.rowsWithIssues} Problem{job.rowsWithIssues !== 1 ? "e" : ""}
            </span>
          )}
          {job.rowsFailed > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
              <XCircle size={10} />
              {job.rowsFailed} Fehler
            </span>
          )}
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border",
            job.status === "complete" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
            job.status === "reviewing" ? "bg-amber-50 text-amber-700 border-amber-100" :
            job.status === "failed" ? "bg-red-50 text-red-700 border-red-100" :
            "bg-slate-50 text-slate-600 border-slate-100"
          )}>
            {cfg.label}
          </span>
        </div>

        {expanded
          ? <ChevronUp size={14} className="text-slate-400 shrink-0" />
          : <ChevronDown size={14} className="text-slate-400 shrink-0" />
        }
      </button>

      {/* Row detail table */}
      {expanded && job.rows.length > 0 && (
        <div className="overflow-x-auto border-t border-slate-50 bg-slate-50/30">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pl-14 pr-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Zeile</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Datum</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Typ</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Instrument</th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-slate-400 uppercase tracking-wide">Betrag</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Konfidenz</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-3 py-2 pr-5 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wide">Issues</th>
              </tr>
            </thead>
            <tbody>
              {job.rows.map((row) => (
                <RowPreview key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ImportHistory({ jobs }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <p className="text-sm text-slate-500">Noch keine Imports vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Import-Verlauf</h2>
        <p className="text-xs text-slate-400 mt-0.5">{jobs.length} Import{jobs.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="divide-y divide-slate-50">
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
