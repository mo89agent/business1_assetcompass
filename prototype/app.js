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
const searchInput = document.getElementById('searchInput');
const donutPrimary = document.getElementById('donutPrimary');
const donutValue = document.getElementById('donutValue');
const donutLabel = document.getElementById('donutLabel');
const allocationList = document.getElementById('allocationList');
const topAssetsBody = document.getElementById('topAssetsBody');
const flopAssetsBody = document.getElementById('flopAssetsBody');

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

let assets = [];
let positions = [];
let annualDividendMap = {};
let latestAllocation = [];

function euro(v) { return `€ ${Number(v || 0).toLocaleString('de-DE', {maximumFractionDigits: 2})}`; }

function switchView(viewId) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
  views.forEach(v => v.classList.toggle('active', v.id === viewId));
  title.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);
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

  assets = rows.map(r => ({
    symbol: String(r.symbol || r.ticker || '').toUpperCase(),
    name: String(r.name || ''),
    quantity: Number(r.quantity || 0),
    avg_cost: Number(r.avg_cost || 0),
    price: Number(r.price || 0),
    annual_dividend_per_share: Number(r.annual_dividend_per_share || 0),
    currency: String(r.currency || ''),
    sector: String(r.sector || ''),
    is_watchlist: String(r.is_watchlist || 'false').toLowerCase() === 'true',
  })).filter(a => a.symbol);

  positions = assets
    .filter(a => !a.is_watchlist)
    .map(a => ({ symbol: a.symbol, quantity: a.quantity, avg_cost: a.avg_cost, price: a.price }));

  annualDividendMap = {};
  assets.forEach(a => { annualDividendMap[a.symbol] = a.annual_dividend_per_share || 0; });
  renderMovers();
  renderAllocation([]);
}

async function loadPortfolio() {
  if (!portfolioFile.files.length) {
    loadStatus.textContent = 'Bitte CSV auswählen.';
    return;
  }
  const text = await portfolioFile.files[0].text();
  parseCsv(text);
  const watchlistCount = assets.filter(a => a.is_watchlist).length;
  loadStatus.textContent = `${positions.length} Positionen geladen, ${watchlistCount} Watchlist.`;
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
    latestAllocation = data.allocation || [];
    renderStocks(latestAllocation);
    renderAllocation(latestAllocation);
  } catch (e) {
    loadStatus.textContent = `Backend Fehler: ${e.message}`;
  }
}

function renderStocks(allocation) {
  const weights = Object.fromEntries(allocation.map(a => [a.symbol, a.weight_pct]));
  const filterText = String(searchInput?.value || '').toLowerCase();
  const visibleAssets = assets.filter(a => {
    if (!filterText) return true;
    return a.symbol.toLowerCase().includes(filterText) || a.name.toLowerCase().includes(filterText);
  });

  stocksTableBody.innerHTML = visibleAssets.map(a => {
    const mv = a.quantity * a.price;
    const w = a.is_watchlist ? 0 : (weights[a.symbol] || 0);
    const status = a.is_watchlist ? "Watchlist" : "Im Portfolio";
    return `<tr><td>${a.symbol}</td><td>${a.name || "-"}</td><td>${a.quantity}</td><td>${a.avg_cost}</td><td>${a.price}</td><td>${euro(mv)}</td><td>${w.toFixed(2)}%</td><td>${status}</td></tr>`;
  }).join('') || '<tr><td colspan="8">Keine Daten geladen</td></tr>';
}

function renderAllocation(allocation) {
  const portfolioAssets = assets.filter(a => !a.is_watchlist);
  if (!portfolioAssets.length) {
    donutPrimary?.setAttribute('stroke-dasharray', '0 100');
    donutValue.textContent = '0%';
    donutLabel.textContent = 'Keine Daten';
    allocationList.innerHTML = '<span class="muted">Portfolio laden, um Verteilung zu sehen.</span>';
    return;
  }

  const portfolioMarketValue = portfolioAssets.reduce((sum, a) => sum + (a.quantity * a.price), 0);
  const bucketValues = {};
  portfolioAssets.forEach(a => {
    const key = a.sector || 'Unkategorisiert';
    bucketValues[key] = (bucketValues[key] || 0) + (a.quantity * a.price);
  });

  const buckets = Object.entries(bucketValues)
    .map(([name, value]) => ({ name, value, pct: portfolioMarketValue ? (value / portfolioMarketValue) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct);

  const lead = buckets[0];
  donutPrimary?.setAttribute('stroke-dasharray', `${lead.pct.toFixed(1)} ${Math.max(0, 100 - lead.pct).toFixed(1)}`);
  donutValue.textContent = `${lead.pct.toFixed(1)}%`;
  donutLabel.textContent = lead.name;

  allocationList.innerHTML = buckets.map(b => `
    <div class="alloc-row">
      <div>
        <strong>${b.name}</strong>
        <div class="bar"><i style="width:${Math.min(100, b.pct)}%"></i></div>
      </div>
      <div><strong>${b.pct.toFixed(2)}%</strong><span>${euro(b.value)}</span></div>
    </div>
  `).join('');
}

function renderMovers() {
  const portfolioAssets = assets.filter(a => !a.is_watchlist);
  const byMarketValue = [...portfolioAssets]
    .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
    .slice(0, 5);

  const byPnl = [...portfolioAssets]
    .map(a => ({ ...a, pnl: (a.price - a.avg_cost) * a.quantity }))
    .sort((a, b) => a.pnl - b.pnl)
    .slice(0, 5);

  topAssetsBody.innerHTML = byMarketValue.map(a => `
    <tr><td>${a.symbol} <small>${a.name || ''}</small></td><td>${euro(a.quantity * a.price)}</td></tr>
  `).join('') || '<tr><td colspan="2">Keine Daten</td></tr>';

  flopAssetsBody.innerHTML = byPnl.map(a => `
    <tr><td>${a.symbol} <small>${a.name || ''}</small></td><td class="${a.pnl >= 0 ? 'pos' : 'neg'}">${euro(a.pnl)}</td></tr>
  `).join('') || '<tr><td colspan="2">Keine Daten</td></tr>';
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
if (searchInput) searchInput.addEventListener('input', () => renderStocks(latestAllocation));

deBtn?.addEventListener('click', () => { deBtn.classList.add('active'); enBtn.classList.remove('active'); });
enBtn?.addEventListener('click', () => { enBtn.classList.add('active'); deBtn.classList.remove('active'); });

switchView('dashboard');
