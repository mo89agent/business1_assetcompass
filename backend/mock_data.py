"""Realistic demo data for sandbox environments where Yahoo Finance is blocked."""
from __future__ import annotations
import math, time
from typing import Any, Dict, List, Optional

MOCK_DETAILS: dict[str, dict[str, Any]] = {
    "AAPL": dict(
        name="Apple Inc.", quote_type="EQUITY", currency="USD", exchange="NASDAQ",
        sector="Technology", industry="Consumer Electronics", country="United States",
        description="Apple Inc. entwirft, produziert und vermarktet Smartphones, PCs, Tablets und Wearables weltweit. Produkte: iPhone, Mac, iPad, Apple Watch, AirPods. Services: App Store, Apple Music, iCloud, Apple Pay.",
        price=213.49, change=2.31, change_pct=0.0109, prev_close=211.18,
        market_cap=3.22e12, volume=58_000_000, avg_volume=62_000_000,
        pe_ratio=33.4, forward_pe=29.1, price_to_book=47.2, price_to_sales=8.5, ev_to_ebitda=24.8,
        eps=6.39, forward_eps=7.34, book_value=4.52,
        dividend_yield=0.0046, dividend_rate=0.96, payout_ratio=0.15,
        beta=1.24, week_52_high=237.23, week_52_low=164.08,
        profit_margin=0.262, operating_margin=0.315, gross_margin=0.455,
        roe=1.47, roa=0.22, revenue=383e9, revenue_growth=0.051, earnings_growth=0.11,
        debt_to_equity=151.0, current_ratio=1.04, free_cashflow=111e9,
        target_price=232.5, target_low=180.0, target_high=275.0,
        recommendation="buy", analyst_count=42, shares_outstanding=15.3e9,
        ev=3.3e12, employees=164_000, website="https://www.apple.com",
    ),
    "MSFT": dict(
        name="Microsoft Corporation", quote_type="EQUITY", currency="USD", exchange="NASDAQ",
        sector="Technology", industry="Software—Infrastructure", country="United States",
        description="Microsoft entwickelt Software, Services und Cloud-Lösungen weltweit. Segmente: Productivity & Business (Office, Teams), Intelligent Cloud (Azure), Personal Computing (Windows, Xbox).",
        price=415.32, change=3.18, change_pct=0.0077, prev_close=412.14,
        market_cap=3.09e12, volume=21_000_000, avg_volume=22_500_000,
        pe_ratio=35.2, forward_pe=30.1, price_to_book=12.4, price_to_sales=13.1, ev_to_ebitda=26.3,
        eps=11.80, forward_eps=13.79, book_value=33.50,
        dividend_yield=0.0072, dividend_rate=3.00, payout_ratio=0.25,
        beta=0.90, week_52_high=468.35, week_52_low=385.58,
        profit_margin=0.358, operating_margin=0.447, gross_margin=0.694,
        roe=0.368, roa=0.175, revenue=245e9, revenue_growth=0.158, earnings_growth=0.215,
        debt_to_equity=36.0, current_ratio=1.34, free_cashflow=74e9,
        target_price=470.0, target_low=390.0, target_high=550.0,
        recommendation="strong_buy", analyst_count=48, shares_outstanding=7.44e9,
        ev=3.1e12, employees=221_000, website="https://www.microsoft.com",
    ),
    "NVDA": dict(
        name="NVIDIA Corporation", quote_type="EQUITY", currency="USD", exchange="NASDAQ",
        sector="Technology", industry="Semiconductors", country="United States",
        description="NVIDIA entwickelt Grafikprozessoren und System-on-Chip-Einheiten. Hauptmärkte: KI/Data Center, Gaming, Automotive. Der H100-Chip ist Standard für KI-Training weltweit.",
        price=875.40, change=18.50, change_pct=0.0216, prev_close=856.90,
        market_cap=2.15e12, volume=41_000_000, avg_volume=44_000_000,
        pe_ratio=68.4, forward_pe=38.2, price_to_book=35.8, price_to_sales=28.4, ev_to_ebitda=52.1,
        eps=12.80, forward_eps=22.90, book_value=24.45,
        dividend_yield=0.0003, dividend_rate=0.16, payout_ratio=0.02,
        beta=1.66, week_52_high=974.00, week_52_low=435.12,
        profit_margin=0.557, operating_margin=0.618, gross_margin=0.749,
        roe=0.917, roa=0.458, revenue=80.5e9, revenue_growth=1.22, earnings_growth=2.68,
        debt_to_equity=42.0, current_ratio=4.17, free_cashflow=33e9,
        target_price=1000.0, target_low=700.0, target_high=1200.0,
        recommendation="strong_buy", analyst_count=55, shares_outstanding=2.46e9,
        ev=2.2e12, employees=29_600, website="https://www.nvidia.com",
    ),
    "ORCL": dict(
        name="Oracle Corporation", quote_type="EQUITY", currency="USD", exchange="NYSE",
        sector="Technology", industry="Software—Infrastructure", country="United States",
        description="Oracle bietet Datenbank-Software, Cloud-Services und Enterprise-Anwendungen an. Wächst stark im Cloud-Segment (OCI) durch KI-Infrastruktur-Nachfrage.",
        price=126.94, change=-1.23, change_pct=-0.0096, prev_close=128.17,
        market_cap=414e9, volume=8_200_000, avg_volume=9_100_000,
        pe_ratio=32.6, forward_pe=24.8, price_to_book=None, price_to_sales=7.16, ev_to_ebitda=22.4,
        eps=3.89, forward_eps=5.12, book_value=None,
        dividend_yield=0.0117, dividend_rate=1.60, payout_ratio=0.41,
        beta=1.02, week_52_high=198.31, week_52_low=99.26,
        profit_margin=0.195, operating_margin=0.248, gross_margin=0.718,
        roe=None, roa=0.091, revenue=55e9, revenue_growth=0.082, earnings_growth=0.212,
        debt_to_equity=None, current_ratio=0.82, free_cashflow=11e9,
        target_price=165.0, target_low=120.0, target_high=210.0,
        recommendation="buy", analyst_count=33, shares_outstanding=2.76e9,
        ev=480e9, employees=164_000, website="https://www.oracle.com",
    ),
    "AMZN": dict(
        name="Amazon.com Inc.", quote_type="EQUITY", currency="USD", exchange="NASDAQ",
        sector="Consumer Cyclical", industry="Internet Retail", country="United States",
        description="Amazon ist weltweit führend im E-Commerce und Cloud-Computing (AWS). Weitere Segmente: Werbung, Prime, Alexa.",
        price=186.50, change=1.85, change_pct=0.0100, prev_close=184.65,
        market_cap=1.96e12, volume=35_000_000, avg_volume=37_000_000,
        pe_ratio=44.1, forward_pe=32.5, price_to_book=8.7, price_to_sales=3.42, ev_to_ebitda=19.8,
        eps=4.23, forward_eps=5.74, book_value=21.44,
        dividend_yield=None, dividend_rate=None, payout_ratio=None,
        beta=1.14, week_52_high=242.52, week_52_low=151.61,
        profit_margin=0.096, operating_margin=0.105, gross_margin=0.486,
        roe=0.221, roa=0.068, revenue=620e9, revenue_growth=0.109, earnings_growth=0.952,
        debt_to_equity=47.0, current_ratio=1.08, free_cashflow=50e9,
        target_price=225.0, target_low=175.0, target_high=275.0,
        recommendation="strong_buy", analyst_count=62, shares_outstanding=10.5e9,
        ev=2.0e12, employees=1_540_000, website="https://www.amazon.com",
    ),
    "GOOGL": dict(
        name="Alphabet Inc.", quote_type="EQUITY", currency="USD", exchange="NASDAQ",
        sector="Communication Services", industry="Internet Content & Information", country="United States",
        description="Alphabet (Google) betreibt die weltweit meistgenutzte Suchmaschine und bietet Cloud-Computing (GCP), YouTube und KI-Dienste an.",
        price=164.32, change=0.98, change_pct=0.0060, prev_close=163.34,
        market_cap=2.02e12, volume=25_000_000, avg_volume=26_000_000,
        pe_ratio=21.8, forward_pe=18.9, price_to_book=6.9, price_to_sales=5.82, ev_to_ebitda=15.4,
        eps=7.53, forward_eps=8.69, book_value=23.81,
        dividend_yield=0.005, dividend_rate=0.80, payout_ratio=0.11,
        beta=1.02, week_52_high=207.05, week_52_low=140.53,
        profit_margin=0.267, operating_margin=0.317, gross_margin=0.569,
        roe=0.283, roa=0.163, revenue=350e9, revenue_growth=0.149, earnings_growth=0.314,
        debt_to_equity=6.0, current_ratio=1.96, free_cashflow=72e9,
        target_price=200.0, target_low=165.0, target_high=240.0,
        recommendation="buy", analyst_count=50, shares_outstanding=12.3e9,
        ev=2.0e12, employees=182_000, website="https://abc.xyz",
    ),
}

