# Vermögenslotse Backend (MVP Foundations)

This backend provides portfolio math, DE tax MVP logic, Yahoo quotes, and holdings-based earnings ingestion.

## Included APIs

### Holdings

- `POST /api/holdings/upsert`
- `GET /api/holdings`

### Portfolio math

- `POST /api/portfolio/metrics`
- `POST /api/portfolio/xirr`
- `POST /api/portfolio/twr`
- `POST /api/portfolio/attribution`

### Tax (DE first)

- `POST /api/tax/de/capital_gains`

### Integrations

- `GET /api/market/quote/{symbol}` (Yahoo)
- `POST /api/earnings/analyze` (single report URL)
- `POST /api/earnings/refresh_holdings` (process all holdings with `earnings_url`)
- `GET /api/earnings/recent`
- `POST /api/broker/parse_csv`
- `POST /api/broker/normalize_csv`

## Storage

- SQLite database file: `backend/data.db`
- Tables:
  - `holdings`
  - `earnings_reports`

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 9000
```

Open API docs:

- http://localhost:9000/docs

## Notes

- Yahoo endpoint availability and data policy may change.
- Broker APIs are broker-specific; CSV parse/normalize is neutral fallback.
- DE tax endpoint is simplified MVP logic and not tax advice.
