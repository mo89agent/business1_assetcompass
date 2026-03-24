const navButtons = document.querySelectorAll('.nav');
const views = document.querySelectorAll('.view');
const title = document.getElementById('screenTitle');
const deBtn = document.getElementById('deBtn');
const enBtn = document.getElementById('enBtn');

const portfolioFile = document.getElementById('portfolioFile');
const loadPortfolioBtn = document.getElementById('loadPortfolioBtn');
const loadStatus = document.getElementById('loadStatus');

const kpiNetWorth = document.getElementById('kpiNetWorth');
const kpiPnl = document.getElementById('kpiPnl');
const kpiCashflow = document.getElementById('kpiCashflow');
const kpiDividend = document.getElementById('kpiDividend');
const stocksTableBody = document.getElementById('stocksTableBody');

const quoteOutput = document.getElementById('quoteOutput');
const loadQuoteBtn = document.getElementById('loadQuoteBtn');
const refreshEarningsBtn = document.getElementById('refreshEarningsBtn');
const earningsOutput = document.getElementById('earningsOutput');

const equityShock = document.getElementById('equityShock');
const rateShock = document.getElementById('rateShock');
const divCut = document.getElementById('divCut');
const applyScenarioBtn = document.getElementById('applyScenarioBtn');
const scBefore = document.getElementById('scBefore');
const scAfter = document.getElementById('scAfter');
const scDelta = document.getElementById('scDelta');
const scDeltaPct = document.getElementById('scDeltaPct');

let positions = [];
let annualDividendMap = {};

function euro(v) { return `€ ${Number(v || 0).toLocaleString('de-DE', {maximumFractionDigits: 2})}`; }

function switchView(viewId) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
  views.forEach(v => v.classList.toggle('active', v.id === viewId));
  title.textContent = viewId;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(x => x.trim());
  const rows = lines.map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = (cols[i] || '').trim());
    return obj;
  });

  positions = rows.map(r => ({
    symbol: String(r.symbol || r.ticker || '').toUpperCase(),
    quantity: Number(r.quantity || 0),
    avg_cost: Number(r.avg_cost || 0),
    price: Number(r.price || 0),
  })).filter(p => p.symbol);

  annualDividendMap = {};
  rows.forEach(r => {
    const sym = String(r.symbol || r.ticker || '').toUpperCase();
    annualDividendMap[sym] = Number(r.annual_dividend_per_share || 0);
  });
}

async function loadPortfolio() {
  if (!portfolioFile.files.length) {
    loadStatus.textContent = 'Bitte CSV auswählen.';
    return;
  }
  const text = await portfolioFile.files[0].text();
  parseCsv(text);
  loadStatus.textContent = `${positions.length} Positionen geladen.`;
  await refreshMetrics();
  renderStocks([]);
}

async function refreshMetrics() {
  if (!positions.length) return;
  try {
    const r = await fetch('http://localhost:9000/api/portfolio/metrics', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ positions, annual_dividend_per_share: annualDividendMap })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fehler');

    kpiNetWorth.textContent = euro(data.market_value);
    kpiPnl.textContent = euro(data.unrealized_pnl);
    kpiCashflow.textContent = euro(data.monthly_dividend_forecast);
    kpiDividend.textContent = euro((data.monthly_dividend_forecast || 0) * 12);
    renderStocks(data.allocation || []);
  } catch (e) {
    loadStatus.textContent = `Backend Fehler: ${e.message}`;
  }
}

function renderStocks(allocation) {
  const weights = Object.fromEntries(allocation.map(a => [a.symbol, a.weight_pct]));
  stocksTableBody.innerHTML = positions.map(p => {
    const mv = p.quantity * p.price;
    const w = weights[p.symbol] || 0;
    return `<tr><td>${p.symbol}</td><td>${p.quantity}</td><td>${p.avg_cost}</td><td>${p.price}</td><td>${euro(mv)}</td><td>${w.toFixed(2)}%</td></tr>`;
  }).join('') || '<tr><td colspan="6">Keine Daten geladen</td></tr>';
}

async function applyScenario() {
  if (!positions.length) { scDelta.textContent = 'Bitte erst Portfolio laden'; return; }
  try {
    const r = await fetch('http://localhost:9000/api/scenario/apply', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        positions,
        equity_shock_pct: Number(equityShock.value),
        rate_shock_pct: Number(rateShock.value),
        dividend_cut_pct: Number(divCut.value),
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fehler');

    scBefore.textContent = euro(data.before_value);
    scAfter.textContent = euro(data.after_value);
    scDelta.textContent = euro(data.delta);
    scDeltaPct.textContent = `${data.delta_pct}%`;
  } catch (e) {
    scDelta.textContent = `Fehler: ${e.message}`;
  }
}

async function loadQuote() {
  quoteOutput.textContent = 'lädt...';
  try {
    const r = await fetch('http://localhost:9000/api/market/quote/AAPL');
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fehler');
    quoteOutput.textContent = `${data.symbol}: ${data.regularMarketPrice ?? data.lastCloseSeries} ${data.currency || ''}`;
  } catch (e) {
    quoteOutput.textContent = `Fehler: ${e.message}`;
  }
}

async function refreshEarnings() {
  earningsOutput.textContent = 'Lade Holdings-Earnings...';
  try {
    const refresh = await fetch('http://localhost:9000/api/earnings/refresh_holdings', { method: 'POST' });
    const refreshJson = await refresh.json();
    const recent = await fetch('http://localhost:9000/api/earnings/recent?limit=10');
    const recentJson = await recent.json();
    earningsOutput.textContent = JSON.stringify({ refresh: refreshJson, recent: recentJson }, null, 2);
  } catch (e) {
    earningsOutput.textContent = `Fehler: ${e.message}`;
  }
}

navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
if (loadPortfolioBtn) loadPortfolioBtn.addEventListener('click', loadPortfolio);
if (applyScenarioBtn) applyScenarioBtn.addEventListener('click', applyScenario);
if (loadQuoteBtn) loadQuoteBtn.addEventListener('click', loadQuote);
if (refreshEarningsBtn) refreshEarningsBtn.addEventListener('click', refreshEarnings);

deBtn?.addEventListener('click', () => { deBtn.classList.add('active'); enBtn.classList.remove('active'); });
enBtn?.addEventListener('click', () => { enBtn.classList.add('active'); deBtn.classList.remove('active'); });

switchView('dashboard');