# Shared ETF base fields
_ETF_BASE = dict(quote_type="ETF", currency="USD", change=0.0, change_pct=0.0,
                 prev_close=0.0, volume=5_000_000, avg_volume=6_000_000,
                 pe_ratio=None, forward_pe=None, price_to_book=None, price_to_sales=None,
                 ev_to_ebitda=None, eps=None, forward_eps=None, book_value=None,
                 dividend_rate=None, payout_ratio=None, beta=None,
                 profit_margin=None, operating_margin=None, gross_margin=None,
                 roe=None, roa=None, revenue=None, revenue_growth=None, earnings_growth=None,
                 debt_to_equity=None, current_ratio=None, free_cashflow=None,
                 target_price=None, target_low=None, target_high=None,
                 recommendation="", analyst_count=None, shares_outstanding=None,
                 ev=None, employees=None, website="",
                 sector="", industry="", country="", description="")

MOCK_DETAILS["IVV"] = {**_ETF_BASE, **dict(
    name="iShares Core S&P 500 ETF", exchange="NYSE Arca",
    price=524.12, market_cap=None, dividend_yield=0.0124,
    week_52_high=612.88, week_52_low=480.11,
)}
MOCK_DETAILS["QQQ"] = {**_ETF_BASE, **dict(
    name="Invesco QQQ Trust (Nasdaq-100)", exchange="NASDAQ",
    price=448.30, market_cap=None, dividend_yield=0.0058,
    week_52_high=540.28, week_52_low=404.27,
)}
MOCK_DETAILS["VTI"] = {**_ETF_BASE, **dict(
    name="Vanguard Total Stock Market ETF", exchange="NYSE Arca",
    price=242.18, market_cap=None, dividend_yield=0.0131,
    week_52_high=289.17, week_52_low=221.07,
)}
MOCK_DETAILS["SCHD"] = {**_ETF_BASE, **dict(
    name="Schwab US Dividend Equity ETF", exchange="NYSE Arca",
    price=78.90, market_cap=None, dividend_yield=0.0348,
    week_52_high=90.04, week_52_low=71.45,
)}

