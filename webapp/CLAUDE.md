# AssetCompass — Claude Code Projektkontext

## Stack (lies das zuerst)
- **Framework:** Next.js 16 App Router + Turbopack (keine Pages Router, kein Webpack)
- **DB:** Prisma 7 + SQLite via `libsql` driver adapter — Schema: `prisma/schema.prisma`
- **Styling:** Tailwind CSS v4
- **Marktdaten:** yahoo-finance2 über interne API-Routes unter `/api/yahoo/`
- **Auth:** eigenes Session-System (kein NextAuth)

## Wichtige Befehle
```bash
# Dev-Server (immer aus webapp/ ausführen)
npm run dev

# TypeScript prüfen
npx tsc --noEmit

# Prisma-Client generieren (nach Schema-Änderungen)
npx prisma generate

# Cache komplett leeren + Neustart
rm -rf .next node_modules/.cache && npm run dev
```

## Architektur-Regeln (nicht abweichen ohne Grund)

**Datenfetching:**
- Server Components → Daten direkt via `src/lib/data/*.ts` (Prisma)
- Client Components → Live-Preise via `/api/yahoo/quote?symbols=...`
- Kein direktes Prisma in Client Components

**Wichtige Patterns:**
- Live-Preise: `useLivePrices` Hook → 30s Refresh → `Record<ticker, LivePrice>`
- G/V: `gain = qty × livePrice − bookValue` (niemals `currentPrice` aus DB)
- FX: `{ EUR:1.0, USD:0.92, GBP:1.17, CHF:1.06 }`
- XIRR: `src/lib/xirr.ts` Newton-Raphson → `number | null`

**Turbopack-Einschränkungen:**
- Kein `require()` auf externe CJS-Packages (bricht Build)
- Keine externen PDF-Packages → PDF-Parser nutzt nur Node.js Built-ins (`zlib`)

## Datei-Struktur
```
src/
  app/(dashboard)/    # Auth-geschützte Seiten (Route Group)
  app/api/            # API Routes (yahoo/*, import/*)
  app/actions/        # Server Actions
  components/         # React Components (nach Feature gruppiert)
  hooks/              # Client Hooks (useLivePrices etc.)
  lib/data/           # Server-seitige Datenschicht (Prisma-Queries)
  lib/types.ts        # Shared Types
  lib/xirr.ts         # XIRR-Engine
  generated/prisma/   # Auto-generiert — nicht editieren
```

## Demo-Daten (kein echtes Backend nötig)
- Positionen: `src/lib/data/holdings.ts`
- Transaktionen: `src/lib/data/transactions.ts` (43 Einträge, Okt 2025–Mär 2026)
- Steuerlots: `src/lib/data/taxLots.ts` (cost basis = bookValue Konsistenz beachten)

## Referenzen
@AGENTS.md
@docs/ARCHITECTURE.md
