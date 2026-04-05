/**
 * Signal computation library for AssetCompass.
 *
 * All functions are pure — no I/O, no side effects.
 * Each signal references a peer-reviewed academic source.
 *
 * Signal strength scale: 0.0 = strong SELL · 0.5 = HOLD · 1.0 = strong BUY
 */

export type SignalDir = "BUY" | "HOLD" | "SELL";

export interface IndividualSignal {
  id: string;
  name: string;
  category: "technical" | "fundamental" | "sentiment";
  direction: SignalDir;
  /** 0 = strong sell, 0.5 = neutral, 1 = strong buy */
  strength: number;
  currentValue: string;
  description: string;
  interpretation: string;
  reference: string;
}

export interface SignalsResult {
  overall: SignalDir;
  /** 0–1 continuous score (>0.62 = BUY, <0.38 = SELL) */
  score: number;
  /** 0–1: fraction of signals pointing the same direction */
  confidence: number;
  bullCount: number;
  bearCount: number;
  neutralCount: number;
  signals: IndividualSignal[];
  computedAt: string;
}

// ──────────────────────────────────────────────────────────────────────
// Math helpers
// ──────────────────────────────────────────────────────────────────────

function sma(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    out.push(prices[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function stdDev(prices: number[]): number {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length;
  return Math.sqrt(variance);
}

function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

// ──────────────────────────────────────────────────────────────────────
// Exported indicator functions (also used by API route for partial reuse)
// ──────────────────────────────────────────────────────────────────────

/** Wilder RSI — returns 0–100 or null if not enough data. */
export function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const initGains = changes.slice(0, period).filter((c) => c > 0);
  const initLosses = changes.slice(0, period).filter((c) => c < 0);
  let avgGain = initGains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = Math.abs(initLosses.reduce((a, b) => a + b, 0)) / period;
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + Math.max(0, changes[i])) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -changes[i])) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

/** Standard MACD(12,26,9). Returns null if not enough data. */
export function computeMACD(closes: number[]): MACDResult | null {
  if (closes.length < 35) return null;
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const macdLine = e12.map((v, i) => v - e26[i]).slice(25);
  const signalLine = ema(macdLine, 9);
  const last = macdLine[macdLine.length - 1];
  const lastSig = signalLine[signalLine.length - 1];
  return { macd: last, signal: lastSig, histogram: last - lastSig };
}

export interface BollingerResult {
  pctB: number;
  upper: number;
  lower: number;
  middle: number;
}

/** Bollinger Bands(20, 2σ). Returns null if not enough data. */
export function computeBollinger(closes: number[], period = 20): BollingerResult | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const std = stdDev(slice);
  const upper = middle + 2 * std;
  const lower = middle - 2 * std;
  const current = closes[closes.length - 1];
  const pctB = upper === lower ? 0.5 : (current - lower) / (upper - lower);
  return { pctB, upper, lower, middle };
}

/**
 * Jegadeesh-Titman 12-1 month price momentum.
 * Skips the most recent month to avoid short-term reversal.
 * Returns decimal return (e.g. 0.12 = +12%) or null.
 */
export function computeMomentum(closes: number[]): number | null {
  if (closes.length < 252) return null;
  const p12 = closes[closes.length - 252]; // ~12 months ago
  const p1 = closes[closes.length - 21];   // ~1 month ago (skip last month)
  return p12 > 0 ? p1 / p12 - 1 : null;
}

// ──────────────────────────────────────────────────────────────────────
// Fundamental inputs
// ──────────────────────────────────────────────────────────────────────

export interface FundamentalInputs {
  pe?: number | null;
  forwardPe?: number | null;
  priceToBook?: number | null;
  debtToEquity?: number | null;
  returnOnEquity?: number | null;
  revenueGrowth?: number | null;
  earningsGrowth?: number | null;
  /** 1 = Strong Buy … 5 = Strong Sell (Yahoo Finance scale) */
  recommendationMean?: number | null;
  targetMeanPrice?: number | null;
  currentPrice?: number | null;
  dividendYield?: number | null;
  payoutRatio?: number | null;
  beta?: number | null;
}

// ──────────────────────────────────────────────────────────────────────
// Full signal computation
// ──────────────────────────────────────────────────────────────────────

