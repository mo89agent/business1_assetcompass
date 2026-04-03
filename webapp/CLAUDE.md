# AssetCompass — Projektkontext

## Stack
- **Framework:** Next.js 16 App Router + Turbopack (kein Webpack, keine Pages Router)
- **DB:** Prisma 7 + SQLite via `libsql` driver adapter
- **Styling:** Tailwind CSS v4
- **Marktdaten:** yahoo-finance2 → interne Routes unter `/api/yahoo/`
- **Auth:** eigenes Session-System (kein NextAuth)

## Befehle
```bash
npm run dev                          # Dev-Server (aus webapp/ ausführen)
npx tsc --noEmit                     # TypeScript prüfen
npx prisma generate                  # nach Schema-Änderungen
rm -rf .next node_modules/.cache     # bei Turbopack-Problemen
```

## Architektur-Regeln

**Datenfetching:**
- Server Components → `src/lib/data/*.ts` (Prisma direkt)
- Client Components → `/api/yahoo/quote?symbols=...` für Live-Preise
- Kein Prisma in Client Components

**Patterns die nicht geändert werden sollen:**
- G/V: `gain = qty × livePrice − bookValue` (nie `currentPrice` aus DB)
- Live-Preise: `useLivePrices` Hook → 30s Refresh
- FX: `{ EUR:1.0, USD:0.92, GBP:1.17, CHF:1.06 }` (hardcoded)
- XIRR: `src/lib/xirr.ts` → Newton-Raphson, 6 Startpunkte → `number | null`

**Turbopack — kritisch:**
- Kein `require()` auf externe CJS-Packages → Build-Fehler
- PDF-Parser: nur Node.js Built-ins (`zlib`) — kein `pdf-parse`, kein `pdfjs-dist`

## Datei-Struktur
```
src/
  app/(dashboard)/    # Auth-geschützte Seiten
  app/api/            # API Routes
  app/actions/        # Server Actions
  components/         # React Components (nach Feature)
  hooks/              # useLivePrices, etc.
  lib/data/           # Prisma-Datenschicht (server-only)
  lib/xirr.ts         # XIRR-Engine
  generated/prisma/   # Auto-generiert — nie editieren
```

## Demo-Daten
- Positionen: `src/lib/data/holdings.ts`
- Transaktionen: `src/lib/data/transactions.ts` (43 Einträge)
- Steuerlots: `src/lib/data/taxLots.ts` — `Σ(qty_i × costBasis_i)` muss `bookValue` ergeben

## Referenzen
@AGENTS.md
@docs/ARCHITECTURE.md
@docs/DECISIONS.md
