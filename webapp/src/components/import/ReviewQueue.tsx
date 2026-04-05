"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import type { ReviewItem } from "@/lib/types";
import {
  Copy, AlertCircle, AlertTriangle, Info, CheckCircle2,
  ExternalLink, X, Eye, DollarSign, FileWarning, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface Props {
  items: ReviewItem[];
  onOpenDuplicate: (item: ReviewItem) => void;
  onResolve: (itemId: string) => void;
}

const ISSUE_CONFIG: Record<
  ReviewItem["issueType"],
  { icon: typeof Copy; color: string; bg: string; label: string }
> = {
  duplicate: { icon: Copy, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Duplikat" },
  missing_cost_basis: { icon: DollarSign, color: "text-orange-700", bg: "bg-orange-50 border-orange-200", label: "Kurs fehlt" },
  ambiguous_type: { icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Unsicherer Typ" },
  invalid_date: { icon: FileWarning, color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Parse-Fehler" },
  parse_error: { icon: FileWarning, color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Parse-Fehler" },
  negative_amount: { icon: AlertCircle, color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Negativbetrag" },
  missing_ticker: { icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "Ticker fehlt" },
  unverified: { icon: Info, color: "text-blue-700", bg: "bg-blue-50 border-blue-200", label: "Unverifiziert" },
};

const SEVERITY_ICON = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR = {
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

export function ReviewQueue({ items, onOpenDuplicate, onResolve }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const visibleItems = items.filter((i) => !resolved.has(i.id));
  const errorCount = visibleItems.filter((i) => i.severity === "error").length;
  const warningCount = visibleItems.filter((i) => i.severity === "warning").length;
  const infoCount = visibleItems.filter((i) => i.severity === "info").length;

  function handleResolve(id: string) {
    setResolved((prev) => new Set([...prev, id]));
    onResolve(id);
  }

  if (visibleItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-3">
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Review Queue leer</p>
          <p className="text-xs text-slate-400">Alle Importprobleme wurden bearbeitet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-800">
              Review Queue
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              {visibleItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={11} />{errorCount} Fehler
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle size={11} />{warningCount} Warnungen
              </span>
            )}
            {infoCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Info size={11} />{infoCount} Info
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {/* Items */}
      {expanded && (
        <div className="divide-y divide-slate-50">
          {visibleItems.map((item) => {
            const cfg = ISSUE_CONFIG[item.issueType];
            const IssueIcon = cfg.icon;
            const SeverityIcon = SEVERITY_ICON[item.severity];

            return (
              <div key={item.id} className={cn("px-5 py-4 flex items-start gap-4 transition-colors hover:bg-slate-50/30")}>
                {/* Severity indicator */}
                <div className="mt-0.5 shrink-0">
                  <SeverityIcon size={16} className={SEVERITY_COLOR[item.severity]} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border", cfg.bg, cfg.color)}>
                      <IssueIcon size={9} />
                      {cfg.label}
                    </span>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  {item.importJobFilename && (
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {item.importJobFilename}{item.importRowId ? ` · Zeile ${item.importRowId.split("-").pop()}` : ""}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.issueType === "duplicate" && (
                    <button
                      onClick={() => onOpenDuplicate(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Eye size={11} />
                      Duplikat prüfen
                    </button>
                  )}
                  {(item.issueType === "unverified" || item.issueType === "ambiguous_type") && item.transactionId && (
                    <Link
                      href="/dashboard/transactions"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={11} />
                      Zur Transaktion
                    </Link>
                  )}
                  {item.issueType === "missing_cost_basis" && (
                    <Link
                      href="/dashboard/transactions"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <DollarSign size={11} />
                      Kurs nachtragen
                    </Link>
                  )}
                  {item.severity !== "error" && (
                    <button
                      onClick={() => handleResolve(item.id)}
                      className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Als erledigt markieren"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
