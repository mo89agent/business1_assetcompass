import type { ImportJob, ImportRow, ReviewItem } from "@/lib/types";

// ──────────────────────────────────────────────────────────────
// Import Job 1 — flatex_export_jan_2026.csv
// Status: reviewing — 1 unresolved duplicate (AAPL BUY = t10)
// ──────────────────────────────────────────────────────────────
const JOB1_ROWS: ImportRow[] = [
  { id: "ir1-1", jobId: "ij1", rowNumber: 1, status: "imported", parsedDate: "2026-01-10", parsedType: "DIVIDEND", parsedAmount: 70.55, parsedCurrency: "USD", parsedInstrument: "Microsoft Corp.", parsedTicker: "MSFT", parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Q1 2026 Dividend", parserConfidence: 97, issues: [], linkedTransactionId: "t2" },
  { id: "ir1-2", jobId: "ij1", rowNumber: 2, status: "imported", parsedDate: "2025-11-15", parsedType: "FEE", parsedAmount: -3.90, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 3.90, parsedDescription: "Depotgebühr Q4 2025", parserConfidence: 91, issues: [], linkedTransactionId: "t8" },
  { id: "ir1-3", jobId: "ij1", rowNumber: 3, status: "imported", parsedDate: "2026-01-05", parsedType: "DEPOSIT", parsedAmount: 5000, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Einzahlung", parserConfidence: 99, issues: [] },
  { id: "ir1-4", jobId: "ij1", rowNumber: 4, status: "imported", parsedDate: "2025-06-15", parsedType: "BUY", parsedAmount: -47208, parsedCurrency: "EUR", parsedInstrument: "Vanguard FTSE All-World", parsedTicker: "VWRL", parsedQuantity: 420, parsedPrice: 112.40, parsedFee: 12.50, parsedDescription: null, parserConfidence: 96, issues: [], linkedTransactionId: "t1" },
  { id: "ir1-5", jobId: "ij1", rowNumber: 5, status: "imported", parsedDate: "2026-02-10", parsedType: "BUY", parsedAmount: -22740, parsedCurrency: "USD", parsedInstrument: "Apple Inc.", parsedTicker: "AAPL", parsedQuantity: 120, parsedPrice: 189.50, parsedFee: 9.90, parsedDescription: null, parserConfidence: 95, issues: [] },
  { id: "ir1-6", jobId: "ij1", rowNumber: 6, status: "imported", parsedDate: "2026-01-20", parsedType: "BUY", parsedAmount: -8370, parsedCurrency: "USD", parsedInstrument: "Amazon.com Inc.", parsedTicker: "AMZN", parsedQuantity: 45, parsedPrice: 186.00, parsedFee: 4.95, parsedDescription: null, parserConfidence: 98, issues: [] },
  { id: "ir1-7", jobId: "ij1", rowNumber: 7, status: "imported", parsedDate: "2025-12-28", parsedType: "INTEREST_INCOME", parsedAmount: 124.50, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Tagesgeld Zins Dez", parserConfidence: 88, issues: [] },
  { id: "ir1-8", jobId: "ij1", rowNumber: 8, status: "imported", parsedDate: "2026-03-01", parsedType: "BUY", parsedAmount: -32172, parsedCurrency: "USD", parsedInstrument: "Microsoft Corp.", parsedTicker: "MSFT", parsedQuantity: 85, parsedPrice: 378.50, parsedFee: 9.90, parsedDescription: null, parserConfidence: 97, issues: [] },
  { id: "ir1-9", jobId: "ij1", rowNumber: 9, status: "imported", parsedDate: "2025-10-15", parsedType: "BUY", parsedAmount: -30900, parsedCurrency: "USD", parsedInstrument: "NVIDIA Corp.", parsedTicker: "NVDA", parsedQuantity: 50, parsedPrice: 618.00, parsedFee: 9.90, parsedDescription: null, parserConfidence: 96, issues: [] },
  { id: "ir1-10", jobId: "ij1", rowNumber: 10, status: "imported", parsedDate: "2026-01-03", parsedType: "WITHDRAWAL", parsedAmount: -2000, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Auszahlung", parserConfidence: 99, issues: [] },
  { id: "ir1-11", jobId: "ij1", rowNumber: 11, status: "imported", parsedDate: "2026-01-25", parsedType: "SELL", parsedAmount: 12560, parsedCurrency: "USD", parsedInstrument: "NVIDIA Corp.", parsedTicker: "NVDA", parsedQuantity: 25, parsedPrice: 618.00, parsedFee: 9.90, parsedDescription: null, parserConfidence: 94, issues: [] },
  // ROW 12: Duplicate of t10 (AAPL BUY 2026-02-15 manually entered)
  {
    id: "ir1-12", jobId: "ij1", rowNumber: 12, status: "duplicate",
    parsedDate: "2026-02-15", parsedType: "BUY", parsedAmount: -3790, parsedCurrency: "EUR",
    parsedInstrument: "Apple Inc.", parsedTicker: "AAPL", parsedQuantity: 20, parsedPrice: 189.50,
    parsedFee: 9.90, parsedDescription: null, parserConfidence: 99,
    issues: [{
      type: "duplicate",
      message: "Gleicher Betrag, gleiches Datum und gleiche Menge wie bestehende Transaktion t10",
      suggestion: "Import-Zeile verwerfen und manuelle Buchung behalten",
      relatedTransactionId: "t10",
    }],
    linkedTransactionId: "t11",
  },
];

// ──────────────────────────────────────────────────────────────
// Import Job 2 — tr_export_q4_2025.csv
// Status: reviewing — unverified sell + missing cost basis
// ──────────────────────────────────────────────────────────────
const JOB2_ROWS: ImportRow[] = [
  { id: "ir2-1", jobId: "ij2", rowNumber: 1, status: "imported", parsedDate: "2025-11-20", parsedType: "BUY", parsedAmount: -30900, parsedCurrency: "USD", parsedInstrument: "NVIDIA Corp.", parsedTicker: "NVDA", parsedQuantity: 50, parsedPrice: 618.00, parsedFee: 0, parsedDescription: null, parserConfidence: 94, issues: [] },
  { id: "ir2-2", jobId: "ij2", rowNumber: 2, status: "imported", parsedDate: "2025-10-05", parsedType: "DEPOSIT", parsedAmount: 10000, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Einzahlung Oktober", parserConfidence: 99, issues: [] },
  { id: "ir2-3", jobId: "ij2", rowNumber: 3, status: "imported", parsedDate: "2025-09-12", parsedType: "BUY", parsedAmount: -19380, parsedCurrency: "USD", parsedInstrument: "Ethereum", parsedTicker: "ETH", parsedQuantity: 8.5, parsedPrice: 2280.00, parsedFee: 0, parsedDescription: null, parserConfidence: 86, issues: [] },
  // ROW 4: BUY without price — missing cost basis
  {
    id: "ir2-4", jobId: "ij2", rowNumber: 4, status: "missing_data",
    parsedDate: "2025-11-08", parsedType: "BUY", parsedAmount: -15240, parsedCurrency: "EUR",
    parsedInstrument: "Xtrackers Euro Stoxx 50", parsedTicker: "XEON",
    parsedQuantity: 850, parsedPrice: null, parsedFee: null, parsedDescription: null,
    parserConfidence: 62,
    issues: [{
      type: "missing_cost_basis",
      message: "Kein Stückkurs erkannt — Feld 'Kurs' war leer in der Quelldatei",
      suggestion: "Kurs manuell nachtragen: ca. €17.93/Stück (Betrag ÷ Menge)",
    }],
  },
  { id: "ir2-5", jobId: "ij2", rowNumber: 5, status: "imported", parsedDate: "2025-08-22", parsedType: "DIVIDEND", parsedAmount: 214.20, parsedCurrency: "EUR", parsedInstrument: "Vanguard FTSE All-World", parsedTicker: "VWRL", parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: null, parserConfidence: 95, issues: [] },
  { id: "ir2-6", jobId: "ij2", rowNumber: 6, status: "imported", parsedDate: "2025-07-30", parsedType: "SELL", parsedAmount: 9270, parsedCurrency: "USD", parsedInstrument: "Apple Inc.", parsedTicker: "AAPL", parsedQuantity: 48.89, parsedPrice: 189.60, parsedFee: 0, parsedDescription: null, parserConfidence: 91, issues: [] },
  // ROW 7: Unverified — could not confirm transaction type
  {
    id: "ir2-7", jobId: "ij2", rowNumber: 7, status: "unverified",
    parsedDate: "2025-12-10", parsedType: "SELL", parsedAmount: 12360, parsedCurrency: "USD",
    parsedInstrument: "NVIDIA Corp.", parsedTicker: "NVDA", parsedQuantity: 20, parsedPrice: 618.00,
    parsedFee: 9.90, parsedDescription: "Verkauf teilw.", parserConfidence: 71,
    issues: [{
      type: "ambiguous_type",
      message: "Transaktionstyp aus Beschreibung 'Verkauf teilw.' nur mit mittlerer Konfidenz als SELL erkannt",
      suggestion: "Bitte Typ bestätigen und Buchung verifizieren",
    }],
    linkedTransactionId: "t3",
  },
  // ROW 8: Parse error — garbled date
  {
    id: "ir2-8", jobId: "ij2", rowNumber: 8, status: "parse_error",
    parsedDate: null, parsedType: null, parsedAmount: null, parsedCurrency: null,
    parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null,
    parsedFee: null, parsedDescription: "??/??/2025 – Buchung – 4.200,00",
    parserConfidence: 0,
    issues: [{
      type: "invalid_date",
      message: "Datum konnte nicht geparst werden: '??/??/2025'. Zeile wird übersprungen.",
      suggestion: "Zeile manuell in Transaktionen anlegen",
    }],
  },
];

// ──────────────────────────────────────────────────────────────
// Import Job 3 — dkb_jan_2026.csv — Complete, no issues
// ──────────────────────────────────────────────────────────────
const JOB3_ROWS: ImportRow[] = [
  { id: "ir3-1", jobId: "ij3", rowNumber: 1, status: "imported", parsedDate: "2026-01-31", parsedType: "INTEREST_INCOME", parsedAmount: 124.50, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Tagesgeld Zinsgutschrift Jan", parserConfidence: 99, issues: [], linkedTransactionId: "t5" },
  { id: "ir3-2", jobId: "ij3", rowNumber: 2, status: "imported", parsedDate: "2026-01-15", parsedType: "DEPOSIT", parsedAmount: 3000, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Einzahlung Gehalt", parserConfidence: 99, issues: [] },
  { id: "ir3-3", jobId: "ij3", rowNumber: 3, status: "imported", parsedDate: "2026-01-15", parsedType: "LOAN_PAYMENT", parsedAmount: -1247, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Darlehensrate DKB Immobilie", parserConfidence: 97, issues: [] },
  { id: "ir3-4", jobId: "ij3", rowNumber: 4, status: "imported", parsedDate: "2026-01-02", parsedType: "WITHDRAWAL", parsedAmount: -500, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Überweisung", parserConfidence: 99, issues: [] },
  { id: "ir3-5", jobId: "ij3", rowNumber: 5, status: "imported", parsedDate: "2025-12-31", parsedType: "INTEREST_INCOME", parsedAmount: 118.25, parsedCurrency: "EUR", parsedInstrument: null, parsedTicker: null, parsedQuantity: null, parsedPrice: null, parsedFee: 0, parsedDescription: "Tagesgeld Zinsgutschrift Dez", parserConfidence: 99, issues: [] },
];

// ──────────────────────────────────────────────────────────────
// All jobs
// ──────────────────────────────────────────────────────────────
const IMPORT_JOBS: ImportJob[] = [
  {
    id: "ij1",
    filename: "flatex_export_jan_2026.csv",
    institution: "Flatex",
    uploadedAt: "2026-01-15T10:23:00Z",
    status: "reviewing",
    rowsTotal: 12,
    rowsImported: 11,
    rowsWithIssues: 1,
    rowsFailed: 0,
    rows: JOB1_ROWS,
  },
  {
    id: "ij2",
    filename: "tr_export_q4_2025.csv",
    institution: "Trade Republic",
    uploadedAt: "2026-01-02T14:15:00Z",
    status: "reviewing",
    rowsTotal: 8,
    rowsImported: 5,
    rowsWithIssues: 3,
    rowsFailed: 1,
    rows: JOB2_ROWS,
  },
  {
    id: "ij3",
    filename: "dkb_jan_2026.csv",
    institution: "DKB",
    uploadedAt: "2026-01-28T09:10:00Z",
    status: "complete",
    rowsTotal: 5,
    rowsImported: 5,
    rowsWithIssues: 0,
    rowsFailed: 0,
    rows: JOB3_ROWS,
  },
];

export async function getImportJobs(): Promise<ImportJob[]> {
  return IMPORT_JOBS;
}

export async function getImportJobById(id: string): Promise<ImportJob | null> {
  return IMPORT_JOBS.find((j) => j.id === id) ?? null;
}

// ──────────────────────────────────────────────────────────────
// Derive review items from import jobs
// ──────────────────────────────────────────────────────────────
export function getReviewItems(jobs: ImportJob[]): ReviewItem[] {
  const items: ReviewItem[] = [];

  for (const job of jobs) {
    for (const row of job.rows) {
      for (const issue of row.issues) {
        const severity =
          issue.type === "parse_error" || issue.type === "invalid_date"
            ? "error"
            : issue.type === "duplicate"
            ? "warning"
            : "warning";

        items.push({
          id: `ri-${row.id}-${issue.type}`,
          severity,
          issueType: issue.type,
          title: formatIssueTitle(issue.type, row),
          description: issue.message,
          importJobId: job.id,
          importJobFilename: job.filename,
          importRowId: row.id,
          relatedTransactionId: issue.relatedTransactionId,
          isResolved: false,
          createdAt: job.uploadedAt,
        });
      }

      if (row.status === "unverified" && row.issues.length === 0) {
        items.push({
          id: `ri-${row.id}-unverified`,
          severity: "info",
          issueType: "unverified",
          title: `Unverifiziert: ${row.parsedType ?? "?"} ${row.parsedTicker ? `(${row.parsedTicker})` : ""} ${row.parsedDate ?? ""}`,
          description: "Diese Zeile wurde importiert, aber noch nicht vom Nutzer bestätigt.",
          importJobId: job.id,
          importJobFilename: job.filename,
          importRowId: row.id,
          transactionId: row.linkedTransactionId,
          isResolved: false,
          createdAt: job.uploadedAt,
        });
      }
    }
  }

  // Sort: errors first, then warnings, then info
  const order: Record<ReviewItem["severity"], number> = { error: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

function formatIssueTitle(type: string, row: ImportRow): string {
  const base = row.parsedType
    ? `${row.parsedType}${row.parsedTicker ? ` ${row.parsedTicker}` : ""}${row.parsedDate ? ` · ${row.parsedDate}` : ""}`
    : `Zeile ${row.rowNumber}`;

  switch (type) {
    case "duplicate": return `Mögliches Duplikat: ${base}`;
    case "missing_cost_basis": return `Fehlender Kurs: ${base}`;
    case "ambiguous_type": return `Unsicherer Typ: ${base}`;
    case "invalid_date": return `Parse-Fehler: Zeile ${row.rowNumber}`;
    case "parse_error": return `Parse-Fehler: Zeile ${row.rowNumber}`;
    default: return `Problem: ${base}`;
  }
}
