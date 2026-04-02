import { NextRequest, NextResponse } from "next/server";

// ── Types (same shape as /api/import/parse) ───────────────────────────────────

interface ParsedRow {
  date: string;
  type: string;
  ticker: string | null;
  isin: string | null;
  name: string | null;
  quantity: number;
  price: number;
  amount: number;
  currency: string;
  fees: number;
  status: "ok" | "warning" | "error";
  warning?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseGermanNumber(s: string): number {
  if (!s) return 0;
  // 1.234,56 → 1234.56  |  1,234.56 → 1234.56 (Coinbase-style)
  const cleaned = s.replace(/[^\d.,-]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // Determine which is decimal separator by position
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      // German format: 1.234,56
      return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
    } else {
      // EN format: 1,234.56
      return parseFloat(cleaned.replace(/,/g, "")) || 0;
    }
  }
  if (cleaned.includes(",")) return parseFloat(cleaned.replace(",", ".")) || 0;
  return parseFloat(cleaned) || 0;
}

function parseGermanDate(s: string): string {
  if (!s) return "";
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

function classifyType(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("kauf")  || t.includes("sparplan") || t.includes("buy"))   return "BUY";
  if (t.includes("verkauf") || t.includes("sell"))                           return "SELL";
  if (t.includes("dividende") || t.includes("dividend"))                    return "DIVIDEND";
  if (t.includes("zinsen") || t.includes("zins") || t.includes("interest")) return "DIVIDEND";
  if (t.includes("staking") || t.includes("reward") || t.includes("saveback") || t.includes("cashback")) return "DIVIDEND";
  if (t.includes("einzahlung") || t.includes("einlage") || t.includes("deposit") || t.includes("überweisung")) return "DEPOSIT";
  if (t.includes("auszahlung") || t.includes("entnahme") || t.includes("withdrawal")) return "WITHDRAWAL";
  if (t.includes("gebühr") || t.includes("fee"))                            return "FEE";
  return "OTHER";
}

// ── Parser: Trade Republic Kontoauszug PDF ────────────────────────────────────
//
// TR PDFs have two common layouts:
//
// Layout A (Kontoauszug / account statement):
//   01.03.2026  Kauf                           -1.124,00 EUR
//               Vanguard FTSE All-World
//               ISIN IE00B3RBWM25 · 10 Stk. · 112,40 EUR
//
// Layout B (Portfolioübersicht / individual order PDF):
//   Kauf · 01.03.2026 · 10:32
//   Vanguard FTSE All-World UCITS ETF (VWRL)
//   IE00B3RBWM25
//   10 Stk.
//   112,40 EUR / Stk.
//   Gesamtbetrag: 1.124,00 EUR
//
// We try both patterns and merge results.
// ─────────────────────────────────────────────────────────────────────────────

function parseTRPdf(text: string): ParsedRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rows: ParsedRow[] = [];

  // ── Pattern A: line-by-line Kontoauszug ─────────────────────────────────────
  // Anchor: line starting with DD.MM.YYYY followed by a type keyword
  const DATE_TYPE_RE = /^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([-+]?[\d.,]+)\s*(EUR|USD|GBP|CHF)?$/i;
  const ISIN_QTY_RE  = /ISIN\s+([A-Z]{2}[A-Z0-9]{10})|([A-Z]{2}[A-Z0-9]{10})/;
  const QTY_RE       = /([\d.,]+)\s*Stk(?:\.|ück)?/i;
  const PRICE_RE     = /([\d.,]+)\s*(?:EUR|USD)\s*\/\s*Stk/i;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(DATE_TYPE_RE);
    if (m) {
      const date   = parseGermanDate(m[1]);
      const typeRaw = m[2].trim();
      const type   = classifyType(typeRaw);
      const amount = parseGermanNumber(m[3]);
      const currency = (m[4] ?? "EUR").toUpperCase();

      // Look ahead up to 5 lines for ISIN, name, quantity, price
      let isin: string | null = null;
      let name: string | null = null;
      let quantity = 0;
      let price = 0;

      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const next = lines[j];

        // Stop if next date-type line found
        if (/^\d{2}\.\d{2}\.\d{4}\s/.test(next)) break;

        const isinM = next.match(ISIN_QTY_RE);
        if (isinM) isin = isinM[1] ?? isinM[2];

        const qtyM = next.match(QTY_RE);
        if (qtyM) quantity = parseGermanNumber(qtyM[1]);

        const priceM = next.match(PRICE_RE);
        if (priceM) price = parseGermanNumber(priceM[1]);

        // Heuristic: lines that look like a security name (not numbers, not ISIN)
        if (!isinM && !qtyM && !priceM && next.length > 3 && !/^\d/.test(next)) {
          if (!name) name = next;
        }
      }

      if (date && type !== "OTHER") {
        rows.push({
          date,
          type,
          isin,
          name,
          ticker: null,
          quantity,
          price,
          amount,
          currency,
          fees: 0,
          status: date && amount > 0 ? "ok" : "warning",
          warning: (!date || amount === 0) ? "Datum oder Betrag fehlt" : undefined,
        });
      }
      i++;
      continue;
    }
    i++;
  }

  // ── Pattern B: individual order PDFs (one transaction per page) ────────────
  // Detect by looking for "Gesamtbetrag" or "Abgerechnete Stücke" keywords
  if (rows.length === 0) {
    const fullText = lines.join(" ");
    const dateM    = fullText.match(/(\d{2}\.\d{2}\.\d{4})/);
    const typeM    = fullText.match(/\b(Kauf|Verkauf|Dividende|Zinsen|Einzahlung|Auszahlung|Sparplan)\b/i);
    const isinM    = fullText.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
    const totalM   = fullText.match(/Gesamtbetrag[:\s]+([-+]?[\d.,]+)\s*(EUR|USD)?/i)
                  ?? fullText.match(/Betrag[:\s]+([-+]?[\d.,]+)\s*(EUR|USD)?/i);
    const qtyM     = fullText.match(/([\d.,]+)\s*(?:abgerechnete\s*)?Stk(?:\.|ück)?/i);
    const priceM   = fullText.match(/([\d.,]+)\s*(?:EUR|USD)\s*\/\s*Stk/i);
    // Security name: first non-date, non-keyword, non-ISIN long text line
    const nameCandidate = lines.find(
      (l) => l.length > 5 && !/^\d/.test(l) && !/(Kauf|Verkauf|Dividende|ISIN|Stück|Kurs|Betrag|Trade\s+Republic|Seite)/i.test(l)
    );

    if (dateM && typeM && totalM) {
      rows.push({
        date:     parseGermanDate(dateM[1]),
        type:     classifyType(typeM[1]),
        isin:     isinM ? isinM[1] : null,
        name:     nameCandidate ?? null,
        ticker:   null,
        quantity: qtyM   ? parseGermanNumber(qtyM[1])   : 0,
        price:    priceM ? parseGermanNumber(priceM[1]) : 0,
        amount:   parseGermanNumber(totalM[1]),
        currency: (totalM[2] ?? "EUR").toUpperCase(),
        fees:     0,
        status:   "ok",
      });
    }
  }

  return rows;
}

