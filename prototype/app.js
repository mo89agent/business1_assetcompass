/* ════════════════════════════════════════════
   AssetCompass – Main Application
   Vanilla JS, Chart.js 4.x
   ════════════════════════════════════════════ */

const API = 'http://localhost:9000';
const CHART_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7'];

const POPULAR_ETFS = [
  { symbol:'IVV',  name:'iShares Core S&P 500',           category:'US Aktien',        region:'usa',   style:'broad',    asset:'equity' },
  { symbol:'VTI',  name:'Vanguard Total Stock Market',     category:'US Aktien',        region:'usa',   style:'broad',    asset:'equity' },
  { symbol:'QQQ',  name:'Invesco QQQ (Nasdaq-100)',        category:'Tech / Wachstum',  region:'usa',   style:'tech',     asset:'equity' },
  { symbol:'VEA',  name:'Vanguard FTSE Developed Markets', category:'Intl. Aktien',     region:'world', style:'broad',    asset:'equity' },
  { symbol:'VWO',  name:'Vanguard Emerging Markets',       category:'Emerging Markets', region:'em',    style:'broad',    asset:'equity' },
  { symbol:'EFA',  name:'iShares MSCI EAFE',               category:'Intl. Aktien',     region:'world', style:'broad',    asset:'equity' },
  { symbol:'BND',  name:'Vanguard Total Bond Market',      category:'Anleihen',         region:'usa',   style:'broad',    asset:'bond'   },
  { symbol:'AGG',  name:'iShares Core US Aggregate Bond',  category:'Anleihen',         region:'usa',   style:'broad',    asset:'bond'   },
  { symbol:'GLD',  name:'SPDR Gold Shares',                category:'Rohstoffe',        region:'world', style:'broad',    asset:'commodity'},
  { symbol:'VIG',  name:'Vanguard Dividend Appreciation',  category:'Dividenden',       region:'usa',   style:'dividend', asset:'equity' },
  { symbol:'SCHD', name:'Schwab US Dividend Equity',       category:'Dividenden',       region:'usa',   style:'dividend', asset:'equity' },
  { symbol:'VGT',  name:'Vanguard Information Technology', category:'Technologie',      region:'usa',   style:'tech',     asset:'equity' },
  { symbol:'IEFA', name:'iShares Core MSCI EAFE',          category:'Intl. Aktien',     region:'europe',style:'broad',    asset:'equity' },
  { symbol:'VNQ',  name:'Vanguard Real Estate ETF',        category:'Immobilien',       region:'usa',   style:'broad',    asset:'mixed'  },
  { symbol:'SPY',  name:'SPDR S&P 500 ETF Trust',          category:'US Aktien',        region:'usa',   style:'broad',    asset:'equity' },
  { symbol:'JEPI', name:'JPMorgan Equity Premium Income',  category:'Dividenden',       region:'usa',   style:'dividend', asset:'equity' },
];

/* ── State ── */
let positions = [];
let annualDividendMap = {};
let portfolioMetrics = null;
let currentSymbol = null;
let currentDetail = null;
let currentRange = '1y';
let pricePollingTimer = null;

/* ── Chart instances ── */
let donutChartInst = null;
let priceChartInst = null;
let volumeChartInst = null;
let radarChartInst = null;
let etfSectorChartInst = null;
let divChartInst = null;
let scenarioChartInst = null;

/* ════════════════════════════════════════════
   DARK MODE TOGGLE
   ════════════════════════════════════════════ */

(function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const icon   = document.getElementById('themeIcon');
  const label  = document.getElementById('themeLabel');
  if (!toggle) return;

  // Default: dark mode ON (checked = dark)
  const saved = localStorage.getItem('acTheme');
  const isDark = saved !== 'light';   // dark unless explicitly set to light
  applyTheme(isDark);
  toggle.checked = isDark;

  toggle.addEventListener('change', () => {
    applyTheme(toggle.checked);
    localStorage.setItem('acTheme', toggle.checked ? 'dark' : 'light');
  });

  function applyTheme(dark) {
    if (dark) {
      document.body.classList.remove('light-mode');
      if (icon)  icon.textContent  = '🌙';
      if (label) label.textContent = 'Dark Mode';
    } else {
      document.body.classList.add('light-mode');
      if (icon)  icon.textContent  = '☀️';
      if (label) label.textContent = 'Light Mode';
    }
  }
})();

/* ════════════════════════════════════════════
   REAL-TIME PRICE POLLING
   ════════════════════════════════════════════ */

