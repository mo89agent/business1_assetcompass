# UI Prototype (Browser)

## Start frontend locally

From repository root:

```bash
python3 -m http.server 8000
```

Open:

- http://localhost:8000/prototype/

## Optional: enable backend integrations

In a second terminal:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 9000
```

Then in UI:
- `Asset Detail` → **Realtime Quote laden**
- `Earnings` → **Holdings Earnings aktualisieren**

### Seed holdings for earnings (example)

```bash
curl -X POST http://localhost:9000/api/holdings/upsert \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","name":"Apple","quantity":10,"earnings_url":"https://investor.apple.com"}'
```

## Zero-setup fallback (no terminal)

If local server commands fail on your machine, open this file directly in your browser:

- `UI_PREVIEW_STANDALONE.html`

This standalone file contains inline CSS/JS and does not require Python, Node, or terminal setup.
