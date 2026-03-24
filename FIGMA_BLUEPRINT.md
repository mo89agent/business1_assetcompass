# Personal Wealth Management – Figma Blueprint (Web MVP)

## 1) File Setup

Create a Figma file with these pages:
1. `00_Foundations`
2. `01_Components`
3. `02_Screens_Web`
4. `03_Prototype`
5. `04_Notes_Handoff`

---

## 2) Foundations (00_Foundations)

### Colors
- `bg/default`: `#0B1220`
- `surface/card`: `#121A2B`
- `border/default`: `#24314B`
- `text/primary`: `#E9EEF9`
- `text/muted`: `#8FA0BF`
- `brand/primary`: `#3B82F6`
- `state/success`: `#22C55E`

### Typography
- Font: Inter
- H1: 36 / 44 / 700
- H2: 28 / 36 / 700
- H3: 18 / 24 / 600
- Body: 14 / 22 / 400
- Caption: 12 / 18 / 500

### Spacing & Radius
- Spacing scale: `4, 8, 12, 16, 20, 24, 32`
- Radius: `10, 12, 14`

### Grid
- Desktop frame: `1440x1024`
- 12 columns
- Margin: 80
- Gutter: 24

---

## 3) Core Components (01_Components)

Build as reusable components:
- `Sidebar/NavItem` (default, hover, active)
- `Button/Primary`
- `Card/Default`
- `Card/KPI`
- `Table/Base`
- `Input/File`
- `Slider/Range`
- `Badge/Status`

---

## 4) Screen 1 – Dashboard (02_Screens_Web)

### Layout blocks
1. Sidebar left (fixed width ~260)
2. Topbar (`Dashboard` + CTA `Asset hinzufügen`)
3. Upload card
4. KPI grid (4 cards)

### Content mapping from app
- Upload card: `Start: Daten hochladen (CSV)`
- KPI cards:
  - Gesamtvermögen
  - Unrealized P/L
  - Monats-Cashflow
  - Dividenden (12M)

---

## 5) Screen 2 – Aktien & ETFs

- Heading: `Gesamtliste Assets (Aktien/ETFs)`
- Table columns:
  - Ticker
  - Menge
  - Einstand
  - Kurs
  - Marktwert
  - Gewicht

---

## 6) Screen 3 – Asset Detail

- Left: chart placeholder (`Preis-Chart + Drawdown`)
- Right: key metrics card
- Action: `Realtime Quote laden`

---

## 7) Screen 4 – Szenarien

- Sliders:
  - Aktienschock %
  - Zinsschock %
  - Dividendenkürzung %
- CTA: `Szenario anwenden`
- Result card:
  - Vorher
  - Nachher
  - Delta
  - Delta %

---

## 8) Prototype links (03_Prototype)

Add click interactions:
- Sidebar nav switches between all screens
- Dashboard CTA can open dummy modal
- Scenario CTA transitions to same screen state with highlighted result block

---

## 9) Handoff Notes (04_Notes_Handoff)

- Keep component names aligned with code concepts:
  - `Card/KPI`
  - `Table/Base`
  - `Slider/Range`
- Keep labels DE-first; EN variant in second text layer for later i18n.
- Match current prototype behavior before redesign iterations.
