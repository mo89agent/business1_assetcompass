# AssetCompass – Projekt-Kontext für Claude Code Sitzungen

## ⚠️ WICHTIG: Die primäre App ist die Next.js Webapp

Die **echte, vollständige App** befindet sich unter `webapp/`. Das ist die Version mit:
- **Hellem Hintergrund** (`#f8fafc`)
- **Port 3000** (`npm run dev` aus `webapp/`)
- Next.js 16, React 19, Prisma, Tailwind CSS v4, Radix UI

Die `prototype/` ist die ältere Vanilla-JS-Demo (dunkles Design, Port 8888) — sie wird **nicht mehr weiterentwickelt**.

---

## Stack (webapp/)

- **Framework:** Next.js 16 App Router + Turbopack
- **DB:** Prisma 7 + SQLite (via `better-sqlite3`)
- **Styling:** Tailwind CSS v4
- **Marktdaten:** yahoo-finance2 → interne Routes `/api/yahoo/`
- **Auth:** Session-basiert (eigenes System, kein NextAuth)
- **Charts:** Recharts
- **UI:** Radix UI + Lucide Icons

## Befehle

```bash
cd webapp
npm install          # Einmalig
npm run dev          # Dev-Server → http://localhost:3000
npx tsc --noEmit     # TypeScript prüfen
npx prisma generate  # nach Schema-Änderungen
npx prisma db push   # DB-Schema übernehmen
```

## Architektur-Regeln (aus webapp/CLAUDE.md)

- **G/V:** `gain = qty × livePrice − bookValue` (nie `currentPrice` aus DB)
- **Live-Preise:** `useLivePrices` Hook → 30s Refresh
- **FX:** `{ EUR:1.0, USD:0.92, GBP:1.17, CHF:1.06 }` (hardcoded)
- **XIRR:** `src/lib/xirr.ts` → Newton-Raphson, 6 Startpunkte → `number | null`
- Kein Prisma in Client Components
- Kein `require()` auf externe CJS-Packages (Turbopack)

## Datei-Struktur (webapp/)

```
webapp/
├── src/
│   ├── app/(auth)/           # Login, Register
│   ├── app/(dashboard)/      # Alle geschützten Seiten
│   │   └── dashboard/
│   │       ├── page.tsx           # Haupt-Dashboard
│   │       ├── holdings/          # Portfolio-Übersicht + Detail
│   │       ├── market/[symbol]/   # Aktien-/ETF-Analyse
│   │       ├── real-estate/       # Immobilien-Modul
│   │       ├── dividends/         # Dividenden-Prognose
│   │       ├── crypto/            # Krypto-Portfolio
│   │       ├── scenarios/         # Stress-Tests
│   │       ├── transactions/      # Transaktions-Ledger
│   │       ├── import/            # CSV + PDF Import
│   │       ├── cash-debt/         # Cash & Schulden
│   │       └── alerts/            # Preisalarme
│   ├── app/api/yahoo/        # Yahoo Finance Routes
│   ├── app/actions/          # Server Actions
│   ├── components/           # 55 React-Komponenten nach Feature
│   ├── hooks/                # useLivePrices etc.
│   ├── lib/data/             # Prisma-Datenschicht (server-only)
│   ├── lib/xirr.ts           # XIRR-Engine
│   ├── lib/signals.ts        # 13 Kauf/Verkauf-Indikatoren
│   └── lib/types.ts          # Typen
└── prisma/
    ├── schema.prisma         # DB-Schema
    └── seed.ts               # Demo-Daten
```

## Features (vollständig implementiert)

| Feature | Status |
|---------|--------|
| Dashboard (Net Worth, XIRR, Allokation, Performance-Chart) | ✅ |
| Holdings / Portfolio-Tabelle | ✅ |
| Aktien-/ETF-Detail (Kurschart, Fundamentals, Benchmark) | ✅ |
| Buy/Sell/Hold Signal-Engine (13 Indikatoren) | ✅ |
| Dividenden-Prognose + Historie | ✅ |
| Immobilien-Modul (Cashflow, Kredit, Bewertung) | ✅ |
| Krypto-Panel | ✅ |
| Szenario-Stress-Test | ✅ |
| Transaktions-Ledger | ✅ |
| CSV + Trade Republic PDF Import | ✅ |
| Cash & Schulden | ✅ |
| Preisalarme | ✅ |
| Einstellungen | ✅ |
| Live-Preise (30s Refresh) | ✅ |
| XIRR (geldgewichtete Rendite) | ✅ |
| Steuer-Lots | ✅ |
| Onboarding | ✅ |

## Session-Geschichte

| Session | Inhalt |
|---------|--------|
| Build wealth managem... (+31560) | V1 Next.js App + alle Basis-Module + Prisma/SQLite |
| + weitere Iterationen | XIRR, PDF-Import, Crypto, Real Estate, Signale, Live-Preise, Fixes |

## Wichtig für neue Sitzungen

1. **Immer in `webapp/` arbeiten** – das ist die echte App
2. **`prototype/` ignorieren** – wird nicht mehr weiterentwickelt
3. **`npm run dev` aus `webapp/`** → Port 3000
4. TypeScript prüfen: `npx tsc --noEmit`
5. Nach Schema-Änderungen: `npx prisma generate && npx prisma db push`