// ── Generic PDF parser (fallback for unknown formats) ────────────────────────

function parseGenericPdf(text: string): ParsedRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateM = line.match(/\b(\d{2}\.\d{2}\.\d{4})\b/);
    if (!dateM) continue;

    const typeM = line.match(/\b(Kauf|Verkauf|Dividende|Zinsen|Einzahlung|Auszahlung|Sparplan|Buy|Sell|Dividend|Deposit)\b/i);
    if (!typeM) continue;

    const amtM = line.match(/([-+]?[\d.]+,\d{2})\s*(EUR|USD|GBP|CHF)?/i);

    let isin: string | null = null;
    let name: string | null = null;
    let quantity = 0;
    let price = 0;

    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const next = lines[j];
      if (/\b\d{2}\.\d{2}\.\d{4}\b/.test(next)) break;
      const isinM = next.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
      if (isinM) isin = isinM[1];
      const qtyM = next.match(/([\d.,]+)\s*Stk/i);
      if (qtyM) quantity = parseGermanNumber(qtyM[1]);
      const priceM = next.match(/([\d.,]+)\s*(?:EUR|USD)\s*\/\s*Stk/i);
      if (priceM) price = parseGermanNumber(priceM[1]);
      if (!isinM && !qtyM && !priceM && next.length > 4 && !/^\d/.test(next) && !name) {
        name = next;
      }
    }

    rows.push({
      date:     parseGermanDate(dateM[1]),
      type:     classifyType(typeM[1]),
      isin,
      name,
      ticker:   null,
      quantity,
      price,
      amount:   amtM ? Math.abs(parseGermanNumber(amtM[1])) : 0,
      currency: amtM?.[2]?.toUpperCase() ?? "EUR",
      fees:     0,
      status:   "ok",
    });
  }

  return rows;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer, { max: 0 }); // max:0 = all pages
    const text: string = parsed.text;

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "PDF konnte nicht gelesen werden. Ist die Datei ein gescanntes Bild (keine Text-Ebene)?" },
        { status: 400 }
      );
    }

    // Detect institution
    const isTR = /trade\s*republic/i.test(text);

    let rows: ParsedRow[] = isTR ? parseTRPdf(text) : parseGenericPdf(text);

    // Fallback to generic if TR parser found nothing
    if (rows.length === 0) rows = parseGenericPdf(text);

    // Validate
    const validated = rows.map((r) => {
      if (!r.date) return { ...r, status: "warning" as const, warning: "Datum fehlt" };
      if (r.type === "OTHER") return { ...r, status: "warning" as const, warning: "Transaktionstyp unklar" };
      return r;
    });

    const errors   = validated.filter((r) => r.status === "error").length;
    const warnings = validated.filter((r) => r.status === "warning").length;

    return NextResponse.json({
      institution: isTR ? "trade_republic_pdf" : "pdf_generic",
      sourceType:  "pdf",
      pages:       parsed.numpages,
      rows:        validated,
      stats: {
        total:    validated.length,
        errors,
        warnings,
        ok:       validated.length - errors - warnings,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "PDF-Parse fehlgeschlagen: " + String(e) }, { status: 500 });
  }
}
