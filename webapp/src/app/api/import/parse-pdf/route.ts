import { NextRequest, NextResponse } from "next/server";
import { inflateSync, inflateRawSync } from "zlib";

// ── Minimal PDF text extractor (no external deps, Node.js built-ins only) ────
// Handles FlateDecode compressed streams and BT/ET text blocks.

function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}

function extractStreams(buf: Buffer): string[] {
  const texts: string[] = [];
  const raw = buf.toString("binary");

  let pos = 0;
  while (pos < raw.length) {
    const sIdx = raw.indexOf("stream", pos);
    if (sIdx === -1) break;
    const eIdx = raw.indexOf("endstream", sIdx + 6);
    if (eIdx === -1) break;

    // Skip "stream\r\n" or "stream\n"
    let dataStart = sIdx + 6;
    if (raw[dataStart] === "\r") dataStart++;
    if (raw[dataStart] === "\n") dataStart++;

    const chunk = buf.slice(dataStart, eIdx);

    let text = "";
    try { text = inflateSync(chunk).toString("latin1"); }
    catch { try { text = inflateRawSync(chunk).toString("latin1"); }
    catch { text = chunk.toString("latin1"); } }

    // Extract text from BT…ET blocks
    const blocks = text.match(/BT[\s\S]*?ET/g) ?? [];
    const pageLines: string[] = [];
    for (const block of blocks) {
      // (string) Tj
      for (const m of block.matchAll(/\(([^)]*)\)\s*Tj/g)) {
        const t = decodePdfString(m[1]).trim();
        if (t) pageLines.push(t);
      }
      // [(string) ...] TJ
      for (const m of block.matchAll(/\[([^\]]*)\]\s*TJ/g)) {
        const parts = [...m[1].matchAll(/\(([^)]*)\)/g)].map(p => decodePdfString(p[1]));
        const t = parts.join("").trim();
        if (t) pageLines.push(t);
      }
    }
    if (pageLines.length) texts.push(pageLines.join(" "));
    pos = eIdx + 9;
  }
  return texts;
}

function extractPdfText(buf: Buffer): string {
  return extractStreams(buf).join("\n");
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedRow {
  date: string; type: string; ticker: string | null; isin: string | null;
  name: string | null; quantity: number; price: number; amount: number;
  currency: string; fees: number; status: "ok" | "warning" | "error"; warning?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseGermanNumber(s: string): number {
  if (!s) return 0;
  const c = s.replace(/[^\d.,-]/g, "");
  if (c.includes(",") && c.includes(".")) {
    return c.lastIndexOf(",") > c.lastIndexOf(".")
      ? parseFloat(c.replace(/\./g, "").replace(",", ".")) || 0
      : parseFloat(c.replace(/,/g, "")) || 0;
  }
  if (c.includes(",")) return parseFloat(c.replace(",", ".")) || 0;
  return parseFloat(c) || 0;
}

function parseGermanDate(s: string): string {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

function classifyType(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("kauf")   || t.includes("sparplan") || t.includes("buy"))                return "BUY";
  if (t.includes("verkauf") || t.includes("sell"))                                         return "SELL";
  if (t.includes("dividende") || t.includes("dividend"))                                   return "DIVIDEND";
  if (t.includes("zinsen") || t.includes("zins") || t.includes("interest"))               return "DIVIDEND";
  if (t.includes("staking") || t.includes("reward") || t.includes("saveback"))            return "DIVIDEND";
  if (t.includes("einzahlung") || t.includes("deposit") || t.includes("überweisung"))     return "DEPOSIT";
  if (t.includes("auszahlung") || t.includes("entnahme") || t.includes("withdrawal"))     return "WITHDRAWAL";
  if (t.includes("gebühr") || t.includes("fee"))                                           return "FEE";
  return "OTHER";
}

// ── TR Parser ─────────────────────────────────────────────────────────────────

function parseTRPdf(text: string): ParsedRow[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];

  const DATE_AMT = /^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([-+]?[\d.,]+)\s*(EUR|USD|GBP|CHF)?$/i;
  const ISIN_RE  = /([A-Z]{2}[A-Z0-9]{10})/;
  const QTY_RE   = /([\d.,]+)\s*Stk(?:\.|ück)?/i;
  const PRC_RE   = /([\d.,]+)\s*(?:EUR|USD)\s*\/\s*Stk/i;

  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(DATE_AMT);
    if (m) {
      const date = parseGermanDate(m[1]);
      const type = classifyType(m[2]);
      const amount = parseGermanNumber(m[3]);
      const currency = (m[4] ?? "EUR").toUpperCase();
      let isin: string | null = null, name: string | null = null, quantity = 0, price = 0;

      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const nx = lines[j];
        if (/^\d{2}\.\d{2}\.\d{4}\s/.test(nx)) break;
        const im = nx.match(ISIN_RE); if (im) isin = im[1];
        const qm = nx.match(QTY_RE);  if (qm) quantity = parseGermanNumber(qm[1]);
        const pm = nx.match(PRC_RE);  if (pm) price    = parseGermanNumber(pm[1]);
        if (!im && !qm && !pm && nx.length > 3 && !/^\d/.test(nx) && !name) name = nx;
      }

      if (date && type !== "OTHER") {
        rows.push({ date, type, isin, name, ticker: null, quantity, price,
          amount, currency, fees: 0,
          status: date && amount > 0 ? "ok" : "warning",
          warning: (!date || amount === 0) ? "Datum oder Betrag fehlt" : undefined });
      }
    }
    i++;
  }

  // Pattern B: single-order PDF
  if (rows.length === 0) {
    const ft = lines.join(" ");
    const dm = ft.match(/(\d{2}\.\d{2}\.\d{4})/);
    const tm = ft.match(/\b(Kauf|Verkauf|Dividende|Zinsen|Einzahlung|Auszahlung|Sparplan)\b/i);
    const im = ft.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
    const am = ft.match(/Gesamtbetrag[:\s]+([-+]?[\d.,]+)\s*(EUR|USD)?/i)
            ?? ft.match(/Betrag[:\s]+([-+]?[\d.,]+)\s*(EUR|USD)?/i);
    const qm = ft.match(/([\d.,]+)\s*(?:abgerechnete\s*)?Stk(?:\.|ück)?/i);
    const pm = ft.match(/([\d.,]+)\s*(?:EUR|USD)\s*\/\s*Stk/i);
    const nc = lines.find(l => l.length > 5 && !/^\d/.test(l)
      && !/(Kauf|Verkauf|Dividende|ISIN|Stück|Kurs|Betrag|Trade\s+Republic|Seite)/i.test(l));

    if (dm && tm && am) {
      rows.push({
        date: parseGermanDate(dm[1]), type: classifyType(tm[1]),
        isin: im ? im[1] : null, name: nc ?? null, ticker: null,
        quantity: qm ? parseGermanNumber(qm[1]) : 0,
        price:    pm ? parseGermanNumber(pm[1]) : 0,
        amount: parseGermanNumber(am[1]),
        currency: (am[2] ?? "EUR").toUpperCase(),
        fees: 0, status: "ok",
      });
    }
  }
  return rows;
}

