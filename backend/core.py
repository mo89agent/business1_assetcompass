from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, List


@dataclass
class Position:
    symbol: str
    quantity: float
    avg_cost: float
    price: float


@dataclass
class Cashflow:
    when: date
    amount: float  # negative = investment outflow, positive = inflow


@dataclass
class ReturnPeriod:
    start_value: float
    end_value: float
    net_flow: float = 0.0  # contributions positive, withdrawals negative within the period


def portfolio_market_value(positions: Iterable[Position]) -> float:
    return round(sum(p.quantity * p.price for p in positions), 2)


def portfolio_cost_basis(positions: Iterable[Position]) -> float:
    return round(sum(p.quantity * p.avg_cost for p in positions), 2)


def unrealized_pnl(positions: Iterable[Position]) -> float:
    return round(portfolio_market_value(positions) - portfolio_cost_basis(positions), 2)


def unrealized_return_pct(positions: Iterable[Position]) -> float:
    basis = portfolio_cost_basis(positions)
    if basis == 0:
        return 0.0
    return round((unrealized_pnl(positions) / basis) * 100, 4)


def allocation_weights(positions: Iterable[Position]) -> List[dict]:
    positions = list(positions)
    total = portfolio_market_value(positions)
    if total == 0:
        return [{"symbol": p.symbol, "weight_pct": 0.0} for p in positions]
    return [
        {
            "symbol": p.symbol,
            "weight_pct": round((p.quantity * p.price) / total * 100, 4),
        }
        for p in positions
    ]


def monthly_dividend_forecast(positions: Iterable[Position], annual_dividend_per_share: dict[str, float]) -> float:
    forecast_annual = 0.0
    for p in positions:
        dps = annual_dividend_per_share.get(p.symbol, 0.0)
        forecast_annual += p.quantity * dps
    return round(forecast_annual / 12.0, 2)


def irr_newton(cashflows: Iterable[Cashflow], guess: float = 0.1) -> float:
    """XIRR-like annualized return using Newton-Raphson. Returns decimal (0.1 == 10%)."""
    cfs = sorted(cashflows, key=lambda x: x.when)
    if len(cfs) < 2:
        return 0.0

    t0 = cfs[0].when

    def npv(rate: float) -> float:
        total = 0.0
        for cf in cfs:
            years = (cf.when - t0).days / 365.25
            total += cf.amount / ((1 + rate) ** years)
        return total

    def d_npv(rate: float) -> float:
        total = 0.0
        for cf in cfs:
            years = (cf.when - t0).days / 365.25
            if years == 0:
                continue
            total += (-years * cf.amount) / ((1 + rate) ** (years + 1))
        return total

    rate = guess
    for _ in range(100):
        f = npv(rate)
        df = d_npv(rate)
        if abs(df) < 1e-12:
            break
        new_rate = rate - f / df
        if abs(new_rate - rate) < 1e-9:
            return round(new_rate, 8)
        rate = new_rate

    return round(rate, 8)


def twr(periods: Iterable[ReturnPeriod]) -> float:
    """
    Time-weighted return over subperiods:
    r_i = (end - flow) / start - 1
    twr = product(1+r_i)-1
    """
    growth = 1.0
    for p in periods:
        if p.start_value <= 0:
            continue
        r_i = ((p.end_value - p.net_flow) / p.start_value) - 1
        growth *= 1 + r_i
    return round(growth - 1, 8)


def simple_attribution(start_value: float, end_value: float, net_flows: float) -> dict:
    market_effect = end_value - start_value - net_flows
    return {
        "start_value": round(start_value, 2),
        "net_flows": round(net_flows, 2),
        "market_effect": round(market_effect, 2),
        "end_value": round(end_value, 2),
    }


def de_capital_gains_tax(
    realized_gains: float,
    freistellungsauftrag_remaining: float = 0.0,
    church_tax_rate: float = 0.0,
) -> dict:
    """
    Simplified DE tax model (Abgeltungsteuer) for MVP:
    - taxable base = max(0, gains - freistellungsauftrag)
    - abgeltungsteuer: 25%
    - soli: 5.5% of abgeltungsteuer
    - church tax optional on abgeltungsteuer (e.g. 0.08/0.09)
    """
    taxable_base = max(0.0, realized_gains - max(0.0, freistellungsauftrag_remaining))
    abgeltungsteuer = taxable_base * 0.25
    soli = abgeltungsteuer * 0.055
    church = abgeltungsteuer * max(0.0, church_tax_rate)
    total_tax = abgeltungsteuer + soli + church
    net_after_tax = realized_gains - total_tax

    return {
        "realized_gains": round(realized_gains, 2),
        "freistellungsauftrag_used": round(min(max(realized_gains, 0.0), max(freistellungsauftrag_remaining, 0.0)), 2),
        "taxable_base": round(taxable_base, 2),
        "abgeltungsteuer": round(abgeltungsteuer, 2),
        "soli": round(soli, 2),
        "church_tax": round(church, 2),
        "total_tax": round(total_tax, 2),
        "net_after_tax": round(net_after_tax, 2),
    }


def apply_equity_scenario(
    positions: Iterable[Position],
    equity_shock_pct: float,
    rate_shock_pct: float,
    dividend_cut_pct: float,
) -> dict:
    """
    Simplified scenario model for MVP:
    - equity shock directly affects price level
    - rate shock adds additional valuation compression (0.5% price impact per +1% rates)
    - dividend cut reduces forecast dividends
    """
    positions = list(positions)
    before_value = portfolio_market_value(positions)

    rate_impact_pct = max(rate_shock_pct, 0.0) * 0.5
    total_price_impact_pct = equity_shock_pct + rate_impact_pct
    price_multiplier = max(0.0, 1 - total_price_impact_pct / 100)

    projected = []
    for p in positions:
        new_price = round(p.price * price_multiplier, 4)
        new_value = round(p.quantity * new_price, 2)
        projected.append(
            {
                "symbol": p.symbol,
                "quantity": p.quantity,
                "old_price": p.price,
                "new_price": new_price,
                "old_value": round(p.quantity * p.price, 2),
                "new_value": new_value,
            }
        )

    after_value = round(sum(x["new_value"] for x in projected), 2)
    delta = round(after_value - before_value, 2)
    delta_pct = round((delta / before_value) * 100, 4) if before_value else 0.0

    return {
        "assumptions": {
            "equity_shock_pct": equity_shock_pct,
            "rate_shock_pct": rate_shock_pct,
            "rate_impact_pct": rate_impact_pct,
            "dividend_cut_pct": dividend_cut_pct,
            "price_multiplier": round(price_multiplier, 6),
        },
        "before_value": before_value,
        "after_value": after_value,
        "delta": delta,
        "delta_pct": delta_pct,
        "projected_positions": projected,
    }
