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
symbol,quantity,avg_cost,price,annual_dividend_per_share
AAPL,10,145,188,0.96
MSFT,5,312,365,3.00
VWCE,20,95,106,0.00
```

This seeds dashboard KPIs and the stocks asset list.

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
