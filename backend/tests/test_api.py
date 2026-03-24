from fastapi.testclient import TestClient

from backend.app import app


client = TestClient(app)


def test_health():
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json()['ok'] is True


def test_portfolio_metrics():
    payload = {
        'positions': [
            {'symbol': 'AAPL', 'quantity': 10, 'avg_cost': 145, 'price': 188},
            {'symbol': 'MSFT', 'quantity': 5, 'avg_cost': 312, 'price': 365},
        ],
        'annual_dividend_per_share': {'AAPL': 0.96, 'MSFT': 3.0},
    }
    r = client.post('/api/portfolio/metrics', json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data['market_value'] > 0
    assert 'allocation' in data


def test_scenario_apply():
    payload = {
        'positions': [
            {'symbol': 'AAPL', 'quantity': 10, 'avg_cost': 145, 'price': 188},
            {'symbol': 'MSFT', 'quantity': 5, 'avg_cost': 312, 'price': 365},
        ],
        'equity_shock_pct': 20,
        'rate_shock_pct': 1.5,
        'dividend_cut_pct': 10,
    }
    r = client.post('/api/scenario/apply', json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data['after_value'] < data['before_value']
    assert 'assumptions' in data


def test_tax_de_capital_gains():
    r = client.post('/api/tax/de/capital_gains', json={
        'realized_gains': 2000,
        'freistellungsauftrag_remaining': 1000,
        'church_tax_rate': 0.09,
    })
    assert r.status_code == 200
    data = r.json()
    assert data['taxable_base'] == 1000.0
    assert data['total_tax'] > 0


def test_broker_normalize_csv():
    csv_data = 'date,symbol,type,quantity,price,amount,fee\n2026-03-20,AAPL,buy,10,188,1880,1\n'
    r = client.post('/api/broker/normalize_csv', json={'csv': csv_data})
    assert r.status_code == 200
    rows = r.json()['rows']
    assert rows[0]['type'] == 'buy'
    assert rows[0]['symbol'] == 'AAPL'


def test_holdings_and_earnings_recent(monkeypatch):
    from backend import app as app_module

    monkeypatch.setattr(app_module, 'fetch_report_text', lambda _: 'Revenue 3.2 billion EPS 1.45 guidance updated margin improved')

    upsert = client.post('/api/holdings/upsert', json={
        'symbol': 'AAPL',
        'name': 'Apple',
        'quantity': 10,
        'earnings_url': 'https://example.com/aapl-report',
    })
    assert upsert.status_code == 200

    refresh = client.post('/api/earnings/refresh_holdings')
    assert refresh.status_code == 200

    recent = client.get('/api/earnings/recent?limit=5')
    assert recent.status_code == 200
    assert isinstance(recent.json()['rows'], list)
