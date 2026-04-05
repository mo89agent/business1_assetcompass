#!/bin/bash
# ═══════════════════════════════════════
#  AssetCompass – Mac/Linux Start Script
# ═══════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=9000
FRONTEND_PORT=8888

echo ""
echo "╔══════════════════════════════════╗"
echo "║   AssetCompass – Wealth Intel.   ║"
echo "╚══════════════════════════════════╝"
echo ""

# ── Python check ──
if ! command -v python3 &>/dev/null; then
  echo "✗ python3 nicht gefunden. Bitte installieren: https://python.org"
  exit 1
fi
echo "✓ Python: $(python3 --version)"

# ── pip dependencies ──
echo ""
echo "→ Installiere Python-Pakete..."
python3 -m pip install -q fastapi "uvicorn[standard]" requests beautifulsoup4 pydantic
echo "✓ Pakete installiert"

# ── Free ports ──
echo ""
echo "→ Freie Ports prüfen..."
lsof -ti:$BACKEND_PORT  | xargs kill -9 2>/dev/null && echo "  Port $BACKEND_PORT freigegeben" || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null && echo "  Port $FRONTEND_PORT freigegeben" || true
sleep 1

# ── Backend starten ──
echo ""
echo "→ Starte Backend (Port $BACKEND_PORT)..."
cd "$SCRIPT_DIR"
python3 -m uvicorn backend.app:app --host 0.0.0.0 --port $BACKEND_PORT \
  --log-level warning &
BACKEND_PID=$!

# Warten bis Backend bereit
for i in {1..10}; do
  sleep 1
  if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo "✓ Backend läuft  →  http://localhost:$BACKEND_PORT"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "✗ Backend-Start fehlgeschlagen"
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
done

# ── Frontend starten ──
echo "→ Starte Frontend (Port $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/prototype"
python3 -m http.server $FRONTEND_PORT --bind 127.0.0.1 \
  > /tmp/assetcompass_frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 1
echo "✓ Frontend läuft →  http://localhost:$FRONTEND_PORT"

# ── Browser öffnen ──
echo ""
echo "════════════════════════════════════"
echo "  ✓ AssetCompass läuft!"
echo "  → http://localhost:$FRONTEND_PORT"
echo "════════════════════════════════════"
echo ""
echo "  Tipp: Erste Demo-Aktie: AAPL, MSFT, NVDA"
echo "  Zum Beenden: Ctrl+C"
echo ""

open "http://localhost:$FRONTEND_PORT" 2>/dev/null || \
  xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true

# Cleanup bei Ctrl+C
trap "echo ''; echo 'Beende...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait $BACKEND_PID
