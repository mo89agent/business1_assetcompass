# AssetCompass — Architektur-Referenz

## Datenmodell (Prisma / SQLite)

```
User → Entity → Position → TaxLot
                         → Transaction
                         → PositionDividend
       Entity → CashAccount
       Entity → RealEstateProperty → RealEstateTransaction
       Entity → Loan → LoanDetails
```

**Wichtige Felder:**
- `Position.bookValue` = Σ(qty_i × costBasis_i) = quantity × avgCostBasis (muss konsistent sein)
- `Position.marketValue` = Snapshot aus letztem Preis-Update (für Live-Werte: qty × livePrice)
- `Transaction.amount` = bei BUY negativ (Geldabfluss), bei SELL/DIVIDEND positiv

## Key-Files nach Feature

| Feature | Datenschicht | Komponente |
|---|---|---|
| Dashboard KPIs | `lib/data/dashboard.ts` | `components/dashboard/*` |
| Holdings-Tabelle | `lib/data/holdings.ts` | `components/holdings/HoldingsTable.tsx` |
| Holdings-Detail | `lib/data/holdings.ts` | `components/holdings/HoldingDetailShell.tsx` |
| Transaktionen | `lib/data/transactions.ts` | `components/transactions/*` |
| Cash & Schulden | — | `components/cash-debt/CashDebtShell.tsx` |
| Immobilien | `lib/data/realEstate.ts` | `components/real-estate/*` |
| Import | `app/api/import/parse/` | `components/import/ImportWizard.tsx` |
| PDF-Import | `app/api/import/parse-pdf/` | (gleicher Wizard, auto-routing) |
| Live-Preise | `app/api/yahoo/quote/` | `hooks/useLivePrices.ts` |
| XIRR | `lib/xirr.ts` | `components/dashboard/IrrCard.tsx` |

## API-Routes Übersicht

```
/api/yahoo/quote        GET  ?symbols=AAPL,MSFT  → LivePrice[]
/api/yahoo/history      GET  ?symbol=AAPL&range=1y
/api/yahoo/fundamentals GET  ?symbol=AAPL
/api/yahoo/signals      GET  ?symbol=AAPL
/api/import/parse       POST CSV/XLSX → ParsedRow[]
/api/import/parse-pdf   POST PDF → ParsedRow[] (zlib only, no external deps)
```

## Bekannte Einschränkungen & Entscheidungen

**PDF-Import ohne externe Packages:**
`pdf-parse` und `pdfjs-dist` brechen beide mit Turbopack. Der Parser in
`app/api/import/parse-pdf/route.ts` verwendet nur `zlib` (Node.js built-in).
Funktioniert für text-basierte PDFs (Trade Republic Kontoauszüge). Gescannte
PDFs (Bilder) werden nicht unterstützt.

**Demo-Modus:**
Die App läuft vollständig mit Seed-Daten. Kein echtes Backend nötig für
Entwicklung. Echte TR-Daten können über Import → Trade Republic PDF eingelesen
werden.

**FX-Raten:**
Hardcoded in `components/cash-debt/CashDebtShell.tsx`. Für echte Raten müsste
ein Forex-API-Aufruf ergänzt werden.

**XIRR Demo-Modus:**
Wenn keine echten Transaktionen vorhanden, wird XIRR mit Demo-Cashflows
berechnet (gekennzeichnet mit Badge). Logik in `lib/data/dashboard.ts` →
`computeDemoXirr()`.