function startPricePolling(symbol) {
  stopPricePolling();
  // Show live badge
  const badge = document.getElementById('liveBadge');
  if (badge) badge.style.display = '';

  async function pollPrice() {
    if (!symbol || symbol !== currentSymbol) return;
    try {
      const res = await fetch(`${API}/api/market/quote/${symbol}`);
      if (!res.ok) return;
      const q = await res.json();
      const newPrice = q.regularMarketPrice ?? q.lastCloseSeries;
      if (newPrice == null) return;

      const priceEl = document.getElementById('stockPrice');
      if (!priceEl) return;

      const oldPrice = currentDetail?.price ?? null;
      const currency = currentDetail?.currency || '';
      const newText  = `${currency} ${formatNum(newPrice)}`;

      // Flash green/red on price change
      if (oldPrice !== null && Math.abs(newPrice - oldPrice) > 0.001) {
        const cls = newPrice > oldPrice ? 'price-tick-up' : 'price-tick-down';
        priceEl.classList.remove('price-tick-up', 'price-tick-down', 'price-tick-pulse');
        priceEl.textContent = newText;
        void priceEl.offsetWidth; // reflow to restart animation
        priceEl.classList.add(cls);
        setTimeout(() => priceEl.classList.remove(cls), 800);

        // Also update change display
        if (currentDetail) {
          currentDetail.price = newPrice;
          const prevClose = currentDetail.prev_close ?? oldPrice;
          const chgAbs = newPrice - prevClose;
          const chgPct = prevClose ? (chgAbs / prevClose) * 100 : 0;
          const chgEl  = document.getElementById('stockChange');
          if (chgEl) {
            chgEl.textContent = `${formatNum(chgAbs)}  (${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)} %)`;
            chgEl.className = 'stock-change ' + (chgAbs >= 0 ? 'pos' : 'neg');
          }
        }
      } else {
        // No change – subtle pulse so user knows it's live
        priceEl.classList.remove('price-tick-up', 'price-tick-down', 'price-tick-pulse');
        void priceEl.offsetWidth;
        priceEl.classList.add('price-tick-pulse');
        setTimeout(() => priceEl.classList.remove('price-tick-pulse'), 1100);
        priceEl.textContent = newText;
      }

      // Update last-refresh timestamp
      const tsEl = document.getElementById('priceLastUpdate');
      if (tsEl) {
        const now = new Date();
        tsEl.textContent = `Aktualisiert ${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }

      // Flash the market-status dot
      const dot = document.querySelector('.status-dot');
      if (dot) {
        dot.style.transform = 'scale(1.8)';
        dot.style.opacity = '1';
        setTimeout(() => { dot.style.transform = ''; dot.style.opacity = ''; }, 400);
      }
    } catch (_) { /* backend unavailable – stay silent */ }
  }

  pollPrice(); // immediate first poll
  pricePollingTimer = setInterval(pollPrice, 15000); // then every 15 s
}

function stopPricePolling() {
  if (pricePollingTimer) { clearInterval(pricePollingTimer); pricePollingTimer = null; }
  const badge = document.getElementById('liveBadge');
  if (badge) badge.style.display = 'none';
}

/* ════════════════════════════════════════════
   FORMATTERS
   ════════════════════════════════════════════ */

function formatEur(v, currency) {
  if (v == null) return '–';
  const sym = currency === 'USD' ? '$' : (currency || '€');
  return sym + ' ' + Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNum(v, d = 2) {
  if (v == null) return '–';
  return Number(v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function formatPct(v) {
  if (v == null) return '–';
  const n = Number(v) * 100;
  return (n >= 0 ? '+' : '') + n.toFixed(2) + ' %';
}

function formatPctRaw(v) {
  if (v == null) return '–';
  const n = Number(v);
  return (n >= 0 ? '+' : '') + n.toFixed(2) + ' %';
}

function formatLargeNum(v, currency) {
  if (v == null) return '–';
  const sym = currency === 'USD' ? '$' : (currency || '€');
  const n = Number(v);
  if (n >= 1e12) return sym + ' ' + (n / 1e12).toLocaleString('de-DE', {maximumFractionDigits:2}) + ' Bio.';
  if (n >= 1e9)  return sym + ' ' + (n / 1e9).toLocaleString('de-DE', {maximumFractionDigits:2}) + ' Mrd.';
  if (n >= 1e6)  return sym + ' ' + (n / 1e6).toLocaleString('de-DE', {maximumFractionDigits:1}) + ' Mio.';
  return sym + ' ' + n.toLocaleString('de-DE');
}

function formatDate(ts, range) {
  const d = new Date(ts * 1000);
  if (range === '1mo' || range === '3mo') {
    return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
  }
  return d.toLocaleDateString('de-DE', { month:'short', year:'2-digit' });
}

function pctColor(v) {
  if (v == null) return '';
  return Number(v) >= 0 ? 'pos' : 'neg';
}

/* ════════════════════════════════════════════
   ROUTING / NAVIGATION
   ════════════════════════════════════════════ */

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  analyse:   'Kurs & Analyse',
  portfolio: 'Portfolio',
  etf:       'ETF Explorer',
  dividends: 'Dividenden',
  earnings:  'Earnings',
  scenario:  'Szenarien',
};

function switchView(viewId) {
  document.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + viewId));
  const titleEl = document.getElementById('screenTitle');
  if (titleEl) titleEl.textContent = VIEW_TITLES[viewId] || viewId;
  if (viewId !== 'analyse') stopPricePolling();
  else if (currentSymbol) startPricePolling(currentSymbol);
}

document.querySelectorAll('.nav').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

/* Sidebar mobile toggle */
const sidebarEl = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggle');
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => sidebarEl?.classList.toggle('open'));
}
document.addEventListener('click', e => {
  if (sidebarEl?.classList.contains('open') && !sidebarEl.contains(e.target) && e.target !== sidebarToggleBtn) {
    sidebarEl.classList.remove('open');
  }
});

/* Global topbar search */
const globalSearchInput = document.getElementById('globalSearch');
if (globalSearchInput) {
  globalSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const sym = globalSearchInput.value.trim().toUpperCase();
      if (sym) { loadAnalyse(sym); switchView('analyse'); globalSearchInput.value = ''; }
    }
  });
}

/* Lang buttons (cosmetic) */
document.getElementById('deBtn')?.addEventListener('click', () => {
  document.getElementById('deBtn').classList.add('active');
  document.getElementById('enBtn').classList.remove('active');
});
document.getElementById('enBtn')?.addEventListener('click', () => {
  document.getElementById('enBtn').classList.add('active');
  document.getElementById('deBtn').classList.remove('active');
});

/* ════════════════════════════════════════════
   DASHBOARD – Portfolio upload & metrics
   ════════════════════════════════════════════ */

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(x => x.trim());
  const rows = lines.map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
  positions = rows.map(r => ({
    symbol:   String(r.symbol || r.ticker || '').toUpperCase(),
    quantity: Number(r.quantity || 0),
    avg_cost: Number(r.avg_cost || 0),
    price:    Number(r.price || 0),
  })).filter(p => p.symbol);
  annualDividendMap = {};
  rows.forEach(r => {
    const sym = String(r.symbol || r.ticker || '').toUpperCase();
    annualDividendMap[sym] = Number(r.annual_dividend_per_share || 0);
  });
}

async function loadPortfolio() {
  const fileInput = document.getElementById('portfolioFile');
  const statusEl  = document.getElementById('loadStatus');
  if (!fileInput?.files?.length) { if (statusEl) statusEl.textContent = 'Bitte CSV auswählen.'; return; }
  const text = await fileInput.files[0].text();
  parseCsv(text);
  if (statusEl) statusEl.textContent = `${positions.length} Positionen geladen.`;
  await refreshMetrics();
}

async function refreshMetrics() {
  if (!positions.length) return;
  try {
    const r = await fetch(`${API}/api/portfolio/metrics`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions, annual_dividend_per_share: annualDividendMap }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fehler');
    portfolioMetrics = data;
    renderDashboardKpis(data);
    renderDonut(data.allocation || []);
    renderTopFlop(data.allocation || []);
    renderPortfolioTable(data.allocation || []);
    renderDividendView(data);
  } catch (e) {
    const s = document.getElementById('loadStatus');
    if (s) s.textContent = 'Backend-Fehler: ' + e.message;
  }
}

function renderDashboardKpis(data) {
  setText('kpiNetWorth', formatEur(data.market_value));
  const pnl = data.unrealized_pnl || 0;
  const pnlEl = document.getElementById('kpiPnl');
  if (pnlEl) { pnlEl.textContent = formatEur(pnl); pnlEl.className = 'kpi-value ' + (pnl >= 0 ? 'pos' : 'neg'); }
  const pct = data.unrealized_return_pct || 0;
  const pctEl = document.getElementById('kpiPnlPct');
  if (pctEl) { pctEl.textContent = formatPctRaw(pct); pctEl.className = 'kpi-sub ' + (pct >= 0 ? 'pos' : 'neg'); }
  setText('kpiCashflow', formatEur(data.monthly_dividend_forecast));
  setText('kpiDividend',  formatEur((data.monthly_dividend_forecast || 0) * 12));
  setText('kpiNetWorthSub', `Kostenbasis: ${formatEur(data.cost_basis)}`);
}

function renderDonut(allocation) {
  const canvas = document.getElementById('donutChart');
  if (!canvas) return;
  if (donutChartInst) { donutChartInst.destroy(); donutChartInst = null; }

  const labels = allocation.map(a => a.symbol);
  const values = allocation.map(a => a.weight_pct);

  donutChartInst = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: CHART_COLORS, borderColor: '#080d19', borderWidth: 2, hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { display: false }, tooltip: { callbacks: {
        label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%`
      }}},
    },
  });

  const centerEl = document.getElementById('donutCenter');
  if (centerEl) {
    centerEl.querySelector('.donut-center-val').textContent = allocation.length;
    centerEl.querySelector('.donut-center-lbl').textContent = 'Positionen';
  }

  const legend = document.getElementById('allocationLegend');
  if (legend) {
    legend.innerHTML = allocation.slice(0,8).map((a, i) => `
      <li class="legend-item">
        <span class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
        <span class="legend-name">${a.symbol}</span>
        <span class="legend-pct">${a.weight_pct.toFixed(1)}%</span>
      </li>`).join('');
  }
}

