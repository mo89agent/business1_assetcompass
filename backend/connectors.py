from __future__ import annotations

import csv
import re
from io import StringIO
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup

try:
    from .mock_data import get_mock_detail, get_mock_etf_detail, get_mock_history, get_mock_quote
    _MOCK_AVAILABLE = True
except ImportError:
    _MOCK_AVAILABLE = False


YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_QUOTE_SUMMARY_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"

_YF_HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}

_SECTOR_LABELS: dict[str, str] = {
    "realestate": "Immobilien",
    "consumer_cyclical": "Zyklischer Konsum",
    "basic_materials": "Grundstoffe",
    "consumer_defensive": "Nicht-zyklischer Konsum",
    "technology": "Technologie",
    "communication_services": "Kommunikation",
    "financial_services": "Finanzen",
    "utilities": "Versorger",
    "industrials": "Industrie",
    "energy": "Energie",
    "healthcare": "Gesundheit",
}


def _yval(obj: dict, key: str) -> Any:
    """Extract raw numeric value from Yahoo Finance dict or plain value."""
    v = obj.get(key)
    if v is None:
        return None
    if isinstance(v, dict):
        return v.get("raw")
    return v


def _parse_sector_weights(sector_list: list) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for s in sector_list or []:
        if not isinstance(s, dict):
            continue
        for k, v in s.items():
            if isinstance(v, (int, float)):
                result.append({
                    "sector": _SECTOR_LABELS.get(k, k.replace("_", " ").title()),
                    "key": k,
                    "weight": round(v * 100, 2),
                })
    return sorted(result, key=lambda x: x["weight"], reverse=True)


def fetch_yahoo_quote(symbol: str) -> dict[str, Any]:
    try:
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
    except Exception:
        if _MOCK_AVAILABLE:
            return get_mock_quote(symbol)
        raise


def fetch_yahoo_detail(symbol: str) -> dict[str, Any]:
    """Fetch comprehensive stock metrics; falls back to mock data if network unavailable."""
    try:
        return _fetch_yahoo_detail_live(symbol)
    except Exception:
        if _MOCK_AVAILABLE:
            mock = get_mock_detail(symbol)
            if mock:
                return {**mock, "symbol": symbol.upper(), "_demo": True}
        raise