// ── Generic fallback ──────────────────────────────────────────────────────────

function parseGenericPdf(text: string): ParsedRow[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const rows: ParsedRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const dm = lines[i].match(/\b(\d{2}\.\d{2}\.\d{4})\b/);
    if (!dm) continue;
    const tm = lines[i].match(/\b(Kauf|Verkauf|Dividende|Zinsen|Einzahlung|Auszahlung|Buy|Sell|Dividend|Deposit)\b/i);
    if (!tm) continue;
    const am = lines[i].match(/([-+]?[\d.]+,\d{2})\s*(EUR|USD|GBP|CHF)?/i);
    let isin: string | null = null, name: string | null = null, quantity = 0, price = 0;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const nx = lines[j];
      if (/\b\d{2}\.\d{2}\.\d{4}\b/.test(nx)) break;
      const im = nx.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/); if (im) isin = im[1];
      const qm = nx.match(/([\d.,]+)\s*Stk/i); if (qm) quantity = parseGermanNumber(qm[1]);
      const pm = nx.match(/([\d.,]+)\s*(?:EUR|USD)\s*\/\s*Stk/i); if (pm) price = parseGermanNumber(pm[1]);
      if (!im && !qm && !pm && nx.length > 4 && !/^\d/.test(nx) && !name) name = nx;
    }
    rows.push({ date: parseGermanDate(dm[1]), type: classifyType(tm[1]),
      isin, name, ticker: null, quantity, price,
      amount: am ? Math.abs(parseGermanNumber(am[1])) : 0,
      currency: am?.[2]?.toUpperCase() ?? "EUR", fees: 0, status: "ok" });
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

    // Verify PDF magic bytes
    if (buffer.slice(0, 4).toString() !== "%PDF") {
      return NextResponse.json({ error: "Keine gültige PDF-Datei." }, { status: 400 });
    }

    const text = extractPdfText(buffer);

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: "PDF konnte nicht gelesen werden. Bitte prüfe ob es sich um ein text-basiertes PDF handelt (kein Scan)." },
        { status: 400 }
      );
    }

    const isTR = /trade\s*republic/i.test(text);
    let rows: ParsedRow[] = isTR ? parseTRPdf(text) : parseGenericPdf(text);
    if (rows.length === 0) rows = parseGenericPdf(text);

    const validated = rows.map(r => {
      if (!r.date)          return { ...r, status: "warning" as const, warning: "Datum fehlt" };
      if (r.type === "OTHER") return { ...r, status: "warning" as const, warning: "Transaktionstyp unklar" };
      return r;
    });

    const errors   = validated.filter(r => r.status === "error").length;
    const warnings = validated.filter(r => r.status === "warning").length;

    return NextResponse.json({
      institution: isTR ? "trade_republic_pdf" : "pdf_generic",
      sourceType: "pdf",
      rows: validated,
      stats: { total: validated.length, errors, warnings, ok: validated.length - errors - warnings },
    });
  } catch (e) {
    return NextResponse.json({ error: "PDF-Parse fehlgeschlagen: " + String(e) }, { status: 500 });
  }
}
