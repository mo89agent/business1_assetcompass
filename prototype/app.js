const navButtons = document.querySelectorAll('.nav');
const views = document.querySelectorAll('.view');
const title = document.getElementById('screenTitle');
const deBtn = document.getElementById('deBtn');
const enBtn = document.getElementById('enBtn');
const quoteOutput = document.getElementById('quoteOutput');
const loadQuoteBtn = document.getElementById('loadQuoteBtn');
const refreshEarningsBtn = document.getElementById('refreshEarningsBtn');
const earningsOutput = document.getElementById('earningsOutput');

const labels = {
  de: {
    dashboard: 'Dashboard', stocks: 'Aktien & ETFs', asset: 'Asset Detail', dividends: 'Dividenden', news: 'News', earnings: 'Earnings', scenario: 'Szenarien',
    networth: 'Gesamtvermögen', day_change: 'Tagesveränderung', monthly_cashflow: 'Monats-Cashflow', dividend_forecast: 'Dividenden (12M)',
    trend: 'Net-Worth Verlauf', allocation: 'Asset Allocation'
  },
  en: {
    dashboard: 'Dashboard', stocks: 'Stocks & ETFs', asset: 'Asset Detail', dividends: 'Dividends', news: 'News', earnings: 'Earnings', scenario: 'Scenarios',
    networth: 'Net Worth', day_change: 'Day Change', monthly_cashflow: 'Monthly Cashflow', dividend_forecast: 'Dividends (12M)',
    trend: 'Net Worth Trend', allocation: 'Asset Allocation'
  }
};

let lang = 'de';

function switchView(viewId) {
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewId));
  views.forEach(v => v.classList.toggle('active', v.id === viewId));
  title.textContent = labels[lang][viewId];
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = labels[lang][el.dataset.i18n];
  });
  const active = [...navButtons].find(b => b.classList.contains('active'));
  if (active) title.textContent = labels[lang][active.dataset.view];
  navButtons.forEach(btn => btn.textContent = labels[lang][btn.dataset.view]);
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
deBtn.addEventListener('click', () => { lang = 'de'; deBtn.classList.add('active'); enBtn.classList.remove('active'); applyLang(); });
enBtn.addEventListener('click', () => { lang = 'en'; enBtn.classList.add('active'); deBtn.classList.remove('active'); applyLang(); });
if (loadQuoteBtn) loadQuoteBtn.addEventListener('click', loadQuote);
if (refreshEarningsBtn) refreshEarningsBtn.addEventListener('click', refreshEarnings);

applyLang();
switchView('dashboard');