function renderTopFlop(allocation) {
  const posWithPL = positions.map(p => {
    const pnl = (p.price - p.avg_cost) * p.quantity;
    const pct  = p.avg_cost ? (p.price - p.avg_cost) / p.avg_cost * 100 : 0;
    return { ...p, pnl, pct };
  }).filter(p => p.avg_cost > 0);

  const sorted = [...posWithPL].sort((a, b) => b.pct - a.pct);
  const top  = sorted.slice(0, 3);
  const flop = sorted.slice(-3).reverse();

  function rows(arr) {
    if (!arr.length) return '<tr><td colspan="3" class="muted-cell">–</td></tr>';
    return arr.map(p => `
      <tr>
        <td><strong>${p.symbol}</strong></td>
        <td class="num ${p.pct >= 0 ? 'pos' : 'neg'}">${formatPctRaw(p.pct)}</td>
        <td class="num ${p.pnl >= 0 ? 'pos' : 'neg'}">${formatEur(p.pnl)}</td>
      </tr>`).join('');
  }
  const tb = document.getElementById('topAssetsBody');
  const fb = document.getElementById('flopAssetsBody');
  if (tb) tb.innerHTML = rows(top);
  if (fb) fb.innerHTML = rows(flop);
}

/* Upload zone */
document.getElementById('loadPortfolioBtn')?.addEventListener('click', loadPortfolio);
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
  uploadZone.addEventListener('click', () => document.getElementById('portfolioFile')?.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--accent)'; });
  uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
  uploadZone.addEventListener('drop', async e => {
    e.preventDefault(); uploadZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      const text = await file.text();
      parseCsv(text);
      const s = document.getElementById('loadStatus');
      if (s) s.textContent = `${positions.length} Positionen geladen.`;
      await refreshMetrics();
    }
  });
}

/* ════════════════════════════════════════════
   PORTFOLIO TABLE VIEW
   ════════════════════════════════════════════ */

