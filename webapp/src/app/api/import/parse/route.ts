import { NextRequest, NextResponse } from "next/server";

// Detect institution from CSV headers/content
function detectInstitution(headers: string[], rows: string[][]): string {
  const h = headers.join(",").toLowerCase();
  const firstRow = (rows[0] ?? []).join(",").toLowerCase();

  if (h.includes("isin") && h.includes("kurs") && (h.includes("anzahl") || h.includes("stück"))) {
    if (h.includes("provision") || h.includes("depot")) return "comdirect";
  }
  if (h.includes("typ") && h.includes("isin") && h.includes("betrag") && h.includes("stücke")) return "trade_republic";
  if (h.includes("buchungsdatum") && h.includes("vorgang") && h.includes("nominale")) return "flatex";
  if (h.includes("txid") || h.includes("portfolio") || h.includes("trade id")) return "coinbase";
  return "generic";
}

function parseCSV(text: string): string[][] {
  // Handle semicolon or comma separated, German number formats
  const sep = text.includes(";") ? ";" : ",";
  return text.split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, "")));
}

function parseGermanNumber(s: string): number {
  if (!s) return 0;
  // Handle German format: 1.234,56 -> 1234.56
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function parseGermanDate(s: string): string {
  if (!s) return "";
  // DD.MM.YYYY -> YYYY-MM-DD
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

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

function parseTradeRepublic(headers: string[], rows: string[][]): ParsedRow[] {
  // TR columns: Datum, Typ, ISIN, Wertpapier, Stücke, Kurs, Betrag, Gebühr
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iDate  = idx("datum");
  const iType  = idx("typ");
  const iIsin  = idx("isin");
  const iName  = idx("wertpapier");
  const iQty   = idx("stücke") !== -1 ? idx("stücke") : idx("anzahl");
  const iPrice = idx("kurs");
  const iAmt   = idx("betrag");
  const iFee   = idx("gebühr") !== -1 ? idx("gebühr") : idx("provision");
  const iCurr  = idx("währung");

  return rows.map(r => {
    const typeRaw = (r[iType] ?? "").toLowerCase();
    let type = "OTHER";
    if (typeRaw.includes("kauf") || typeRaw.includes("buy"))                        type = "BUY";
    else if (typeRaw.includes("verkauf") || typeRaw.includes("sell"))               type = "SELL";
    else if (typeRaw.includes("dividende") || typeRaw.includes("dividend"))         type = "DIVIDEND";
    else if (typeRaw.includes("zinsen") || typeRaw.includes("zins"))                type = "DIVIDEND"; // treated as income
    else if (typeRaw.includes("staking") || typeRaw.includes("reward"))             type = "DIVIDEND";
    else if (typeRaw.includes("einlage") || typeRaw.includes("einzahlung")
          || typeRaw.includes("deposit"))                                            type = "DEPOSIT";
    else if (typeRaw.includes("entnahme") || typeRaw.includes("auszahlung")
          || typeRaw.includes("withdrawal"))                                         type = "WITHDRAWAL";
    else if (typeRaw.includes("saveback") || typeRaw.includes("cashback"))          type = "DIVIDEND";

    return {
      date: parseGermanDate(r[iDate] ?? ""),
      type,
      isin: r[iIsin] || null,
      ticker: null,
      name: r[iName] || null,
      quantity: parseGermanNumber(r[iQty] ?? ""),
      price: parseGermanNumber(r[iPrice] ?? ""),
      amount: Math.abs(parseGermanNumber(r[iAmt] ?? "")),
      currency: r[iCurr] || "EUR",
      fees: parseGermanNumber(r[iFee] ?? ""),
      status: "ok" as const,
    };
  });
}

function parseComdirect(headers: string[], rows: string[][]): ParsedRow[] {
  // Comdirect columns: Buchungstag, Vorgang/Buchungstext, Umsatz in EUR, Gläubiger-ID, etc.
  // OR depot: Datum, ISIN, WKN, Bezeichnung, Kurs, Anzahl, Betrag, Provision
  const idx = (name: string) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
  const iDate  = idx("datum") !== -1 ? idx("datum") : idx("buchungstag");
  const iIsin  = idx("isin");
  const iName  = idx("bezeichn") !== -1 ? idx("bezeichn") : idx("wertpapier");
  const iQty   = idx("anzahl") !== -1 ? idx("anzahl") : idx("stück");
  const iPrice = idx("kurs");
  const iAmt   = idx("betrag") !== -1 ? idx("betrag") : idx("umsatz");
  const iProv  = idx("provision") !== -1 ? idx("provision") : idx("gebühr");
  const iType  = idx("vorgang") !== -1 ? idx("vorgang") : idx("typ");

  return rows.map(r => {
    const typeRaw = (r[iType] ?? "").toLowerCase();
    let type = "OTHER";
    if (typeRaw.includes("kauf") || typeRaw.includes("einbuchung")) type = "BUY";
    else if (typeRaw.includes("verkauf") || typeRaw.includes("ausbuchung")) type = "SELL";
    else if (typeRaw.includes("dividende") || typeRaw.includes("zinsen")) type = "DIVIDEND";
    else if (typeRaw.includes("einzahlung") || typeRaw.includes("gutschrift")) type = "DEPOSIT";

    return {
      date: parseGermanDate(r[iDate] ?? ""),
      type,
      isin: r[iIsin] || null,
      ticker: null,
      name: r[iName] || null,
      quantity: parseGermanNumber(r[iQty] ?? ""),
      price: parseGermanNumber(r[iPrice] ?? ""),
      amount: Math.abs(parseGermanNumber(r[iAmt] ?? "")),
      currency: "EUR",
      fees: parseGermanNumber(r[iProv] ?? ""),
      status: "ok" as const,
    };
  });
}

function parseGeneric(headers: string[], rows: string[][]): ParsedRow[] {
  const idx = (names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex(h => h.toLowerCase().includes(n.toLowerCase()));
      if (i !== -1) return i;
    }
    return -1;
  };
  const iDate  = idx(["date", "datum", "buchung"]);
  const iType  = idx(["type", "typ", "vorgang", "art"]);
  const iIsin  = idx(["isin"]);
  const iTicker = idx(["ticker", "symbol", "wkn"]);
  const iName  = idx(["name", "bezeich", "wertpapier", "asset"]);
  const iQty   = idx(["quantity", "anzahl", "stück", "qty"]);
  const iPrice = idx(["price", "kurs", "preis"]);
  const iAmt   = idx(["amount", "betrag", "umsatz", "summe"]);
  const iFee   = idx(["fee", "provision", "gebühr"]);
  const iCurr  = idx(["currency", "währung", "ccy"]);

  return rows.map(r => ({
    date: parseGermanDate(r[iDate] ?? ""),
    type: (r[iType] ?? "OTHER").toUpperCase(),
    isin: iIsin >= 0 ? r[iIsin] || null : null,
    ticker: iTicker >= 0 ? r[iTicker] || null : null,
    name: iName >= 0 ? r[iName] || null : null,
    quantity: iQty >= 0 ? parseGermanNumber(r[iQty] ?? "") : 0,
    price: iPrice >= 0 ? parseGermanNumber(r[iPrice] ?? "") : 0,
    amount: iAmt >= 0 ? Math.abs(parseGermanNumber(r[iAmt] ?? "")) : 0,
    currency: iCurr >= 0 ? r[iCurr] || "EUR" : "EUR",
    fees: iFee >= 0 ? parseGermanNumber(r[iFee] ?? "") : 0,
    status: "ok" as const,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const institution = (form.get("institution") as string) ?? "generic";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) return NextResponse.json({ error: "Empty file" }, { status: 400 });

    const headers = rows[0];
    const dataRows = rows.slice(1).filter(r => r.some(c => c.length > 0));

    // Auto-detect if not provided
    const detected = institution === "generic" ? detectInstitution(headers, dataRows) : institution;

    let parsed: ParsedRow[];
    if (detected === "trade_republic") {
      parsed = parseTradeRepublic(headers, dataRows);
    } else if (detected === "comdirect") {
      parsed = parseComdirect(headers, dataRows);
    } else {
      parsed = parseGeneric(headers, dataRows);
    }

    // Validate and annotate
    const validated = parsed.map(r => {
      if (!r.date) return { ...r, status: "warning" as const, warning: "Datum fehlt" };
      if (!r.type || r.type === "OTHER") return { ...r, status: "warning" as const, warning: "Transaktionstyp unklar" };
      if ((r.type === "BUY" || r.type === "SELL") && !r.isin && !r.ticker && !r.name) {
        return { ...r, status: "warning" as const, warning: "ISIN/Ticker fehlt" };
      }
      return r;
    });

    const errors = validated.filter(r => r.status === "error").length;
    const warnings = validated.filter(r => r.status === "warning").length;

    return NextResponse.json({
      institution: detected,
      headers,
      rows: validated,
      stats: { total: validated.length, errors, warnings, ok: validated.length - errors - warnings },
    });
  } catch (e) {
    return NextResponse.json({ error: "Parse failed: " + String(e) }, { status: 500 });
  }
}