MOCK_ETF_DETAILS: dict[str, dict[str, Any]] = {
    "IVV": dict(
        name="iShares Core S&P 500 ETF", currency="USD",
        price=524.12, change_pct=0.0052,
        total_assets=520e9, nav=524.12, expense_ratio=0.0003,
        ytd_return=-0.048, three_year_return=0.102, five_year_return=0.148,
        beta_3y=1.0, category="Large Blend", family="iShares", legal_type="ETF",
        sector_weights=[
            {"sector":"Technologie","key":"technology","weight":31.2},
            {"sector":"Finanzen","key":"financial_services","weight":13.1},
            {"sector":"Gesundheit","key":"healthcare","weight":11.8},
            {"sector":"Zyklischer Konsum","key":"consumer_cyclical","weight":10.9},
            {"sector":"Kommunikation","key":"communication_services","weight":8.7},
            {"sector":"Industrie","key":"industrials","weight":8.1},
            {"sector":"Nicht-zyklischer Konsum","key":"consumer_defensive","weight":6.0},
            {"sector":"Energie","key":"energy","weight":3.5},
        ],
        top_holdings=[
            {"name":"Apple Inc.","symbol":"AAPL","weight":7.2},
            {"name":"NVIDIA Corp.","symbol":"NVDA","weight":6.4},
            {"name":"Microsoft Corp.","symbol":"MSFT","weight":6.1},
            {"name":"Amazon.com Inc.","symbol":"AMZN","weight":3.8},
            {"name":"Meta Platforms","symbol":"META","weight":2.5},
            {"name":"Alphabet Inc. A","symbol":"GOOGL","weight":2.1},
            {"name":"Berkshire Hathaway","symbol":"BRK.B","weight":1.8},
            {"name":"Eli Lilly","symbol":"LLY","weight":1.7},
            {"name":"Broadcom Inc.","symbol":"AVGO","weight":1.6},
            {"name":"JPMorgan Chase","symbol":"JPM","weight":1.5},
        ],
    ),
    "QQQ": dict(
        name="Invesco QQQ Trust (Nasdaq-100)", currency="USD",
        price=448.30, change_pct=0.0078,
        total_assets=260e9, nav=448.30, expense_ratio=0.002,
        ytd_return=-0.082, three_year_return=0.118, five_year_return=0.195,
        beta_3y=1.18, category="Large Growth", family="Invesco", legal_type="ETF",
        sector_weights=[
            {"sector":"Technologie","key":"technology","weight":51.4},
            {"sector":"Kommunikation","key":"communication_services","weight":16.2},
            {"sector":"Zyklischer Konsum","key":"consumer_cyclical","weight":12.8},
            {"sector":"Gesundheit","key":"healthcare","weight":6.1},
            {"sector":"Industrie","key":"industrials","weight":4.9},
            {"sector":"Finanzen","key":"financial_services","weight":4.2},
        ],
        top_holdings=[
            {"name":"Apple Inc.","symbol":"AAPL","weight":9.1},
            {"name":"NVIDIA Corp.","symbol":"NVDA","weight":8.5},
            {"name":"Microsoft Corp.","symbol":"MSFT","weight":7.8},
            {"name":"Amazon.com","symbol":"AMZN","weight":5.1},
            {"name":"Broadcom Inc.","symbol":"AVGO","weight":3.4},
            {"name":"Meta Platforms","symbol":"META","weight":3.3},
            {"name":"Tesla Inc.","symbol":"TSLA","weight":2.9},
            {"name":"Costco Wholesale","symbol":"COST","weight":2.7},
            {"name":"Alphabet A","symbol":"GOOGL","weight":2.5},
            {"name":"Netflix","symbol":"NFLX","weight":2.1},
        ],
    ),
    "SCHD": dict(
        name="Schwab US Dividend Equity ETF", currency="USD",
        price=78.90, change_pct=0.0021,
        total_assets=66e9, nav=78.90, expense_ratio=0.0006,
        ytd_return=-0.032, three_year_return=0.058, five_year_return=0.112,
        beta_3y=0.82, category="Large Value", family="Schwab ETFs", legal_type="ETF",
        sector_weights=[
            {"sector":"Finanzen","key":"financial_services","weight":18.4},
            {"sector":"Gesundheit","key":"healthcare","weight":16.2},
            {"sector":"Zyklischer Konsum","key":"consumer_cyclical","weight":14.1},
            {"sector":"Industrie","key":"industrials","weight":12.8},
            {"sector":"Energie","key":"energy","weight":10.1},
            {"sector":"Technologie","key":"technology","weight":9.8},
            {"sector":"Nicht-zyklischer Konsum","key":"consumer_defensive","weight":8.6},
            {"sector":"Kommunikation","key":"communication_services","weight":5.0},
        ],
        top_holdings=[
            {"name":"Pfizer Inc.","symbol":"PFE","weight":4.5},
            {"name":"Coca-Cola","symbol":"KO","weight":4.3},
            {"name":"Verizon","symbol":"VZ","weight":4.2},
            {"name":"Home Depot","symbol":"HD","weight":4.1},
            {"name":"Chevron","symbol":"CVX","weight":4.0},
            {"name":"Amgen","symbol":"AMGN","weight":3.9},
            {"name":"AbbVie","symbol":"ABBV","weight":3.8},
            {"name":"Blackrock","symbol":"BLK","weight":3.7},
            {"name":"Lockheed Martin","symbol":"LMT","weight":3.5},
            {"name":"Texas Instruments","symbol":"TXN","weight":3.4},
        ],
    ),
}
# Fallback for unknown ETFs
for sym in ("VTI","VEA","VWO","EFA","BND","AGG","GLD","VIG","VGT","IEFA","VNQ","SPY","JEPI"):
    if sym not in MOCK_ETF_DETAILS:
        MOCK_ETF_DETAILS[sym] = dict(
            name=MOCK_DETAILS.get(sym,{}).get("name", sym), currency="USD",
            price=MOCK_DETAILS.get(sym,{}).get("price",100.0), change_pct=0.002,
            total_assets=10e9, nav=None, expense_ratio=0.0007,
            ytd_return=-0.04, three_year_return=0.09, five_year_return=0.12,
            beta_3y=1.0, category="Blend", family="Vanguard/SPDR/iShares", legal_type="ETF",
            sector_weights=[
                {"sector":"Technologie","key":"technology","weight":28.0},
                {"sector":"Finanzen","key":"financial_services","weight":14.0},
                {"sector":"Gesundheit","key":"healthcare","weight":12.0},
                {"sector":"Industrie","key":"industrials","weight":10.0},
                {"sector":"Zyklischer Konsum","key":"consumer_cyclical","weight":10.0},
                {"sector":"Kommunikation","key":"communication_services","weight":8.0},
                {"sector":"Energie","key":"energy","weight":5.0},
            ],
            top_holdings=[
                {"name":"Apple Inc.","symbol":"AAPL","weight":6.5},
                {"name":"Microsoft Corp.","symbol":"MSFT","weight":5.8},
                {"name":"NVIDIA Corp.","symbol":"NVDA","weight":5.2},
                {"name":"Amazon.com","symbol":"AMZN","weight":3.4},
                {"name":"Alphabet Inc.","symbol":"GOOGL","weight":2.1},
            ],
        )