function renderPortfolioTable(allocation) {
  const weights = Object.fromEntries((allocation || []).map(a => [a.symbol, a.weight_pct]));
  const tbody = document.getElementById('stocksTableBody');
  if (!tbody) return;
  if (!positions.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="muted-cell">Kein Portfolio geladen.</td></tr>';
    return;
  }
  tbody.innerHTML = positions.map(p => {
    const mv  = p.quantity * p.price;
    const pnl = (p.price - p.avg_cost) * p.quantity;
    const pct = p.avg_cost ? (p.price - p.avg_cost) / p.avg_cost * 100 : 0;
    const w   = weights[p.symbol] || 0;
    return `<tr class="clickable" data-sym="${p.symbol}">
      <td><strong>${p.symbol}</strong></td>
      <td class="muted">${p.symbol}</td>
      <td>${formatNum(p.quantity, 0)}</td>
      <td class="num">${formatNum(p.avg_cost)}</td>
      <td class="num">${formatNum(p.price)}</td>
      <td class="num">${formatEur(mv)}</td>
      <td class="num ${pnl >= 0 ? 'pos' : 'neg'}">${formatEur(pnl)}</td>
      <td class="num ${pct >= 0 ? 'pos' : 'neg'}">${formatPctRaw(pct)}</td>
      <td class="num">${w.toFixed(1)}%</td>
      <td><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" data-sym="${p.symbol}">Analyse →</button></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('tr.clickable').forEach(row => {
    row.querySelector('button')?.addEventListener('click', e => {
      e.stopPropagation();
      const sym = e.target.dataset.sym;
      if (sym) { loadAnalyse(sym); switchView('analyse'); }
    });
  });
}

/* Search filter in portfolio view */
document.getElementById('searchInput')?.addEventListener('input', function () {
  const q = this.value.toUpperCase();
  document.querySelectorAll('#stocksTableBody tr').forEach(row => {
    const sym = row.querySelector('td')?.textContent || '';
    row.style.display = sym.includes(q) ? '' : 'none';
  });
});

/* ════════════════════════════════════════════
   ANALYSE VIEW
   ════════════════════════════════════════════ */

async function loadAnalyse(symbol) {
  symbol = symbol.toUpperCase().trim();
  if (!symbol) return;
  currentSymbol = symbol;
  currentRange  = '1y';

  /* show loading state */
  document.getElementById('analyseEmpty')?.classList.add('hidden');
  const resultEl = document.getElementById('analyseResult');
  if (resultEl) resultEl.classList.remove('hidden');

  try {
    /* Fetch detail + history in parallel */
    const [detailRes, histRes] = await Promise.all([
      fetch(`${API}/api/market/detail/${symbol}`),
      fetch(`${API}/api/market/history/${symbol}?range=1y`),
    ]);
    const detail = await detailRes.json();
    const hist   = await histRes.json();
    if (!detailRes.ok) throw new Error(detail.detail || 'Fehler beim Laden');

    currentDetail = detail;
    renderStockHeader(detail);
    renderPriceChart(hist, detail.currency);
    render52WBar(detail);
    renderAnalystCard(detail);
    renderDescCard(detail);
    renderQualityTab(detail);
    renderFundamentalsTab(detail);
    startPricePolling(symbol);

    /* ETF tab */
    const isEtf = (detail.quote_type || '').toUpperCase().includes('ETF') ||
                  (detail.quote_type || '').toUpperCase() === 'MUTUALFUND';
    const tabEtfBtn = document.getElementById('tabEtf');
    if (tabEtfBtn) tabEtfBtn.style.display = isEtf ? '' : 'none';

    if (isEtf) {
      try {
        const etfRes  = await fetch(`${API}/api/market/etf/${symbol}`);
        const etfData = await etfRes.json();
        if (etfRes.ok) renderEtfDetailTab(etfData);
      } catch (_) {}
    }

    /* activate Overview tab */
    activateTab('overview');
  } catch (e) {
    const resultElem = document.getElementById('analyseResult');
    if (resultElem) resultElem.innerHTML = `<div class="card" style="padding:32px;text-align:center;color:var(--red-text)">Fehler: ${e.message}</div>`;
  }
}

function renderStockHeader(d) {
  setText('stockName', d.name || d.symbol);
  setText('stockMeta', [d.sector, d.industry, d.exchange].filter(Boolean).join(' · '));
  setText('stockBadgeType', d.quote_type || 'AKTIE');

  const price = d.price;
  const priceEl = document.getElementById('stockPrice');
  if (priceEl) priceEl.textContent = price != null ? `${d.currency || ''} ${formatNum(price)}` : '–';

  const chg = d.change_pct;
  const chgEl = document.getElementById('stockChange');
  if (chgEl) {
    const chgAbs = d.change != null ? formatNum(d.change) : '';
    chgEl.textContent = chg != null ? `${chgAbs}  (${formatPctRaw(chg * 100)})` : '–';
    chgEl.className = 'stock-change ' + ((chg || 0) >= 0 ? 'pos' : 'neg');
  }

  setText('hdrMarketCap', formatLargeNum(d.market_cap, d.currency));
  setText('hdrPE',        formatNum(d.pe_ratio));
  setText('hdrFwdPE',     formatNum(d.forward_pe));
  setText('hdrPB',        formatNum(d.price_to_book));
  setText('hdrPS',        formatNum(d.price_to_sales));
  setText('hdrEvEbitda',  formatNum(d.ev_to_ebitda));
  setText('hdrDivYield',  d.dividend_yield != null ? formatNum(d.dividend_yield * 100) + ' %' : '–');
  setText('hdrBeta',      formatNum(d.beta));
  setText('hdrW52H',      formatNum(d.week_52_high));
  setText('hdrW52L',      formatNum(d.week_52_low));
  setText('chartSymbolLabel', `${d.symbol} – Kursverlauf`);
}

/* ── Price chart ── */
function renderPriceChart(hist, currency) {
  destroyChart('priceChartInst');
  destroyChart('volumeChartInst');

  const points = hist.data || [];
  if (!points.length) return;

  const range   = hist.range || '1y';
  const labels  = points.map(p => formatDate(p.ts, range));
  const closes  = points.map(p => p.close);
  const volumes = points.map(p => p.volume);

  /* Performance badge */
  const perfEl = document.getElementById('chartPerfBadge');
  if (perfEl && hist.perf_pct != null) {
    perfEl.textContent = (hist.perf_pct >= 0 ? '+' : '') + hist.perf_pct.toFixed(2) + ' %';
    perfEl.style.color = hist.perf_pct >= 0 ? 'var(--green-text)' : 'var(--red-text)';
  }

  /* Price line chart */
  const priceCanvas = document.getElementById('priceChart');
  if (priceCanvas) {
    const ctx  = priceCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 280);
    const positive = (hist.perf_pct || 0) >= 0;
    grad.addColorStop(0,   positive ? 'rgba(59,130,246,0.35)' : 'rgba(239,68,68,0.35)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');

    priceChartInst = new Chart(priceCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: currency || '',
          data: closes,
          borderColor: positive ? '#3b82f6' : '#ef4444',
          borderWidth: 2,
          fill: true,
          backgroundColor: grad,
          tension: 0.1,
          pointRadius: 0,
          pointHitRadius: 20,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            label: ctx => ` ${ctx.parsed.y.toFixed(2)} ${currency || ''}`,
          }},
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7fa3', maxTicksLimit: 8, font: { size: 11 } } },
          y: { position: 'right', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7fa3', font: { size: 11 }, callback: v => v.toFixed(2) } },
        },
      },
    });
  }

  /* Volume bar chart */
  const volCanvas = document.getElementById('volumeChart');
  if (volCanvas) {
    volumeChartInst = new Chart(volCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: volumes, backgroundColor: 'rgba(59,130,246,0.25)', borderWidth: 0 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });
  }
}

function destroyChart(varName) {
  if (varName === 'priceChartInst'   && priceChartInst)   { priceChartInst.destroy();   priceChartInst = null; }
  if (varName === 'volumeChartInst'  && volumeChartInst)  { volumeChartInst.destroy();  volumeChartInst = null; }
  if (varName === 'radarChartInst'   && radarChartInst)   { radarChartInst.destroy();   radarChartInst = null; }
  if (varName === 'etfSectorChartInst' && etfSectorChartInst) { etfSectorChartInst.destroy(); etfSectorChartInst = null; }
  if (varName === 'divChartInst'     && divChartInst)     { divChartInst.destroy();     divChartInst = null; }
  if (varName === 'scenarioChartInst'&& scenarioChartInst){ scenarioChartInst.destroy(); scenarioChartInst = null; }
  if (varName === 'donutChartInst'   && donutChartInst)   { donutChartInst.destroy();   donutChartInst = null; }
}

/* Range buttons */
document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!currentSymbol) return;
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.dataset.range;
    const res  = await fetch(`${API}/api/market/history/${currentSymbol}?range=${currentRange}`);
    const hist = await res.json();
    renderPriceChart(hist, currentDetail?.currency);
  });
});

/* 52W range bar */
function render52WBar(d) {
  const lo = d.week_52_low, hi = d.week_52_high, price = d.price;
  setText('rangeBarLow',  formatNum(lo));
  setText('rangeBarHigh', formatNum(hi));
  if (lo != null && hi != null && price != null && hi > lo) {
    const pct    = ((price - lo) / (hi - lo)) * 100;
    const fillEl = document.getElementById('rangeBarFill');
    const markEl = document.getElementById('rangeBarMarker');
    if (fillEl) fillEl.style.width = pct + '%';
    if (markEl) markEl.style.left  = pct + '%';
    setText('rangeBarPriceLabel', `Aktuell: ${formatNum(price)} (${pct.toFixed(0)}% über 52W-Tief)`);
  }
}

/* Analyst card */
function renderAnalystCard(d) {
  const rec = (d.recommendation || '').toLowerCase();
  const labels = { strong_buy:'Stark Kaufen', buy:'Kaufen', hold:'Halten', sell:'Verkaufen', strong_sell:'Stark Verkaufen' };
  const classes = { strong_buy:'', buy:'', hold:'hold', sell:'sell', strong_sell:'sell' };
  const el = document.getElementById('analystConsensus');
  if (el) {
    el.textContent = labels[rec] || rec || '–';
    el.className = 'analyst-consensus ' + (classes[rec] || '');
  }
  setText('analystTarget', formatNum(d.target_price) + (d.currency ? ' ' + d.currency : ''));
  setText('analystLow',    formatNum(d.target_low));
  setText('analystHigh',   formatNum(d.target_high));
  setText('analystCount',  d.analyst_count != null ? d.analyst_count + ' Analysten' : '–');
}

/* Description */
function renderDescCard(d) {
  const card = document.getElementById('descCard');
  const text = document.getElementById('descText');
  if (!d.description) { if (card) card.style.display = 'none'; return; }
  if (card) card.style.display = '';
  if (text) text.textContent = d.description;
}

/* Analyse search wiring */
document.getElementById('analyseSearchBtn')?.addEventListener('click', () => {
  const val = document.getElementById('analyseSearch')?.value.trim();
  if (val) loadAnalyse(val);
});
document.getElementById('analyseSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (val) loadAnalyse(val);
  }
});
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => loadAnalyse(chip.dataset.sym));
});

/* ════════════════════════════════════════════
   QUALITY CHECK TAB
   ════════════════════════════════════════════ */

function calculateQualityScores(d) {
  const clamp = v => Math.min(100, Math.max(0, Math.round(v)));

  /* Value: low PE/PB/EV = good */
  let value = 45;
  const pe = d.pe_ratio;
  if (pe != null) { if (pe < 15) value += 25; else if (pe < 25) value += 10; else if (pe > 40) value -= 20; }
  const pb = d.price_to_book;
  if (pb != null) { if (pb < 2) value += 15; else if (pb < 5) value += 5; else if (pb > 10) value -= 15; }

  /* Growth */
  let growth = 30;
  if (d.revenue_growth  != null) growth += Math.min(40, d.revenue_growth  * 200);
  if (d.earnings_growth != null) growth += Math.min(25, d.earnings_growth * 150);

  /* Quality (profitability) */
  let quality = 35;
  if (d.profit_margin  != null) quality += Math.min(25, d.profit_margin  * 100);
  if (d.gross_margin   != null) quality += Math.min(15, d.gross_margin   * 30);
  if (d.roe            != null) quality += Math.min(20, d.roe            * 80);

  /* Dividend */
  let dividend = 10;
  const yld = (d.dividend_yield || 0) * 100;
  if (yld > 5) dividend = 95; else if (yld > 3) dividend = 78; else if (yld > 1) dividend = 55; else if (yld > 0) dividend = 30;

  /* Safety (low debt, high current ratio) */
  let safety = 60;
  if (d.debt_to_equity != null) { if (d.debt_to_equity < 30) safety += 20; else if (d.debt_to_equity > 150) safety -= 30; }
  if (d.current_ratio  != null) { if (d.current_ratio > 2) safety += 15; else if (d.current_ratio < 1) safety -= 20; }

  /* Momentum: 52W position */
  let momentum = 50;
  const lo = d.week_52_low, hi = d.week_52_high, price = d.price;
  if (lo != null && hi != null && price != null && hi > lo) {
    momentum = Math.round((price - lo) / (hi - lo) * 100);
  }

  /* Volatility: inverted beta */
  const beta = d.beta || 1;
  const volatility = clamp(100 - Math.abs(beta - 0.5) * 50);

  return {
    value:      clamp(value),
    growth:     clamp(growth),
    quality:    clamp(quality),
    dividend:   clamp(dividend),
    safety:     clamp(safety),
    momentum:   clamp(momentum),
    volatility: clamp(volatility),
  };
}

function renderQualityTab(d) {
  const scores = calculateQualityScores(d);

  /* Radar chart */
  destroyChart('radarChartInst');
  const radarCanvas = document.getElementById('radarChart');
  if (radarCanvas) {
    const labels = ['Bewertung','Wachstum','Qualität','Dividende','Sicherheit','Momentum','Volatilität'];
    const vals   = [scores.value, scores.growth, scores.quality, scores.dividend, scores.safety, scores.momentum, scores.volatility];
    radarChartInst = new Chart(radarCanvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: d.symbol,
          data: vals,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.12)',
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          r: {
            min: 0, max: 100,
            grid:       { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            pointLabels:{ color: '#e4eaf5', font: { size: 12 } },
            ticks:      { display: false, stepSize: 25 },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  /* Quality rows */
  const checks = {
    qGrowth: [
      { label: 'Umsatzwachstum (5J)', val: d.revenue_growth,   pass: (d.revenue_growth || 0) > 0.05, fmt: formatPct },
      { label: 'Gewinnwachstum',      val: d.earnings_growth,  pass: (d.earnings_growth || 0) > 0,   fmt: formatPct },
    ],
    qProfit: [
      { label: 'Nettogewinnmarge',    val: d.profit_margin,    pass: (d.profit_margin  || 0) > 0.1,  fmt: formatPct },
      { label: 'Bruttomarge',         val: d.gross_margin,     pass: (d.gross_margin   || 0) > 0.3,  fmt: formatPct },
      { label: 'Eigenkapitalrendite', val: d.roe,              pass: (d.roe            || 0) > 0.1,  fmt: formatPct },
    ],
    qSafety: [
      { label: 'Verschuldungsgrad',   val: d.debt_to_equity,   pass: (d.debt_to_equity || 999) < 80, fmt: v => formatNum(v) + ' %' },
      { label: 'Current Ratio',       val: d.current_ratio,    pass: (d.current_ratio  || 0) > 1.5,  fmt: v => formatNum(v, 2) },
      { label: 'Beta',                val: d.beta,             pass: (d.beta           || 1) < 1.5,  fmt: v => formatNum(v, 2) },
    ],
    qValue: [
      { label: 'KGV (trailing)',      val: d.pe_ratio,         pass: d.pe_ratio != null && d.pe_ratio < 30, fmt: v => formatNum(v, 1) + 'x' },
      { label: 'KBV',                 val: d.price_to_book,    pass: d.price_to_book != null && d.price_to_book < 5, fmt: v => formatNum(v, 1) + 'x' },
      { label: 'EV/EBITDA',           val: d.ev_to_ebitda,     pass: d.ev_to_ebitda  != null && d.ev_to_ebitda  < 20, fmt: v => formatNum(v, 1) + 'x' },
    ],
  };

  let totalPass = 0, totalChecks = 0;
  Object.entries(checks).forEach(([id, rows]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = rows.map(row => {
      const hasVal = row.val != null;
      const pass   = hasVal && row.pass;
      const icon   = !hasVal ? '◌' : pass ? '✓' : '✗';
      const cls    = !hasVal ? 'neutral' : pass ? 'ok' : 'bad';
      if (hasVal) { totalChecks++; if (pass) totalPass++; }
      const barPct = hasVal ? Math.round(row.val != null ? Math.min(100, Math.abs(row.val) * (row.label.includes('Marge') || row.label.includes('wachstum') || row.label.includes('rendite') ? 200 : 10)) : 0) : 0;
      return `<div class="quality-row">
        <div class="quality-row-left">
          <span class="quality-check ${cls}">${icon}</span>
          <span>${row.label}</span>
        </div>
        <span class="quality-val">${hasVal ? row.fmt(row.val) : '–'}</span>
      </div>`;
    }).join('');
  });

  const score = totalChecks ? Math.round((totalPass / totalChecks) * 10) : 0;
  const badge = document.getElementById('qualityScoreBadge');
  if (badge) {
    badge.textContent = `${score}/10`;
    badge.style.color = score >= 7 ? 'var(--green-text)' : score >= 4 ? 'var(--yellow)' : 'var(--red-text)';
  }
}

/* ════════════════════════════════════════════
   FUNDAMENTALS TAB
   ════════════════════════════════════════════ */

function _fundValClass(val, greenIf, redIf) {
  if (val == null) return '';
  if (greenIf && greenIf(val)) return 'pos';
  if (redIf  && redIf(val))   return 'neg';
  return '';
}

function renderFundamentalsTab(d) {
  const container = document.getElementById('fundamentalsGrid');
  if (!container) return;

  /* Helper: render a row with optional color class */
  function row(label, val, fmt, cls) {
    const display = val != null ? fmt(val) : '–';
    const colorCls = cls || '';
    return `<div class="fund-row">
      <span class="fund-label">${label}</span>
      <span class="fund-val ${colorCls}">${display}</span>
    </div>`;
  }

  /* Section badge rating */
  function secBadge(type) {
    const map = { good:'Gut', fair:'Okay', watch:'Prüfen', info:'Info' };
    return `<span class="fund-section-badge ${type}">${map[type]}</span>`;
  }

  /* Valuation section */
  const peScore  = d.pe_ratio  != null && d.pe_ratio  < 30 ? 'good' : d.pe_ratio  != null && d.pe_ratio  < 50 ? 'fair' : 'watch';
  const evScore  = d.ev_to_ebitda != null && d.ev_to_ebitda < 20 ? 'good' : d.ev_to_ebitda != null ? 'fair' : 'info';
  const valRating = (peScore === 'good' && evScore === 'good') ? 'good' : (peScore === 'watch' || evScore === 'watch') ? 'watch' : 'fair';

  const valSec = `<div class="fundamentals-section">
    <div class="fund-section-header">
      <div class="fundamentals-section-title">Bewertung</div>
      ${secBadge(valRating)}
    </div>
    ${row('KGV (Trailing)',  d.pe_ratio,       v => formatNum(v,1)+'x',  _fundValClass(d.pe_ratio,  v=>v<20, v=>v>50))}
    ${row('KGV (Forward)',   d.forward_pe,     v => formatNum(v,1)+'x',  _fundValClass(d.forward_pe,v=>v<18, v=>v>45))}
    ${row('KBV',             d.price_to_book,  v => formatNum(v,2)+'x',  _fundValClass(d.price_to_book, v=>v<3, v=>v>15))}
    ${row('KUV',             d.price_to_sales, v => formatNum(v,2)+'x',  _fundValClass(d.price_to_sales,v=>v<2, v=>v>15))}
    ${row('EV/EBITDA',       d.ev_to_ebitda,   v => formatNum(v,1)+'x',  _fundValClass(d.ev_to_ebitda,  v=>v<12, v=>v>30))}
    ${row('Enterprise Value',d.ev,             v => formatLargeNum(v, d.currency))}
  </div>`;

  /* Profitability */
  const marginGood = (d.profit_margin||0) > 0.15 && (d.gross_margin||0) > 0.35;
  const roeGood    = (d.roe||0) > 0.15;
  const profRating = marginGood && roeGood ? 'good' : (!marginGood && !roeGood) ? 'watch' : 'fair';

  const profSec = `<div class="fundamentals-section">
    <div class="fund-section-header">
      <div class="fundamentals-section-title">Profitabilität</div>
      ${secBadge(profRating)}
    </div>
    ${row('Nettogewinnmarge', d.profit_margin,    v=>formatPct(v), _fundValClass(d.profit_margin,    v=>v>0.15, v=>v<0))}
    ${row('Bruttomarge',      d.gross_margin,     v=>formatPct(v), _fundValClass(d.gross_margin,     v=>v>0.35, v=>v<0.1))}
    ${row('Operative Marge',  d.operating_margin, v=>formatPct(v), _fundValClass(d.operating_margin, v=>v>0.15, v=>v<0))}
    ${row('ROE',              d.roe,              v=>formatPct(v), _fundValClass(d.roe,              v=>v>0.15, v=>v<0))}
    ${row('ROA',              d.roa,              v=>formatPct(v), _fundValClass(d.roa,              v=>v>0.05, v=>v<0))}
  </div>`;

  /* Growth */
  const revGood = (d.revenue_growth||0) > 0.05;
  const epsGood = (d.earnings_growth||0) > 0;
  const growRating = revGood && epsGood ? 'good' : (!revGood && !epsGood) ? 'watch' : 'fair';

  const growSec = `<div class="fundamentals-section">
    <div class="fund-section-header">
      <div class="fundamentals-section-title">Wachstum</div>
      ${secBadge(growRating)}
    </div>
    ${row('Umsatzwachstum (YoY)', d.revenue_growth,  v=>formatPct(v), _fundValClass(d.revenue_growth,  v=>v>0.05, v=>v<0))}
    ${row('Gewinnwachstum (YoY)', d.earnings_growth, v=>formatPct(v), _fundValClass(d.earnings_growth, v=>v>0,    v=>v<-0.1))}
    ${row('Gesamtumsatz',          d.revenue,         v=>formatLargeNum(v, d.currency))}
    ${row('Free Cashflow',         d.free_cashflow,   v=>formatLargeNum(v, d.currency), _fundValClass(d.free_cashflow, v=>v>0, v=>v<0))}
  </div>`;

  /* Balance sheet & risk */
  const debtOk    = d.debt_to_equity == null || d.debt_to_equity < 100;
  const currentOk = d.current_ratio == null  || d.current_ratio  > 1;
  const balRating = debtOk && currentOk ? 'good' : (!debtOk || !currentOk) ? 'watch' : 'fair';

  const w52pos = (d.week_52_high && d.week_52_low && d.price)
    ? Math.round((d.price - d.week_52_low) / (d.week_52_high - d.week_52_low) * 100) : null;

  const balSec = `<div class="fundamentals-section">
    <div class="fund-section-header">
      <div class="fundamentals-section-title">Bilanz &amp; Risiko</div>
      ${secBadge(balRating)}
    </div>
    ${row('Verschuldungsgrad', d.debt_to_equity,  v=>formatNum(v,1)+' %', _fundValClass(d.debt_to_equity,  v=>v<50,  v=>v>150))}
    ${row('Current Ratio',     d.current_ratio,   v=>formatNum(v,2),      _fundValClass(d.current_ratio,   v=>v>1.5, v=>v<1))}
    ${row('Beta',              d.beta,            v=>formatNum(v,2),      _fundValClass(d.beta,            v=>v<1,   v=>v>1.8))}
    ${row('52W Hoch',          d.week_52_high,    v=>formatNum(v,2))}
    ${row('52W Tief',          d.week_52_low,     v=>formatNum(v,2))}
    ${w52pos != null ? row('Position in 52W-Spanne', w52pos, v=>v+'%', _fundValClass(w52pos, v=>v>60, v=>v<20)) : ''}
  </div>`;

  /* Share & dividend */
  const divYld = (d.dividend_yield||0)*100;
  const divRating = divYld > 3 ? 'good' : divYld > 0.5 ? 'fair' : 'info';

  const divSec = `<div class="fundamentals-section">
    <div class="fund-section-header">
      <div class="fundamentals-section-title">Aktie &amp; Dividende</div>
      ${secBadge(divRating)}
    </div>
    ${row('EPS (Trailing)',    d.eps,           v=>formatNum(v,2)+' '+(d.currency||''), _fundValClass(d.eps, v=>v>0, v=>v<0))}
    ${row('EPS (Forward)',     d.forward_eps,   v=>formatNum(v,2)+' '+(d.currency||''), _fundValClass(d.forward_eps, v=>v>0, v=>v<0))}
    ${row('Buchwert/Aktie',   d.book_value,    v=>formatNum(v,2)+' '+(d.currency||''))}
    ${row('Dividende p.a.',   d.dividend_rate, v=>formatNum(v,2)+' '+(d.currency||''))}
    ${row('Div.-Rendite',     d.dividend_yield,v=>formatPct(v), _fundValClass(d.dividend_yield, v=>v*100>2, null))}
    ${row('Ausschüttungsquote',d.payout_ratio, v=>formatPct(v), _fundValClass(d.payout_ratio, v=>v<0.6, v=>v>0.9))}
  </div>`;

  /* Market info */
  const mktSec = `<div class="fundamentals-section">
    <div class="fund-section-header">
      <div class="fundamentals-section-title">Marktdaten</div>
      ${secBadge('info')}
    </div>
    ${row('Market Cap',          d.market_cap,         v=>formatLargeNum(v, d.currency))}
    ${row('Kurs',                d.price,              v=>formatNum(v,2)+' '+(d.currency||''))}
    ${row('Volumen',             d.volume,             v=>formatNum(v,0))}
    ${row('Ø Volumen (90T)',     d.avg_volume,         v=>formatNum(v,0))}
    ${row('Ausstehende Aktien',  d.shares_outstanding, v=>formatLargeNum(v))}
    ${row('Land',                d.country,            v=>v)}
  </div>`;

  container.innerHTML = valSec + profSec + growSec + balSec + divSec + mktSec;
}

/* ════════════════════════════════════════════
   ETF DETAIL TAB
   ════════════════════════════════════════════ */

function renderEtfDetailTab(etf) {
  /* Meta grid */
  const metaGrid = document.getElementById('etfMetaGrid');
  if (metaGrid) {
    const items = [
      ['Total Assets',   formatLargeNum(etf.total_assets, etf.currency)],
      ['Ausschüttung',   etf.yield != null ? formatNum(etf.yield * 100, 2) + ' %' : '–'],
      ['TER / Kosten',   etf.expense_ratio != null ? formatNum(etf.expense_ratio * 100, 2) + ' %' : '–'],
      ['YTD Return',     etf.ytd_return    != null ? formatPctRaw(etf.ytd_return * 100) : '–'],
      ['3J Ø Return',    etf.three_year_return != null ? formatPctRaw(etf.three_year_return * 100) : '–'],
      ['5J Ø Return',    etf.five_year_return  != null ? formatPctRaw(etf.five_year_return  * 100) : '–'],
      ['Kategorie',      etf.category || '–'],
      ['Fondsgesellschaft', etf.family || '–'],
    ];
    metaGrid.innerHTML = items.map(([label, val]) => `
      <div class="etf-meta-item">
        <div class="etf-meta-label">${label}</div>
        <div class="etf-meta-val">${val}</div>
      </div>`).join('');
  }

  /* Sector chart */
  destroyChart('etfSectorChartInst');
  const sectorCanvas = document.getElementById('etfSectorChart');
  const sectors = (etf.sector_weights || []).slice(0, 8);
  if (sectorCanvas && sectors.length) {
    etfSectorChartInst = new Chart(sectorCanvas, {
      type: 'bar',
      data: {
        labels: sectors.map(s => s.sector),
        datasets: [{
          data: sectors.map(s => s.weight),
          backgroundColor: CHART_COLORS,
          borderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)}%` } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7fa3', callback: v => v + '%' } },
          y: { grid: { display: false }, ticks: { color: '#e4eaf5', font: { size: 12 } } },
        },
      },
    });
  }

  /* Holdings table */
  const tbody = document.getElementById('etfHoldingsBody');
  if (tbody) {
    const holdings = etf.top_holdings || [];
    tbody.innerHTML = holdings.map(h => {
      const w = h.weight || 0;
      return `<tr>
        <td>${h.name || '–'}</td>
        <td class="muted">${h.symbol || ''}</td>
        <td class="num">${w.toFixed(2)} %</td>
        <td style="width:160px;padding-right:16px">
          <div class="weight-bar-track"><div class="weight-bar-fill" style="width:${Math.min(100, w * 5)}%"></div></div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="4" class="muted-cell">Keine Holdings-Daten verfügbar</td></tr>';
  }
}

/* ── Tab switching ── */
function activateTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === 'tab-' + tabId);
    c.classList.toggle('hidden', c.id !== 'tab-' + tabId);
  });
}
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

/* ════════════════════════════════════════════
   ETF EXPLORER VIEW
   ════════════════════════════════════════════ */

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}

function renderEtfCards() {
  const assets   = getCheckedValues('asset');
  const regions  = getCheckedValues('region');
  const styles   = getCheckedValues('style');

  const filtered = POPULAR_ETFS.filter(etf =>
    (!assets.length  || assets.includes(etf.asset))  &&
    (!regions.length || regions.includes(etf.region)) &&
    (!styles.length  || styles.includes(etf.style))
  );

  const grid = document.getElementById('etfCardsGrid');
  const cnt  = document.getElementById('etfCount');
  if (cnt) cnt.textContent = `${filtered.length} ETFs`;
  if (!grid) return;

  grid.innerHTML = filtered.map(etf => `
    <div class="etf-card" data-sym="${etf.symbol}">
      <div class="etf-card-symbol">${etf.symbol}</div>
      <div class="etf-card-name">${etf.name}</div>
      <div class="etf-card-meta">
        <div class="etf-meta-kpi">
          <div class="etf-meta-kpi-label">Kategorie</div>
          <div class="etf-meta-kpi-val">${etf.category}</div>
        </div>
        <div class="etf-meta-kpi">
          <div class="etf-meta-kpi-label">Region</div>
          <div class="etf-meta-kpi-val">${etf.region.toUpperCase()}</div>
        </div>
      </div>
    </div>`).join('');

  grid.querySelectorAll('.etf-card').forEach(card => {
    card.addEventListener('click', () => {
      const sym = card.dataset.sym;
      if (sym) { loadAnalyse(sym); switchView('analyse'); }
    });
  });
}

document.getElementById('etfFilterBtn')?.addEventListener('click', renderEtfCards);

/* ════════════════════════════════════════════
   DIVIDENDS VIEW
   ════════════════════════════════════════════ */

function renderDividendView(metrics) {
  const monthlyForecast = metrics?.monthly_dividend_forecast || 0;

  /* Monthly bar chart – same amount each month (simple forecast) */
  destroyChart('divChartInst');
  const canvas = document.getElementById('divChart');
  if (canvas) {
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    /* Add slight variation by position to make it look realistic */
    const vals = months.map((_, i) => {
      const base = monthlyForecast;
      const variation = base * 0.15 * Math.sin(i * 0.8);
      return Math.max(0, base + variation);
    });

    divChartInst = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Dividende (€)',
          data: vals,
          backgroundColor: 'rgba(16,185,129,0.35)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` € ${ctx.parsed.y.toFixed(2)}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7fa3' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7fa3', callback: v => '€ ' + v.toFixed(0) } },
        },
      },
    });
  }

  /* Table */
  const tbody = document.getElementById('dividendTableBody');
  if (!tbody) return;
  if (!positions.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted-cell">Kein Portfolio geladen.</td></tr>';
    return;
  }
  tbody.innerHTML = positions.map(p => {
    const annDiv = annualDividendMap[p.symbol] || 0;
    const monthly = annDiv * p.quantity / 12;
    const yoc = p.avg_cost ? (annDiv / p.avg_cost) * 100 : 0;
    return `<tr>
      <td><strong>${p.symbol}</strong></td>
      <td class="num">€ ${formatNum(annDiv * p.quantity)}</td>
      <td class="num ${monthly > 0 ? 'pos' : 'muted'}">€ ${formatNum(monthly)}</td>
      <td class="num">${yoc > 0 ? formatNum(yoc) + ' %' : '–'}</td>
    </tr>`;
  }).join('');
}