export function computeAllSignals(
  closes: number[],
  fundamentals: FundamentalInputs,
): IndividualSignal[] {
  const signals: IndividualSignal[] = [];
  const current = closes[closes.length - 1] ?? 0;

  // ── 1. RSI (14) ─────────────────────────────────────────────────────
  const rsi = computeRSI(closes);
  if (rsi !== null) {
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (rsi < 30) {
      dir = "BUY";
      strength = clamp(0.5 + ((30 - rsi) / 30) * 0.5);
    } else if (rsi > 70) {
      dir = "SELL";
      strength = clamp(0.5 - ((rsi - 70) / 30) * 0.5);
    }
    signals.push({
      id: "rsi",
      name: "RSI (14 Tage)",
      category: "technical",
      direction: dir,
      strength,
      currentValue: rsi.toFixed(1),
      description:
        "Relative Strength Index — misst die Geschwindigkeit und Stärke von Preisbewegungen auf einer Skala von 0–100.",
      interpretation:
        rsi < 30
          ? `Überverkauft (${rsi.toFixed(1)}) — statistisch erhöhte Wahrscheinlichkeit einer Kurserholung`
          : rsi > 70
          ? `Überkauft (${rsi.toFixed(1)}) — mögliche Korrektur oder Konsolidierung`
          : `Neutral (${rsi.toFixed(1)}) — kein Extremzustand`,
      reference:
        "Wilder, J.W. (1978). New Concepts in Technical Trading Systems. Trend Research.",
    });
  }

  // ── 2. SMA 50/200 Golden / Death Cross ──────────────────────────────
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  if (sma50 !== null && sma200 !== null) {
    const ratio = sma50 / sma200;
    const isBull = ratio > 1;
    const dev = Math.abs(ratio - 1);
    const strength = clamp(isBull ? 0.5 + dev * 10 : 0.5 - dev * 10);
    signals.push({
      id: "sma-cross",
      name: "SMA 50/200 (Golden/Death Cross)",
      category: "technical",
      direction: isBull ? "BUY" : "SELL",
      strength,
      currentValue: `SMA50 ${isBull ? ">" : "<"} SMA200 (${((ratio - 1) * 100).toFixed(2)}%)`,
      description:
        "Golden Cross (SMA50 kreuzt SMA200 nach oben) gilt als starkes Kaufsignal für langfristige Trends; Death Cross als Verkaufssignal.",
      interpretation: isBull
        ? `Golden Cross aktiv — SMA50 liegt ${((ratio - 1) * 100).toFixed(1)}% über SMA200`
        : `Death Cross aktiv — SMA50 liegt ${((1 - ratio) * 100).toFixed(1)}% unter SMA200`,
      reference:
        "Brock, W., Lakonishok, J., LeBaron, B. (1992). Simple Technical Trading Rules. Journal of Finance, 47(5), 1731–1764.",
    });
  }

  // ── 3. MACD(12,26,9) ────────────────────────────────────────────────
  const macd = computeMACD(closes);
  if (macd !== null) {
    const isBull = macd.histogram > 0;
    const relStrength = macd.macd !== 0 ? clamp(Math.abs(macd.histogram / macd.macd) * 2) : 0;
    const strength = clamp(isBull ? 0.5 + relStrength * 0.4 : 0.5 - relStrength * 0.4);
    signals.push({
      id: "macd",
      name: "MACD (12, 26, 9)",
      category: "technical",
      direction: isBull ? "BUY" : "SELL",
      strength,
      currentValue: `Hist. ${macd.histogram >= 0 ? "+" : ""}${macd.histogram.toFixed(3)}`,
      description:
        "Moving Average Convergence Divergence — misst das Momentum durch die Differenz zweier exponentieller Gleitdurchschnitte.",
      interpretation: isBull
        ? `MACD (${macd.macd.toFixed(3)}) über Signallinie (${macd.signal.toFixed(3)}) — aufsteigendes Momentum`
        : `MACD (${macd.macd.toFixed(3)}) unter Signallinie (${macd.signal.toFixed(3)}) — abschwächendes Momentum`,
      reference:
        "Appel, G. (1979). The Moving Average Convergence-Divergence Method. Great Neck, NY: Signalert Corp.",
    });
  }

  // ── 4. Bollinger Bänder (20, 2σ) ────────────────────────────────────
  const bb = computeBollinger(closes);
  if (bb !== null) {
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (bb.pctB < 0.2) {
      dir = "BUY";
      strength = clamp(0.5 + ((0.2 - bb.pctB) / 0.2) * 0.45);
    } else if (bb.pctB > 0.8) {
      dir = "SELL";
      strength = clamp(0.5 - ((bb.pctB - 0.8) / 0.2) * 0.45);
    }
    signals.push({
      id: "bollinger",
      name: "Bollinger Bänder (20, 2σ)",
      category: "technical",
      direction: dir,
      strength,
      currentValue: `%B = ${(bb.pctB * 100).toFixed(0)}%`,
      description:
        "Bollinger Bänder definieren ein Kursband (±2 Standardabweichungen um SMA20) — ein %B nahe 0% gilt als überverkauft, nahe 100% als überkauft.",
      interpretation:
        bb.pctB < 0.2
          ? `Kurs nahe unterem Band (%B: ${(bb.pctB * 100).toFixed(0)}%) — Mean-Reversion-Potenzial nach oben`
          : bb.pctB > 0.8
          ? `Kurs nahe oberem Band (%B: ${(bb.pctB * 100).toFixed(0)}%) — mögliche Überdehnung`
          : `Kurs innerhalb normaler Bandbreite (%B: ${(bb.pctB * 100).toFixed(0)}%)`,
      reference:
        "Bollinger, J. (2001). Bollinger on Bollinger Bands. McGraw-Hill. / Lento, C. et al. (2007). The Profitability of Technical Trading Rules. Investment Management & Financial Innovation.",
    });
  }

  // ── 5. Preis-Momentum (12-1 Monat, Fama-French Faktor) ──────────────
  const mom = computeMomentum(closes);
  if (mom !== null) {
    const isBull = mom > 0;
    const strength = clamp(isBull ? 0.5 + Math.min(mom * 2, 0.5) : 0.5 - Math.min(Math.abs(mom) * 2, 0.5));
    signals.push({
      id: "momentum-12-1",
      name: "Preis-Momentum (12-1 Monate)",
      category: "technical",
      direction: isBull ? "BUY" : "SELL",
      strength,
      currentValue: `${isBull ? "+" : ""}${(mom * 100).toFixed(1)}%`,
      description:
        "Titel mit positiver 12-1M-Rendite erzielen statistisch signifikante Überrenditen im Folgemonat. Einer der robustesten Faktoren der empirischen Kapitalmarktforschung.",
      interpretation: isBull
        ? `Starkes Aufwärts-Momentum: +${(mom * 100).toFixed(1)}% in den letzten 12 Monaten (exkl. letzter Monat)`
        : `Negatives Momentum: ${(mom * 100).toFixed(1)}% — historisch erhöhte Underperformance-Wahrscheinlichkeit`,
      reference:
        "Jegadeesh, N., Titman, S. (1993). Returns to Buying Winners and Selling Losers. Journal of Finance, 48(1), 65–91.",
    });
  }

  // ── 6. 52-Wochen-Hochpunkt-Effekt ────────────────────────────────────
  if (closes.length >= 252) {
    const year = closes.slice(-252);
    const high52 = Math.max(...year);
    const low52 = Math.min(...year);
    const range = high52 - low52;
    const pos = range > 0 ? (current - low52) / range : 0.5;
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (pos >= 0.8) { dir = "BUY"; strength = clamp(0.55 + (pos - 0.8) / 0.2 * 0.30); }
    else if (pos <= 0.2) { dir = "SELL"; strength = clamp(0.45 - (0.2 - pos) / 0.2 * 0.30); }
    signals.push({
      id: "52w-proximity",
      name: "52-Wochen-Hochpunkt-Proximity",
      category: "technical",
      direction: dir,
      strength,
      currentValue: `${(pos * 100).toFixed(0)}% der Range`,
      description:
        "Kurse nahe dem 52-Wochen-Hoch zeigen aufgrund von Ankereffekten und Momentum-Dynamiken statistisch höhere Fortsetzungswahrscheinlichkeit.",
      interpretation:
        pos >= 0.8
          ? `Kurs im oberen Bereich der Range (${(pos * 100).toFixed(0)}%) — starkes relatives Momentum`
          : pos <= 0.2
          ? `Kurs nahe 52W-Tief (${(pos * 100).toFixed(0)}%) — erhöhte Underperformance-Tendenz`
          : `Kurs in mittlerer Position (${(pos * 100).toFixed(0)}% der Range)`,
      reference:
        "George, T.J., Hwang, C.-Y. (2004). The 52-Week High and Momentum Investing. Journal of Finance, 59(5), 2145–2176.",
    });
  }

  // ── 7. Analysten-Konsensempfehlung ───────────────────────────────────
  if (fundamentals.recommendationMean != null) {
    const m = fundamentals.recommendationMean;
    // Yahoo: 1=Strong Buy, 2=Buy, 3=Hold, 4=Sell, 5=Strong Sell
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (m <= 2.0) { dir = "BUY"; strength = clamp(0.5 + (2.5 - m) / 2.5 * 0.5); }
    else if (m >= 3.5) { dir = "SELL"; strength = clamp(0.5 - (m - 2.5) / 2.5 * 0.5); }
    const label =
      m <= 1.5 ? "Strong Buy" : m <= 2.5 ? "Buy" : m <= 3.5 ? "Hold" : m <= 4.5 ? "Sell" : "Strong Sell";
    signals.push({
      id: "analyst-consensus",
      name: "Analysten-Konsens",
      category: "sentiment",
      direction: dir,
      strength,
      currentValue: `${m.toFixed(2)} / 5.0 (${label})`,
      description:
        "Aggregierte Kauf-/Verkaufsempfehlungen von Sell-Side-Analysten. Trotz bekannter Optimismustendenz liefert der Konsens statistisch signifikante Informationen.",
      interpretation: `Durchschnittliche Empfehlung: ${label} (${m.toFixed(2)}/5.0)`,
      reference:
        "Barber, B., Lehavy, R., McNichols, M., Trueman, B. (2001). Can Investors Profit from the Prophets? Journal of Finance, 56(2), 531–563.",
    });
  }

  // ── 8. Analysten-Kursziel Upside ─────────────────────────────────────
  if (
    fundamentals.targetMeanPrice != null &&
    fundamentals.currentPrice != null &&
    fundamentals.currentPrice > 0
  ) {
    const upside = (fundamentals.targetMeanPrice - fundamentals.currentPrice) / fundamentals.currentPrice;
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (upside > 0.15) { dir = "BUY"; strength = clamp(0.5 + upside * 1.5); }
    else if (upside < -0.05) { dir = "SELL"; strength = clamp(0.5 + upside * 2); }
    signals.push({
      id: "price-target",
      name: "Konsensprice-Target",
      category: "sentiment",
      direction: dir,
      strength,
      currentValue: `${upside >= 0 ? "+" : ""}${(upside * 100).toFixed(1)}% Upside`,
      description:
        "Durchschnittliches Kursziel der Analysten im Vergleich zum aktuellen Marktpreis. >15% Upside = historisch erhöhte Outperformance-Wahrscheinlichkeit.",
      interpretation:
        upside > 0.15
          ? `+${(upside * 100).toFixed(1)}% Upside zum Konsens-Kursziel (${fundamentals.targetMeanPrice.toFixed(2)})`
          : upside < -0.05
          ? `${(upside * 100).toFixed(1)}% Downside — Titel könnte überbewertet sein`
          : `Geringes Upside/Downside (${(upside * 100).toFixed(1)}%) — Kurs nahe Konsensschätzung`,
      reference:
        "Brav, A., Lehavy, R. (2003). An Empirical Analysis of Analysts' Target Prices. Journal of Finance, 58(5), 1933–1967.",
    });
  }

  // ── 9. Forward vs. Trailing KGV (Gewinnwachstum) ─────────────────────
  if (
    fundamentals.pe != null && fundamentals.pe > 0 && fundamentals.pe < 500 &&
    fundamentals.forwardPe != null && fundamentals.forwardPe > 0 && fundamentals.forwardPe < 500
  ) {
    const improvement = (fundamentals.pe - fundamentals.forwardPe) / fundamentals.pe;
    const isBull = improvement > 0;
    const strength = clamp(0.5 + improvement * 2);
    signals.push({
      id: "pe-expansion",
      name: "Trailing vs. Forward KGV",
      category: "fundamental",
      direction: isBull ? "BUY" : "SELL",
      strength,
      currentValue: `${fundamentals.pe.toFixed(1)}x → ${fundamentals.forwardPe.toFixed(1)}x`,
      description:
        "Sinkendes Forward-KGV im Vergleich zum Trailing-KGV signalisiert erwartetes Gewinnwachstum und ist historisch mit Kursanstiegen korreliert.",
      interpretation: isBull
        ? `Gewinnwachstum erwartet — Forward-KGV ${(improvement * 100).toFixed(0)}% niedriger als Trailing`
        : `Sinkende Gewinnerwartungen — Forward-KGV ${(Math.abs(improvement) * 100).toFixed(0)}% höher als Trailing`,
      reference:
        "Fama, E.F., French, K.R. (1992). The Cross-Section of Expected Stock Returns. Journal of Finance, 47(2), 427–465.",
    });
  }

  // ── 10. Kurs-Buchwert-Verhältnis (Value-Faktor) ────────────────────────
  if (fundamentals.priceToBook != null && fundamentals.priceToBook > 0) {
    const pb = fundamentals.priceToBook;
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (pb < 1.5) { dir = "BUY"; strength = clamp(0.5 + (1.5 - pb) / 1.5 * 0.4); }
    else if (pb > 6) { dir = "SELL"; strength = clamp(0.5 - (pb - 6) / 12 * 0.3); }
    signals.push({
      id: "price-to-book",
      name: "Kurs-Buchwert-Verhältnis (KBV)",
      category: "fundamental",
      direction: dir,
      strength,
      currentValue: `${pb.toFixed(2)}x Buchwert`,
      description:
        "Value-Faktor: Günstig zum Buchwert bewertete Unternehmen (niedrige KBV) erzielen laut Fama-French langfristig Überrenditen gegenüber teuren Growth-Titeln.",
      interpretation:
        pb < 1.5
          ? `Potenzielle Unterbewertung (KBV: ${pb.toFixed(2)}x) — Value-Prämie möglich`
          : pb > 6
          ? `Hohe Bewertungsprämie (KBV: ${pb.toFixed(2)}x) — Growth-Erwartungen vollständig eingepreist`
          : `Moderate Bewertung (KBV: ${pb.toFixed(2)}x)`,
      reference:
        "Fama, E.F., French, K.R. (1993). Common Risk Factors in Returns on Stocks and Bonds. Journal of Financial Economics, 33(1), 3–56.",
    });
  }

  // ── 11. Gewinnwachstum YoY (Qualitätsfaktor) ──────────────────────────
  if (fundamentals.earningsGrowth != null) {
    const eg = fundamentals.earningsGrowth;
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (eg > 0.1) { dir = "BUY"; strength = clamp(0.5 + Math.min(eg, 0.5)); }
    else if (eg < -0.05) { dir = "SELL"; strength = clamp(0.5 + Math.max(eg, -0.5)); }
    signals.push({
      id: "earnings-growth",
      name: "Gewinnwachstum YoY",
      category: "fundamental",
      direction: dir,
      strength,
      currentValue: `${eg >= 0 ? "+" : ""}${(eg * 100).toFixed(1)}% YoY`,
      description:
        "Positives Gewinnwachstum ist der Profitabilitätsfaktor im Fama-French-5-Faktor-Modell (RMW). Unternehmen mit steigenden Gewinnen erzielen systematische Überrenditen.",
      interpretation:
        eg > 0.1
          ? `Starkes Gewinnwachstum (+${(eg * 100).toFixed(1)}% YoY) — Qualitätssignal`
          : eg > 0
          ? `Moderates Gewinnwachstum (+${(eg * 100).toFixed(1)}% YoY)`
          : `Schrumpfende Gewinne (${(eg * 100).toFixed(1)}% YoY) — erhöhtes Risiko`,
      reference:
        "Fama, E.F., French, K.R. (2015). A Five-Factor Asset Pricing Model. Journal of Financial Economics, 116(1), 1–22.",
    });
  }

  // ── 12. Eigenkapitalrendite ROE (Qualitätsfaktor) ─────────────────────
  if (fundamentals.returnOnEquity != null) {
    const roe = fundamentals.returnOnEquity;
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (roe > 0.15) { dir = "BUY"; strength = clamp(0.5 + Math.min((roe - 0.15) * 2, 0.4)); }
    else if (roe < 0) { dir = "SELL"; strength = clamp(0.5 + Math.max(roe * 2, -0.4)); }
    signals.push({
      id: "roe",
      name: "Return on Equity (ROE)",
      category: "fundamental",
      direction: dir,
      strength,
      currentValue: `${(roe * 100).toFixed(1)}%`,
      description:
        "Hohe ROE misst die Kapitaleffizienz — zentrales Maß für Unternehmensqualität im Quality-Investing nach Asness, Frazzini & Pedersen (2019).",
      interpretation:
        roe > 0.15
          ? `Hohe Kapitalrendite (${(roe * 100).toFixed(1)}%) — qualitätsorientiertes Kaufsignal`
          : roe < 0
          ? `Negative Eigenkapitalrendite (${(roe * 100).toFixed(1)}%) — strukturelle Schwäche`
          : `Moderate ROE (${(roe * 100).toFixed(1)}%)`,
      reference:
        "Asness, C., Frazzini, A., Pedersen, L.H. (2019). Quality Minus Junk. Review of Accounting Studies, 24, 34–112.",
    });
  }

  // ── 13. Dividendenrendite (Income-Signal) ─────────────────────────────
  if (fundamentals.dividendYield != null && fundamentals.dividendYield > 0) {
    const dy = fundamentals.dividendYield;
    const mktAvg = 0.018; // ~1.8% S&P 500 Durchschnitt (langfristiger Referenzwert)
    const payout = fundamentals.payoutRatio ?? 0.5;
    const sustainable = payout < 0.8;
    let dir: SignalDir = "HOLD";
    let strength = 0.5;
    if (dy > mktAvg * 1.5 && sustainable) {
      dir = "BUY";
      strength = clamp(0.5 + (dy - mktAvg) * 8);
    }
    signals.push({
      id: "dividend-yield",
      name: "Dividendenrendite",
      category: "fundamental",
      direction: dir,
      strength,
      currentValue: `${(dy * 100).toFixed(2)}% p.a.`,
      description:
        "Überdurchschnittliche, nachhaltige Dividendenrendite signalisiert Unterbewertung und ist mit zukünftigem Gewinnwachstum positiv korreliert.",
      interpretation:
        dy > mktAvg * 1.5 && sustainable
          ? `Überdurchschnittliche Rendite (${(dy * 100).toFixed(2)}% vs. ~1.8% Markt) mit nachhaltiger Ausschüttungsquote`
          : `Dividendenrendite: ${(dy * 100).toFixed(2)}% — nahe oder unter Marktdurchschnitt`,
      reference:
        "Arnott, R.D., Asness, C.S. (2003). Surprise! Higher Dividends = Higher Earnings Growth. Financial Analysts Journal, 59(1), 70–87.",
    });
  }

  return signals;
}

