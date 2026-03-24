# UI Prototype (Browser)

## Start frontend locally

```bash
python3 -m http.server 8000
```

Open:
- http://localhost:8000/prototype/

## Start backend (required for metrics/scenario/quotes/earnings)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 9000
```

## CSV upload for dashboard seeding

In Dashboard upload CSV with header:

```csv
symbol,name,quantity,avg_cost,price,annual_dividend_per_share,currency,sector,is_watchlist
MSFT,Microsoft,18,312.00,425.30,3.00,USD,Software,false
ORCL,Oracle,24,103.20,128.40,1.60,USD,Software,false
CRM,Salesforce,0,0,301.10,0.00,USD,Software,true
DOW,DOW Inc.,45,52.80,57.40,2.80,USD,Chemicals,false
F3C.DE,SFC Energy,120,18.40,22.70,0.00,EUR,Energy,false
```

This seeds dashboard KPIs and stocks list. Rows with `is_watchlist=true` are shown in list but excluded from portfolio metrics/scenario calculations.

## UI layout notes

The prototype uses a modern dark dashboard layout inspired by contemporary portfolio apps:
- left navigation rail
- top search/time-range controls
- profile/KPI card
- allocation donut + sector bars
- Top 5 / Flop 5 movers tables

## Scenario engine

In `Szenarien`, click `Szenario anwenden`.
Backend endpoint used:
- `POST /api/scenario/apply`

Mathematical assumptions (MVP):
- Total price impact % = equity_shock_pct + (rate_shock_pct * 0.5)
- New price = old_price * (1 - total_price_impact%)
- Portfolio delta computed from sum of projected position values

## Testfile

Use this sample upload file to test end-to-end:

- `testdata/sample_portfolio.csv`

## Hosted synced browser preview (no localhost)

If localhost doesn't work for you, use GitHub Pages deployment guide:

- `DEPLOY_GITHUB_PAGES.md`