def _fetch_yahoo_detail_live(symbol: str) -> dict[str, Any]:
    modules = "summaryDetail,financialData,defaultKeyStatistics,assetProfile,price"
    resp = requests.get(
        YAHOO_QUOTE_SUMMARY_URL.format(symbol=symbol.upper()),
        params={"modules": modules},
        headers=_YF_HEADERS,
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    result = (data.get("quoteSummary", {}).get("result") or [{}])[0]

    price = result.get("price", {})
    summary = result.get("summaryDetail", {})
    financial = result.get("financialData", {})
    stats = result.get("defaultKeyStatistics", {})
    profile = result.get("assetProfile", {})

    return {
        "symbol": symbol.upper(),
        "name": price.get("longName") or price.get("shortName", symbol.upper()),
        "quote_type": price.get("quoteType", "EQUITY"),
        "currency": price.get("currency", "USD"),
        "exchange": price.get("exchangeName", ""),
        "sector": profile.get("sector", ""),
        "industry": profile.get("industry", ""),
        "description": (profile.get("longBusinessSummary") or "")[:600],
        "country": profile.get("country", ""),
        "employees": profile.get("fullTimeEmployees"),
        "website": profile.get("website", ""),
        # Price
        "price": _yval(price, "regularMarketPrice"),
        "change": _yval(price, "regularMarketChange"),
        "change_pct": _yval(price, "regularMarketChangePercent"),
        "prev_close": _yval(price, "regularMarketPreviousClose"),
        "open": _yval(price, "regularMarketOpen"),
        "day_high": _yval(price, "regularMarketDayHigh"),
        "day_low": _yval(price, "regularMarketDayLow"),
        "volume": _yval(price, "regularMarketVolume"),
        "market_cap": _yval(price, "marketCap"),
        # Valuation
        "pe_ratio": _yval(summary, "trailingPE"),
        "forward_pe": _yval(summary, "forwardPE"),
        "price_to_book": _yval(stats, "priceToBook"),
        "ev_to_ebitda": _yval(stats, "enterpriseToEbitda"),
        "price_to_sales": _yval(summary, "priceToSalesTrailing12Months"),
        "ev": _yval(stats, "enterpriseValue"),
        # Per share
        "eps": _yval(stats, "trailingEps"),
        "forward_eps": _yval(stats, "forwardEps"),
        "book_value": _yval(stats, "bookValue"),
        # Dividend
        "dividend_yield": _yval(summary, "dividendYield"),
        "dividend_rate": _yval(summary, "dividendRate"),
        "payout_ratio": _yval(summary, "payoutRatio"),
        # Risk
        "beta": _yval(summary, "beta"),
        "week_52_high": _yval(summary, "fiftyTwoWeekHigh"),
        "week_52_low": _yval(summary, "fiftyTwoWeekLow"),
        "avg_volume": _yval(summary, "averageVolume"),
        # Profitability
        "profit_margin": _yval(financial, "profitMargins"),
        "operating_margin": _yval(financial, "operatingMargins"),
        "gross_margin": _yval(financial, "grossMargins"),
        "roe": _yval(financial, "returnOnEquity"),
        "roa": _yval(financial, "returnOnAssets"),
        "revenue": _yval(financial, "totalRevenue"),
        "revenue_growth": _yval(financial, "revenueGrowth"),
        "earnings_growth": _yval(financial, "earningsGrowth"),
        "debt_to_equity": _yval(financial, "debtToEquity"),
        "current_ratio": _yval(financial, "currentRatio"),
        "free_cashflow": _yval(financial, "freeCashflow"),
        # Analyst
        "target_price": _yval(financial, "targetMeanPrice"),
        "target_low": _yval(financial, "targetLowPrice"),
        "target_high": _yval(financial, "targetHighPrice"),
        "recommendation": financial.get("recommendationKey", ""),
        "analyst_count": _yval(financial, "numberOfAnalystOpinions"),
        "shares_outstanding": _yval(stats, "sharesOutstanding"),
    }


def fetch_yahoo_etf_detail(symbol: str) -> dict[str, Any]:
    """Fetch ETF data; falls back to mock if network unavailable."""
    try:
        return _fetch_yahoo_etf_detail_live(symbol)
    except Exception:
        if _MOCK_AVAILABLE:
            mock = get_mock_etf_detail(symbol)
            if mock:
                return {**mock, "symbol": symbol.upper(), "_demo": True}
        raise


def _fetch_yahoo_etf_detail_live(symbol: str) -> dict[str, Any]:
    modules = "topHoldings,summaryDetail,price,defaultKeyStatistics,fundProfile"
    resp = requests.get(
        YAHOO_QUOTE_SUMMARY_URL.format(symbol=symbol.upper()),
        params={"modules": modules},
        headers=_YF_HEADERS,
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    result = (data.get("quoteSummary", {}).get("result") or [{}])[0]

    top_holdings = result.get("topHoldings", {})
    price = result.get("price", {})
    summary = result.get("summaryDetail", {})
    stats = result.get("defaultKeyStatistics", {})
    fund_profile = result.get("fundProfile", {})

    holdings_raw = top_holdings.get("holdings") or []
    top10 = []
    for h in holdings_raw[:10]:
        pct = _yval(h, "holdingPercent")
        top10.append({
            "name": h.get("holdingName", ""),
            "symbol": h.get("symbol", ""),
            "weight": round(pct * 100, 2) if pct is not None else None,
        })

    return {
        "symbol": symbol.upper(),
        "name": price.get("longName") or price.get("shortName", symbol.upper()),
        "currency": price.get("currency", "USD"),
        "price": _yval(price, "regularMarketPrice"),
        "change_pct": _yval(price, "regularMarketChangePercent"),
        "total_assets": _yval(summary, "totalAssets"),
        "nav": _yval(summary, "navPrice"),
        "yield": _yval(summary, "yield"),
        "expense_ratio": _yval(stats, "annualReportExpenseRatio"),
        "ytd_return": _yval(stats, "ytdReturn"),
        "three_year_return": _yval(stats, "threeYearAverageReturn"),
        "five_year_return": _yval(stats, "fiveYearAverageReturn"),
        "beta_3y": _yval(stats, "beta3Year"),
        "category": fund_profile.get("categoryName", ""),
        "family": fund_profile.get("family", ""),
        "legal_type": fund_profile.get("legalType", ""),
        "sector_weights": _parse_sector_weights(top_holdings.get("sectorWeightings")),
        "top_holdings": top10,
    }


def fetch_yahoo_history(symbol: str, range_str: str = "1y") -> dict[str, Any]:
    """Fetch historical OHLCV data; falls back to generated mock data if unavailable."""
    try:
        return _fetch_yahoo_history_live(symbol, range_str)
    except Exception:
        if _MOCK_AVAILABLE:
            return get_mock_history(symbol, range_str)
        raise


def _fetch_yahoo_history_live(symbol: str, range_str: str = "1y") -> dict[str, Any]:
    """Fetch historical OHLCV data for a given time range."""
    interval_map: dict[str, str] = {
        "1mo": "1d",
        "3mo": "1d",
        "6mo": "1d",
        "1y": "1d",
        "2y": "1wk",
        "5y": "1wk",
        "10y": "1mo",
        "max": "1mo",
    }
    interval = interval_map.get(range_str, "1d")
    resp = requests.get(
        YAHOO_CHART_URL.format(symbol=symbol.upper()),
        params={"interval": interval, "range": range_str},
        timeout=15,
    )
    resp.raise_for_status()
    payload = resp.json()
    chart_result = (payload.get("chart", {}).get("result") or [{}])[0]
    meta = chart_result.get("meta", {})
    timestamps = chart_result.get("timestamp") or []
    quote_raw = (chart_result.get("indicators", {}).get("quote") or [{}])[0]

    closes = quote_raw.get("close") or []
    volumes = quote_raw.get("volume") or []
    highs = quote_raw.get("high") or []
    lows = quote_raw.get("low") or []
    opens = quote_raw.get("open") or []

    points: list[dict[str, Any]] = []
    for i, ts in enumerate(timestamps):
        c = closes[i] if i < len(closes) else None
        if c is not None:
            points.append({
                "ts": ts,
                "close": round(c, 4),
                "volume": volumes[i] if i < len(volumes) else None,
                "high": round(highs[i], 4) if i < len(highs) and highs[i] else None,
                "low": round(lows[i], 4) if i < len(lows) and lows[i] else None,
                "open": round(opens[i], 4) if i < len(opens) and opens[i] else None,
            })

    perf_pct = None
    if len(points) >= 2:
        first, last = points[0]["close"], points[-1]["close"]
        perf_pct = round((last - first) / first * 100, 2)

    return {
        "symbol": symbol.upper(),
        "currency": meta.get("currency"),
        "range": range_str,
        "interval": interval,
        "perf_pct": perf_pct,
        "data": points,
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

    def find_number(pattern: str) -> Optional[str]:
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