// ──────────────────────────────────────────────────────────────────────
// Aggregation
// ──────────────────────────────────────────────────────────────────────

/** Category weights for the composite score. */
const CATEGORY_WEIGHTS: Record<string, number> = {
  technical: 0.40,
  fundamental: 0.40,
  sentiment: 0.20,
};

export function aggregateSignals(
  signals: IndividualSignal[],
): Omit<SignalsResult, "signals" | "computedAt"> {
  if (signals.length === 0) {
    return { overall: "HOLD", score: 0.5, confidence: 0, bullCount: 0, bearCount: 0, neutralCount: 0 };
  }

  // Category-weighted average strength
  const catBuckets: Record<string, number[]> = { technical: [], fundamental: [], sentiment: [] };
  for (const s of signals) catBuckets[s.category].push(s.strength);

  let weightedScore = 0;
  let totalWeight = 0;
  for (const [cat, vals] of Object.entries(catBuckets)) {
    if (vals.length === 0) continue;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    weightedScore += avg * CATEGORY_WEIGHTS[cat];
    totalWeight += CATEGORY_WEIGHTS[cat];
  }
  const score = totalWeight > 0 ? clamp(weightedScore / totalWeight) : 0.5;

  const bullCount = signals.filter((s) => s.direction === "BUY").length;
  const bearCount = signals.filter((s) => s.direction === "SELL").length;
  const neutralCount = signals.filter((s) => s.direction === "HOLD").length;

  const majority = Math.max(bullCount, bearCount, neutralCount);
  const confidence = clamp(majority / signals.length);

  let overall: SignalDir = "HOLD";
  if (score >= 0.62) overall = "BUY";
  else if (score <= 0.38) overall = "SELL";

  return { overall, score, confidence, bullCount, bearCount, neutralCount };
}
