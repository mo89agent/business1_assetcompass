# AssetCompass – Projekt-Kontext für Claude Code Sitzungen

## Projektübersicht

**AssetCompass** ist ein persönliches Wealth-Management-System (Single-Page-App) für Portfolio-Tracking, Aktienanalyse, ETF-Explorer, Dividendenprognose, Earnings-Reports und Szenario-Stresstests.

**Technologie:**
- Backend: Python FastAPI (Port 9000) + SQLite
- Frontend: Vanilla JavaScript + Chart.js (Port 8888)
- Kein Node.js, kein React, kein Build-Prozess

## Session-Geschichte (chronologisch)

| Session | Inhalt | Commits |
|---------|--------|---------|
| Build wealth managem... (+31560) | Basis-App: FastAPI Backend, Portfolio-Metriken, XIRR/TWR, DE-Steuer, Scenario, Earnings, Broker-CSV | `fa5916a`–`4d303b8` |
| Stock Analysis Plat... (+30234) | Vollständiger UI-Ausbau: Kurs & Analyse, ETF Explorer, Dividenden-Chart, Radar-Chart, Yahoo Finance Integration, Mock-Datenlayer | `415ba2d` |
| Fix fundamental data di... (+444) | Datendarstellungs-Fixes | zwischen den großen Commits |
| Complete bug and functi... (+50) | Bug-Audit & 6 Fixes (Earnings-Signale, CSV-Parsing, Dividenden-Chart, Portfolio-Name, FastAPI lifespan, limit-Validierung) | `7e0e058` |

## Architektur

```
business1_assetcompass/
├── backend/
│   ├── app.py          # FastAPI Routen, lifespan, Pydantic-Modelle
│   ├── core.py         # Berechnungs-Engine (XIRR, TWR, Attribution, Steuer, Szenario)
│   ├── connectors.py   # Yahoo Finance API, Earnings-Scraping, CSV-Parser
│   ├── storage.py      # SQLite (holdings, earnings_reports Tabellen)
│   ├── mock_data.py    # Fallback-Daten wenn Yahoo nicht erreichbar
│   └── tests/
│       └── test_api.py # Pytest Test-Suite (6 Tests, alle grün)
├── prototype/
│   ├── index.html      # HTML-Struktur (7 Views)
│   ├── app.js          # Gesamte Frontend-Logik (~1200 Zeilen, Vanilla JS)
│   └── styles.css      # Dark-Theme CSS
├── testdata/
│   └── sample_portfolio.csv   # Test-Portfolio-Datei
├── start.sh            # Startet Backend (9000) + Frontend (8888) automatisch
└── UI_PREVIEW_STANDALONE.html  # Standalone-Demo (kein Backend nötig)
```

## API-Endpunkte

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/health` | GET | Server-Status |
| `/api/portfolio/metrics` | POST | Portfolio-KPIs (Marktwert, PnL, Allokation, Dividende) |
| `/api/portfolio/xirr` | POST | Geldgewichtete Rendite (Newton-Raphson) |
| `/api/portfolio/twr` | POST | Zeitgewichtete Rendite |
| `/api/portfolio/attribution` | POST | Markt- vs. Cashflow-Effekt |
| `/api/scenario/apply` | POST | Stresstest (Aktien-/Zinsschock) |
| `/api/tax/de/capital_gains` | POST | Deutsche Abgeltungsteuer + Soli + KiSt |
| `/api/holdings/upsert` | POST | Holding speichern (Symbol, Menge, Earnings-URL) |
| `/api/holdings` | GET | Alle Holdings auflisten |
| `/api/earnings/analyze` | POST | Earnings-Bericht analysieren (URL → Regex-Extraktion) |
| `/api/earnings/refresh_holdings` | POST | Alle Holdings mit Earnings-URL aktualisieren |
| `/api/earnings/recent` | GET | Letzte Earnings-Analysen (max 200) |
| `/api/market/quote/{symbol}` | GET | Aktueller Kurs (Yahoo Finance) |
| `/api/market/detail/{symbol}` | GET | 30+ Kennzahlen (PE, Margen, Wachstum, Analysten…) |
| `/api/market/etf/{symbol}` | GET | ETF-Daten (Sektorgewichtung, Top-Holdings) |
| `/api/market/history/{symbol}` | GET | OHLCV-Kursverlauf (1M–Max) |
| `/api/broker/parse_csv` | POST | Broker-CSV parsen |
| `/api/broker/normalize_csv` | POST | Broker-CSV normalisieren (DE/EN Spaltennamen) |

## Frontend-Views (7 Stück)

1. **Dashboard** – KPI-Karten, Allokations-Donut, Top/Flop-Liste, CSV-Upload
2. **Kurs & Analyse** – Kurschart (1M–5J), 52W-Range, Radar-Chart, Qualitäts-Check, Fundamentaldaten
3. **Portfolio** – Positions-Tabelle mit P/L, Gewicht, Analyse-Button
4. **ETF Explorer** – Filter nach Assetklasse/Region/Stil, 16 vordefinierte ETFs
5. **Dividenden** – Monats-Balkendiagramm, Yield-on-Cost Tabelle
6. **Earnings** – Inbox mit Revenue/EPS/Guidance/Margin-Signalen
7. **Szenarien** – Schieberegler für Aktien-/Zinsschock, Vorher/Nachher-Vergleich

## CSV-Format für Portfolio-Upload

```csv
symbol,name,quantity,avg_cost,price,annual_dividend_per_share
AAPL,Apple Inc.,10,145.00,213.49,0.96
MSFT,Microsoft,5,312.00,415.32,3.00
```

## Tests ausführen

```bash
python -m pytest backend/tests/test_api.py -v
# Erwartung: 6/6 PASSED
```

## Bekannte Einschränkungen (MVP)

- Dividenden-Chart: Gleichmäßige Jahresprognose (kein monatsgenaues Modell)
- Earnings-Analyse: Regex-basiert, kein KI-Parsing
- German Tax: Keine Verlustverrechnung über Jahre, kein §4h EStG
- Szenario: Zinssensitivität pauschal 0.5%/+1% Zinsanstieg, kein Sektor-Differenzierung
- Kein Persistenz im Frontend (CSV erneut laden nach Seiten-Refresh)
- CORS: `allow_origins=["*"]` – nur für lokale Entwicklung geeignet

## Wichtig für neue Sitzungen

- **Immer auf dem aktuellen Stand von `main` aufbauen** – `git pull origin main` vor Arbeitsbeginn
- **Branch-Konvention**: `claude/<beschreibung>` für neue Feature-Branches
- **Tests nach jeder Änderung**: `python -m pytest backend/tests/test_api.py -v`
- **Mock-Daten**: Wenn Yahoo Finance nicht erreichbar → automatischer Fallback auf `backend/mock_data.py`
- Die App läuft mit `./start.sh` (Backend + Frontend in einem Schritt)