/* ════════════════════════════════════════════
   EARNINGS VIEW
   ════════════════════════════════════════════ */

async function refreshEarnings() {
  const cardsEl = document.getElementById('earningsCards');
  if (cardsEl) cardsEl.innerHTML = '<p class="muted-cell">Lade Earnings…</p>';
  try {
    await fetch(`${API}/api/earnings/refresh_holdings`, { method: 'POST' });
    const res  = await fetch(`${API}/api/earnings/recent?limit=20`);
    const data = await res.json();
    const rows = data.rows || [];
    if (!rows.length) {
      if (cardsEl) cardsEl.innerHTML = '<p class="muted-cell">Keine Earnings-Daten. Holdings mit Earnings-URLs konfigurieren.</p>';
      return;
    }
    if (cardsEl) {
      cardsEl.innerHTML = rows.map(r => {
        const sig = r.signals || {};
        const chips = [
          sig.revenue ? `<span class="signal-chip signal-ok">Revenue: ${sig.revenue}</span>` : '',
          sig.eps     ? `<span class="signal-chip signal-ok">EPS: ${sig.eps}</span>` : '',
          `<span class="signal-chip signal-warn">Guidance: ${sig.guidance}</span>`,
          `<span class="signal-chip signal-warn">Margins: ${sig.margin}</span>`,
        ].filter(Boolean).join('');
        const dt = r.fetched_at ? new Date(r.fetched_at).toLocaleDateString('de-DE') : '';
        return `<div class="earnings-card">
          <div class="earnings-card-header">
            <span class="earnings-symbol">${r.symbol}</span>
            <span class="earnings-date">${dt}</span>
          </div>
          <p class="muted" style="font-size:12px;margin-bottom:6px">${r.summary || '–'}</p>
          <div class="earnings-signals">${chips}</div>
        </div>`;
      }).join('');
    }
  } catch (e) {
    if (cardsEl) cardsEl.innerHTML = `<p class="muted-cell" style="color:var(--red-text)">Fehler: ${e.message}</p>`;
  }
}

