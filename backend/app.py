from __future__ import annotations

from datetime import date
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .connectors import (
    fetch_report_text,
    fetch_yahoo_quote,
    normalize_broker_rows,
    parse_broker_csv,
    summarize_earnings_text,
)
from .core import (
    Cashflow,
    Position,
    ReturnPeriod,
    allocation_weights,
    apply_equity_scenario,
    de_capital_gains_tax,
    irr_newton,
    monthly_dividend_forecast,
    portfolio_cost_basis,
    portfolio_market_value,
    simple_attribution,
    twr,
    unrealized_pnl,
    unrealized_return_pct,
)
from .storage import init_db, insert_earnings_result, list_holdings, list_recent_earnings, upsert_holding

app = FastAPI(title="Personal Wealth Management API", version="0.3.0")


@app.on_event("startup")
def startup_event() -> None:
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PositionIn(BaseModel):
    symbol: str
    quantity: float = Field(ge=0)
    avg_cost: float = Field(ge=0)
    price: float = Field(ge=0)


class PortfolioIn(BaseModel):
    positions: List[PositionIn]
    annual_dividend_per_share: dict[str, float] = {}


class CashflowIn(BaseModel):
    when: date
    amount: float


class ReturnPeriodIn(BaseModel):
    start_value: float = Field(gt=0)
    end_value: float = Field(ge=0)
    net_flow: float = 0.0


class AttributionIn(BaseModel):
    start_value: float
    end_value: float
    net_flows: float


class DeTaxIn(BaseModel):
    realized_gains: float
    freistellungsauftrag_remaining: float = 0.0
    church_tax_rate: float = Field(default=0.0, ge=0.0, le=0.2)


class EarningsIn(BaseModel):
    symbol: str
    report_url: str


class HoldingIn(BaseModel):
    symbol: str
    name: str | None = None
    quantity: float = 0.0
    earnings_url: str | None = None



class ScenarioIn(BaseModel):
    positions: List[PositionIn]
    equity_shock_pct: float = 0.0
    rate_shock_pct: float = 0.0
    dividend_cut_pct: float = 0.0


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/api/holdings/upsert")
def holdings_upsert(payload: HoldingIn) -> dict:
    upsert_holding(payload.symbol, payload.name, payload.quantity, payload.earnings_url)
    return {"ok": True, "symbol": payload.symbol.upper()}


@app.get("/api/holdings")
def holdings_list() -> dict:
    return {"rows": list_holdings()}


@app.post("/api/portfolio/metrics")
def portfolio_metrics(data: PortfolioIn) -> dict:
    positions = [Position(**p.model_dump()) for p in data.positions]
    return {
        "market_value": portfolio_market_value(positions),
        "cost_basis": portfolio_cost_basis(positions),
        "unrealized_pnl": unrealized_pnl(positions),
        "unrealized_return_pct": unrealized_return_pct(positions),
        "allocation": allocation_weights(positions),
        "monthly_dividend_forecast": monthly_dividend_forecast(
            positions, {k.upper(): v for k, v in data.annual_dividend_per_share.items()}
        ),
    }


@app.post("/api/portfolio/xirr")
def portfolio_xirr(cashflows: List[CashflowIn]) -> dict:
    if len(cashflows) < 2:
        raise HTTPException(status_code=400, detail="At least two cashflows required")
    cfs = [Cashflow(**cf.model_dump()) for cf in cashflows]
    x = irr_newton(cfs)
    return {"xirr_decimal": x, "xirr_pct": round(x * 100, 4)}


@app.post("/api/portfolio/twr")
def portfolio_twr(periods: List[ReturnPeriodIn]) -> dict:
    if not periods:
        raise HTTPException(status_code=400, detail="At least one period required")
    data = [ReturnPeriod(**p.model_dump()) for p in periods]
    t = twr(data)
    return {"twr_decimal": t, "twr_pct": round(t * 100, 4)}


@app.post("/api/portfolio/attribution")
def portfolio_attribution(data: AttributionIn) -> dict:
    return simple_attribution(data.start_value, data.end_value, data.net_flows)




@app.post("/api/scenario/apply")
def scenario_apply(data: ScenarioIn) -> dict:
    positions = [Position(**p.model_dump()) for p in data.positions]
    return apply_equity_scenario(
        positions=positions,
        equity_shock_pct=data.equity_shock_pct,
        rate_shock_pct=data.rate_shock_pct,
        dividend_cut_pct=data.dividend_cut_pct,
    )

@app.post("/api/tax/de/capital_gains")
def tax_de_capital_gains(data: DeTaxIn) -> dict:
    return de_capital_gains_tax(
        realized_gains=data.realized_gains,
        freistellungsauftrag_remaining=data.freistellungsauftrag_remaining,
        church_tax_rate=data.church_tax_rate,
    )


@app.post("/api/earnings/analyze")
def earnings_analyze(data: EarningsIn) -> dict:
    try:
        text = fetch_report_text(data.report_url)
        analysis = summarize_earnings_text(text)
        result = {"symbol": data.symbol.upper(), "report_url": data.report_url, **analysis}
        insert_earnings_result(data.symbol.upper(), data.report_url, analysis)
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Earnings fetch/analyze failed: {exc}") from exc


@app.post("/api/earnings/refresh_holdings")
def earnings_refresh_holdings() -> dict:
    rows = list_holdings()
    processed = []
    for h in rows:
        if not h.get("earnings_url"):
            continue
        try:
            text = fetch_report_text(h["earnings_url"])
            analysis = summarize_earnings_text(text)
            insert_earnings_result(h["symbol"], h["earnings_url"], analysis)
            processed.append({"symbol": h["symbol"], "ok": True, "summary": analysis.get("summary")})
        except Exception as exc:
            processed.append({"symbol": h["symbol"], "ok": False, "error": str(exc)})
    return {"processed": processed, "count": len(processed)}


@app.get("/api/earnings/recent")
def earnings_recent(limit: int = 20) -> dict:
    return {"rows": list_recent_earnings(limit)}


@app.get("/api/market/quote/{symbol}")
def market_quote(symbol: str) -> dict:
    try:
        return fetch_yahoo_quote(symbol)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Quote fetch failed: {exc}") from exc


@app.post("/api/broker/parse_csv")
def broker_parse_csv(payload: dict) -> dict:
    csv_content = payload.get("csv", "")
    if not csv_content:
        raise HTTPException(status_code=400, detail="'csv' field required")
    rows = parse_broker_csv(csv_content)
    return {"rows": rows, "count": len(rows)}


@app.post("/api/broker/normalize_csv")
def broker_normalize_csv(payload: dict) -> dict:
    csv_content = payload.get("csv", "")
    if not csv_content:
        raise HTTPException(status_code=400, detail="'csv' field required")
    rows = parse_broker_csv(csv_content)
    normalized = normalize_broker_rows(rows)
    return {"rows": normalized, "count": len(normalized)}
