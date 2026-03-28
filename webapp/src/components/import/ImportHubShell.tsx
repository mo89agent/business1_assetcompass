"use client";

import { useState, useCallback } from "react";
import type { ImportJob, ReviewItem, TransactionRow } from "@/lib/types";
import { ReviewQueue } from "./ReviewQueue";
import { ImportHistory } from "./ImportHistory";
import { DuplicatePairView } from "./DuplicatePairView";
import { ImportWizard } from "./ImportWizard";
import { DrawerShell } from "@/components/ui/DrawerShell";
import { Upload, RefreshCw } from "lucide-react";

interface Props {
  jobs: ImportJob[];
  reviewItems: ReviewItem[];
  existingTransactions: TransactionRow[];
}

export function ImportHubShell({ jobs, reviewItems, existingTransactions }: Props) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [duplicateItem, setDuplicateItem] = useState<ReviewItem | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const visibleReviewItems = reviewItems.filter((i) => !resolved.has(i.id));

  const handleResolve = useCallback((id: string) => {
    setResolved((prev) => new Set([...prev, id]));
  }, []);

  const handleOpenDuplicate = useCallback((item: ReviewItem) => {
    setDuplicateItem(item);
  }, []);

  const existingTx = duplicateItem?.relatedTransactionId
    ? existingTransactions.find((t) => t.id === duplicateItem.relatedTransactionId) ?? null
    : null;

  function handleDuplicateAction(action: "skip" | "both" | "replace") {
    if (duplicateItem) {
      // In a real app we'd call a server action here
      handleResolve(duplicateItem.id);
    }
    setDuplicateItem(null);
  }

  // Stats for header
  const errorCount    = visibleReviewItems.filter((i) => i.severity === "error").length;
  const warningCount  = visibleReviewItems.filter((i) => i.severity === "warning").length;
  const totalImported = jobs.reduce((s, j) => s + (j.rowsImported ?? 0), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Import & Datenprüfung</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {jobs.length} Import{jobs.length !== 1 ? "s" : ""} ·{" "}
              {totalImported} Transaktionen importiert
              {visibleReviewItems.length > 0 && (
                <> · <span className={errorCount > 0 ? "text-red-600 font-medium" : "text-amber-600 font-medium"}>
                  {visibleReviewItems.length} offen{visibleReviewItems.length !== 1 ? "e" : "r"} Review-Punkt{visibleReviewItems.length !== 1 ? "e" : ""}
                </span></>
              )}
            </p>
          </div>

          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0"
          >
            <Upload size={14} />
            Datei importieren
          </button>
        </div>

        {/* Review Queue — always on top */}
        <ReviewQueue
          items={visibleReviewItems}
          onOpenDuplicate={handleOpenDuplicate}
          onResolve={handleResolve}
        />

        {/* Import history */}
        <ImportHistory jobs={jobs} />

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center">
          Importierte Transaktionen werden nach manueller Prüfung bestätigt.
          Duplikate und Parsing-Fehler erscheinen im Review Queue.
        </p>
      </div>

      {/* Duplicate comparison drawer */}
      <DuplicatePairView
        item={duplicateItem}
        existingTx={existingTx}
        onClose={() => setDuplicateItem(null)}
        onSkipImport={() => handleDuplicateAction("skip")}
        onKeepBoth={() => handleDuplicateAction("both")}
        onReplaceExisting={() => handleDuplicateAction("replace")}
      />

      {/* Import wizard drawer */}
      <DrawerShell
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title="Neue Datei importieren"
        subtitle="CSV, XLSX oder PDF hochladen"
        widthClass="w-[640px]"
      >
        <div className="p-6">
          <ImportWizard />
        </div>
      </DrawerShell>
    </>
  );
}