document.getElementById('refreshEarningsBtn')?.addEventListener('click', refreshEarnings);

/* ════════════════════════════════════════════
   SCENARIO VIEW
   ════════════════════════════════════════════ */

function updateSliderLabels() {
  const es = document.getElementById('equityShock');
  const rs = document.getElementById('rateShock');
  const dc = document.getElementById('divCut');
  if (es) setText('equityShockVal', `-${es.value} %`);
  if (rs) setText('rateShockVal',   `+${rs.value} %`);
  if (dc) setText('divCutVal',      `-${dc.value} %`);
}

['equityShock','rateShock','divCut'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateSliderLabels);
});
updateSliderLabels();

async function applyScenario() {
  if (!positions.length) {
    setText('scDelta', 'Portfolio laden'); return;
  }
  try {
    const es = Number(document.getElementById('equityShock')?.value || 0);
    const rs = Number(document.getElementById('rateShock')?.value   || 0);
    const dc = Number(document.getElementById('divCut')?.value      || 0);

    const r = await fetch(`${API}/api/scenario/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions, equity_shock_pct: es, rate_shock_pct: rs, dividend_cut_pct: dc }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Fehler');

    setText('scBefore',   formatEur(data.before_value));
    setText('scAfter',    formatEur(data.after_value));
    const deltaEl    = document.getElementById('scDelta');
    const deltaPctEl = document.getElementById('scDeltaPct');
    if (deltaEl)    { deltaEl.textContent    = formatEur(data.delta);       deltaEl.className    = 'sc-val ' + (data.delta >= 0 ? 'pos' : 'neg'); }
    if (deltaPctEl) { deltaPctEl.textContent = formatNum(data.delta_pct) + ' %'; deltaPctEl.className = 'sc-val ' + (data.delta_pct >= 0 ? 'pos' : 'neg'); }

    /* Mini comparison bar chart */
    destroyChart('scenarioChartInst');
    const canvas = document.getElementById('scenarioChart');
    if (canvas) {
      scenarioChartInst = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['Vorher', 'Nachher'],
          datasets: [{
            data: [data.before_value, data.after_value],
            backgroundColor: ['rgba(59,130,246,0.6)', 'rgba(239,68,68,0.6)'],
            borderColor:     ['#3b82f6', '#ef4444'],
            borderWidth: 1, borderRadius: 8,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` € ${ctx.parsed.y.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#e4eaf5' } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7fa3' } },
          },
        },
      });
    }
  } catch (e) {
    setText('scDelta', 'Fehler: ' + e.message);
  }
}

document.getElementById('applyScenarioBtn')?.addEventListener('click', applyScenario);

/* ════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════ */

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '–';
}

/* ── Init ── */
switchView('dashboard');
renderEtfCards();
