# Architektur-Entscheidungen (ADR-Light)

Warum was so gemacht wurde — verhindert, dass Entscheidungen rückgängig gemacht werden.

---

## 2026-03 — PDF-Parser ohne externe Deps

**Problem:** `pdf-parse` (CJS) und `pdfjs-dist` können von Turbopack nicht aufgelöst werden,
selbst mit `serverExternalPackages`.

**Entscheidung:** Eigener minimaler PDF-Textextraktor in `app/api/import/parse-pdf/route.ts`
mit nur Node.js Built-ins (`zlib.inflateSync`).

**Trade-off:** Funktioniert nur für text-basierte PDFs, nicht für Scans. Für TR-Kontoauszüge
ausreichend.

---

## 2026-03 — G/V aus Live-Preis, nicht DB-Snapshot

**Problem:** `position.currentPrice` in der DB ist ein veralteter Snapshot und zeigt G/V = 0%.

**Entscheidung:** G/V immer aus `qty × livePrice − bookValue` berechnen.
`useLivePrices` Hook liefert Echtzeit-Kurse in HoldingsTable und HoldingDetailShell.

---

## 2026-03 — XIRR Newton-Raphson mit 6 Startpunkten

**Problem:** Newton-Raphson kann in lokalen Minima stecken bleiben.

**Entscheidung:** 6 verschiedene Startpunkte `[0.1, 0.0, 0.3, -0.1, 1.0, -0.5]`,
erster konvergenter Wert gewinnt. Gibt `null` zurück wenn kein Wert konvergiert.

---

## 2026-03 — Demo-Modus mit Seed-Daten

**Problem:** Keine echte DB-Befüllung für Entwicklung.

**Entscheidung:** Komplette Demo-Daten in `lib/data/` als TypeScript-Objekte.
43 Transaktionen (Okt 2025–Mär 2026), realistische Positionen, konsistente
Tax-Lots. Echte Daten per Import überschreiben die Demo-Daten in der DB.