def _gen_history(base_price: float, n_days: int = 252, volatility: float = 0.015) -> list[dict]:
    """Generate realistic-looking price history using a random walk with drift."""
    import random
    random.seed(int(base_price * 100))
    pts = []
    price = base_price * 0.82  # start ~18% below current
    now = int(time.time())
    for i in range(n_days, -1, -1):
        drift = 0.0003
        shock = random.gauss(0, volatility)
        price *= math.exp(drift + shock)
        price = max(base_price * 0.5, price)
        ts = now - i * 86_400
        pts.append({
            "ts": ts,
            "close": round(price, 2),
            "volume": int(random.gauss(40_000_000, 15_000_000)),
            "high": round(price * random.uniform(1.001, 1.015), 2),
            "low":  round(price * random.uniform(0.985, 0.999), 2),
            "open": round(price * random.uniform(0.997, 1.003), 2),
        })
    # Set last price to known value
    if pts:
        pts[-1]["close"] = base_price
    return pts


def get_mock_detail(symbol: str) -> Optional[Dict[str, Any]]:
    return MOCK_DETAILS.get(symbol.upper())


def get_mock_etf_detail(symbol: str) -> Optional[Dict[str, Any]]:
    return MOCK_ETF_DETAILS.get(symbol.upper())


def get_mock_history(symbol: str, range_str: str = "1y") -> dict[str, Any]:
    sym = symbol.upper()
    base = MOCK_DETAILS.get(sym, {}).get("price", 100.0)
    n_map = {"1mo": 22, "3mo": 66, "6mo": 126, "1y": 252, "2y": 504, "5y": 1260}
    n = n_map.get(range_str, 252)
    pts = _gen_history(base, n)
    if len(pts) >= 2:
        perf = round((pts[-1]["close"] - pts[0]["close"]) / pts[0]["close"] * 100, 2)
    else:
        perf = 0.0
    return {
        "symbol": sym,
        "currency": MOCK_DETAILS.get(sym, {}).get("currency", "USD"),
        "range": range_str,
        "interval": "1d",
        "perf_pct": perf,
        "data": pts,
    }


def get_mock_quote(symbol: str) -> dict[str, Any]:
    sym = symbol.upper()
    d = MOCK_DETAILS.get(sym, {})
    price = d.get("price", 100.0)
    return {
        "symbol": sym,
        "currency": d.get("currency", "USD"),
        "exchange": d.get("exchange", ""),
        "regularMarketPrice": price,
        "previousClose": d.get("prev_close", round(price * 0.99, 2)),
        "lastCloseSeries": price,
    }
