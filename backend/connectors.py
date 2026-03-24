from __future__ import annotations

import csv
import re
from io import StringIO
from typing import Any

import requests
from bs4 import BeautifulSoup


YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"


def fetch_yahoo_quote(symbol: str) -> dict[str, Any]:
    params = {"interval": "1d", "range": "5d"}
    resp = requests.get(YAHOO_CHART_URL.format(symbol=symbol), params=params, timeout=10)
    resp.raise_for_status()
    payload = resp.json()
    result = payload.get("chart", {}).get("result", [{}])[0]
    meta = result.get("meta", {})
    quote = (result.get("indicators", {}).get("quote", [{}]) or [{}])[0]
    closes = quote.get("close", [])
    last_close = next((c for c in reversed(closes) if c is not None), None)

    return {
        "symbol": symbol.upper(),
        "currency": meta.get("currency"),
        "exchange": meta.get("exchangeName"),
        "regularMarketPrice": meta.get("regularMarketPrice"),
        "previousClose": meta.get("previousClose"),
        "lastCloseSeries": last_close,
    }


def parse_broker_csv(csv_content: str) -> list[dict[str, Any]]:
    reader = csv.DictReader(StringIO(csv_content))
    rows: list[dict[str, Any]] = []
    for row in reader:
        rows.append({k.strip(): (v.strip() if isinstance(v, str) else v) for k, v in row.items()})
    return rows


def normalize_broker_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []

    def get_any(row: dict[str, Any], keys: list[str], default: Any = "") -> Any:
        lookup = {str(k).lower(): v for k, v in row.items()}
        for k in keys:
            if k in lookup and lookup[k] not in (None, ""):
                return lookup[k]
        return default

    for r in rows:
        tx_type_raw = str(get_any(r, ["type", "transaktion", "transaction_type"], "other")).lower()
        if "buy" in tx_type_raw or "kauf" in tx_type_raw:
            tx_type = "buy"
        elif "sell" in tx_type_raw or "verkauf" in tx_type_raw:
            tx_type = "sell"
        elif "div" in tx_type_raw:
            tx_type = "dividend"
        elif "fee" in tx_type_raw or "geb" in tx_type_raw:
            tx_type = "fee"
        else:
            tx_type = "other"

        normalized.append(
            {
                "date": get_any(r, ["date", "datum"]),
                "symbol": str(get_any(r, ["symbol", "ticker", "isin"], "")).upper(),
                "type": tx_type,
                "quantity": float(get_any(r, ["quantity", "stueck", "shares"], 0) or 0),
                "price": float(get_any(r, ["price", "kurs"], 0) or 0),
                "amount": float(get_any(r, ["amount", "betrag"], 0) or 0),
                "fee": float(get_any(r, ["fee", "gebuehr"], 0) or 0),
            }
        )

    return normalized


def fetch_report_text(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; VermoBot/0.1)"}
    resp = requests.get(url, timeout=15, headers=headers)
    resp.raise_for_status()
    content_type = resp.headers.get("content-type", "")

    if "html" in content_type.lower():
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        return text

    # fallback for plain text / unknown content
    return resp.text


def summarize_earnings_text(text: str, max_chars: int = 4000) -> dict[str, Any]:
    sample = text[:max_chars]

    def find_number(pattern: str) -> str | None:
        m = re.search(pattern, sample, flags=re.IGNORECASE)
        return m.group(1) if m else None

    revenue = find_number(r"revenue[^\d]{0,25}([\d\.,]+\s?(?:million|billion|m|bn)?)")
    eps = find_number(r"eps[^\d\-]{0,10}([\-]?[\d\.,]+)")
    guidance = "mentioned" if re.search(r"guidance|outlook", sample, re.IGNORECASE) else "not found"
    margin = "mentioned" if re.search(r"margin|gross margin|operating margin", sample, re.IGNORECASE) else "not found"

    highlights = []
    if revenue:
        highlights.append(f"Revenue signal detected: {revenue}")
    if eps:
        highlights.append(f"EPS signal detected: {eps}")
    highlights.append(f"Guidance: {guidance}")
    highlights.append(f"Margins: {margin}")

    return {
        "summary": " | ".join(highlights),
        "signals": {
            "revenue": revenue,
            "eps": eps,
            "guidance": guidance,
            "margin": margin,
        },
        "sample_excerpt": sample[:800],
    }
