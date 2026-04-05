"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, ComposedChart, Line,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Fundamentals {
  symbol: string; quoteType: string | null; shortName: string | null;
  exchange: string | null; currency: string | null;
  price: number | null; change: number | null; changePct: number | null;
  previousClose: number | null; volume: number | null; avgVolume: number | null;
  marketCap: number | null; trailingPE: number | null; forwardPE: number | null;
  priceToBook: number | null; priceToSales: number | null;
  eps: number | null; epsForward: number | null;
  beta: number | null; sharesOutstanding: number | null;
  dividendYield: number | null; dividendRate: number | null;
  exDividendDate: string | null; payoutRatio: number | null;
  week52High: number | null; week52Low: number | null;
  ma50: number | null; ma200: number | null;
  sector: string | null; industry: string | null; country: string | null;
  employees: number | null; description: string | null; website: string | null;
  // Financial health
  totalDebt: number | null; totalCash: number | null;
  debtToEquity: number | null; currentRatio: number | null;
  returnOnEquity: number | null; returnOnAssets: number | null;
  revenueGrowth: number | null; earningsGrowth: number | null;
  grossMargins: number | null; operatingMargins: number | null;
  profitMargins: number | null;
  freeCashflow: number | null; operatingCashflow: number | null;
  // Analyst
  targetHighPrice: number | null; targetLowPrice: number | null;
  targetMeanPrice: number | null; targetMedianPrice: number | null;
  numberOfAnalysts: number | null; recommendationKey: string | null;
  analystRecs: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  // Income history
  annualIncome: Array<{ year: string; revenue: number; netIncome: number }>;
  quarterlyIncome: Array<{ quarter: string; revenue: number; netIncome: number }>;
  // ETF
  expenseRatio: number | null; totalAssets: number | null; ytdReturn: number | null;
  beta3Year: number | null; categoryName: string | null; fundFamily: string | null;
  inceptionDate: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number | null, digits = 2, suffix = "") {
  if (v == null) return "—";
  return v.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + suffix;
}
function fmtLarge(v: number | null, currency = "USD") {
  if (v == null) return "—";
  if (v >= 1e12) return (v / 1e12).toFixed(2) + " Bio. " + currency;
  if (v >= 1e9)  return (v / 1e9).toFixed(2)  + " Mrd. " + currency;
  if (v >= 1e6)  return (v / 1e6).toFixed(2)  + " Mio. " + currency;
  return v.toLocaleString("de-DE") + " " + currency;
}
function fmtVol(v: number | null) {
  if (v == null) return "—";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
  return v.toLocaleString("de-DE");
}
function recLabel(key: string | null) {
  if (!key) return { label: "—", color: "text-slate-500", bg: "bg-slate-100" };
  const m: Record<string, { label: string; color: string; bg: string }> = {
    strongBuy:  { label: "Strong Buy",  color: "text-emerald-700", bg: "bg-emerald-100" },
    buy:        { label: "Buy",         color: "text-emerald-600", bg: "bg-emerald-50"  },
    hold:       { label: "Hold",        color: "text-amber-600",   bg: "bg-amber-50"    },
    sell:       { label: "Sell",        color: "text-red-500",     bg: "bg-red-50"      },
    strongSell: { label: "Strong Sell", color: "text-red-700",     bg: "bg-red-100"     },
  };
  return m[key] ?? { label: key, color: "text-slate-700", bg: "bg-slate-100" };
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" | "amber" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn("text-xs font-semibold",
        highlight === "green" ? "text-emerald-600" :
        highlight === "red"   ? "text-red-500" :
        highlight === "amber" ? "text-amber-600" : "text-slate-800"
      )}>{value}</span>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}
function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const range = high - low;
  const pct = range > 0 ? Math.min(Math.max((current - low) / range, 0), 1) * 100 : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="font-medium text-slate-600">Aktuell {current.toFixed(2)}</span>
        <span>{high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="relative h-1.5 bg-slate-100 rounded-full">
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"
          style={{ left: `calc(${pct}% - 6px)` }} />
      </div>
    </div>
  );
}

// ── Analyst Gauge ─────────────────────────────────────────────────────────────
function AnalystGauge({ recs }: { recs: NonNullable<Fundamentals["analystRecs"]> }) {
  const total = recs.strongBuy + recs.buy + recs.hold + recs.sell + recs.strongSell;
  if (total === 0) return null;

  const bars = [
    { label: "Strong Sell", count: recs.strongSell, color: "#ef4444" },
    { label: "Sell",        count: recs.sell,       color: "#f97316" },
    { label: "Hold",        count: recs.hold,       color: "#6b7280" },
    { label: "Buy",         count: recs.buy,        color: "#22c55e" },
    { label: "Strong Buy",  count: recs.strongBuy,  color: "#16a34a" },
  ];

  return (
    <div className="mt-3">
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={bars} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, Math.max(...bars.map(b => b.count)) + 1]} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
            formatter={(v) => [v, "Analysten"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {bars.map((b, i) => <Cell key={i} fill={b.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Revenue / Earnings Chart ──────────────────────────────────────────────────
function IncomeChart({ annual, quarterly }: { annual: Fundamentals["annualIncome"]; quarterly: Fundamentals["quarterlyIncome"] }) {
  const [mode, setMode] = useState<"annual" | "quarterly">("annual");
  const data = mode === "annual"
    ? annual.map((r) => ({ label: r.year, revenue: r.revenue, netIncome: r.netIncome }))
    : quarterly.map((r) => ({ label: r.quarter.slice(2), revenue: r.revenue, netIncome: r.netIncome }));

  if (data.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        {(["annual", "quarterly"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition",
              mode === m ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}>
            {m === "annual" ? "Jährlich" : "Quartal"}
          </button>
        ))}
        <div className="flex items-center gap-3 ml-auto text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm inline-block" /> Umsatz</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm inline-block" /> Gewinn</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45}
            tickFormatter={(v) => fmtLarge(v, "")} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
            formatter={(v, name) => [fmtLarge(Number(v)), name === "revenue" ? "Umsatz" : "Nettogewinn"]}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="netIncome" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Price Target Chart ────────────────────────────────────────────────────────
function PriceTargetChart({
  currentPrice, low, mean, high, currency,
}: { currentPrice: number; low: number; mean: number; high: number; currency: string }) {
  const upside = currentPrice > 0 ? ((mean - currentPrice) / currentPrice) * 100 : 0;
  const data = [
    { label: "Aktuell", value: currentPrice, fill: "#94a3b8" },
    { label: "Low",     value: low,          fill: "#ef4444" },
    { label: "Median",  value: mean,         fill: "#3b82f6" },
    { label: "Hoch",    value: high,         fill: "#10b981" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{mean.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</p>
          <p className={cn("text-sm font-medium", upside >= 0 ? "text-emerald-600" : "text-red-500")}>
            {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% Upside · Analysten-Kursziel
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[Math.min(currentPrice, low) * 0.9, high * 1.05]} hide />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={42} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
            formatter={(v) => [`${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`, "Kursziel"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[{ label: "Tief", v: low, color: "text-red-500" }, { label: "Mittel", v: mean, color: "text-blue-600" }, { label: "Hoch", v: high, color: "text-emerald-600" }].map(({ label, v, color }) => (
          <div key={label} className="bg-slate-50 rounded-lg py-2">
            <p className="text-[10px] text-slate-400">{label}</p>
            <p className={cn("text-xs font-bold", color)}>{v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface Props { symbol: string; assetClass?: string; }

export function FundamentalsPanel({ symbol, assetClass }: Props) {
  const [data, setData] = useState<Fundamentals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true); setError(false);
    fetch(`/api/yahoo/fundamentals?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(true); else setData(d as Fundamentals); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [symbol]);

  if (loading) return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center gap-2 text-slate-400">
      <Loader2 size={16} className="animate-spin" />
      <span className="text-sm">Fundamentaldaten werden geladen…</span>
    </div>
  );
  if (error || !data) return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
      Keine Fundamentaldaten für {symbol} verfügbar.
    </div>
  );

  const isEtf = assetClass === "ETF" || assetClass === "FUND" ||
    data.quoteType === "ETF" || data.quoteType === "MUTUALFUND";
  const isStock = !isEtf;
  const curr = data.currency ?? "USD";
  const isUp = (data.changePct ?? 0) >= 0;
  const rec = recLabel(data.recommendationKey as string | null);
  const hasAnalystData = data.targetMeanPrice != null && data.price != null;
  const hasIncomeData = (data.annualIncome?.length ?? 0) > 0;
  const hasFinHealth = data.debtToEquity != null || data.currentRatio != null || data.returnOnEquity != null;

  return (
    <div className="space-y-4">

      {/* ── Live price strip ─────────────────────────────────── */}
      {data.price != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm text-slate-400 ml-1.5">{curr}</span>
            </p>
            <p className={cn("text-sm font-medium flex items-center gap-1 mt-0.5", isUp ? "text-emerald-600" : "text-red-500")}>
              {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {isUp ? "+" : ""}{fmt(data.change, 2)} ({isUp ? "+" : ""}{fmt(data.changePct, 2)}%) heute
            </p>
          </div>
          <div className="flex gap-6 text-sm flex-wrap">
            {data.previousClose != null && <div><p className="text-[10px] text-slate-400 mb-0.5">Vortag</p><p className="font-medium text-slate-700">{fmt(data.previousClose, 2)}</p></div>}
            {data.volume != null && <div><p className="text-[10px] text-slate-400 mb-0.5">Volumen</p><p className="font-medium text-slate-700">{fmtVol(data.volume)}</p></div>}
            {data.exchange && <div><p className="text-[10px] text-slate-400 mb-0.5">Börse</p><p className="font-medium text-slate-700">{data.exchange}</p></div>}
            {isStock && data.trailingPE != null && <div><p className="text-[10px] text-slate-400 mb-0.5">KGV</p><p className="font-medium text-slate-700">{fmt(data.trailingPE, 1)}x</p></div>}
            {isStock && data.marketCap != null && <div><p className="text-[10px] text-slate-400 mb-0.5">Marktk.</p><p className="font-medium text-slate-700">{fmtLarge(data.marketCap, curr)}</p></div>}
          </div>
          {data.recommendationKey && (
            <div className="ml-auto shrink-0">
              <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full", rec.bg, rec.color)}>
                Analyst: {rec.label}
              </span>
            </div>
          )}
          <p className="text-[10px] text-slate-300 basis-full">Quelle: Yahoo Finance · Echtzeit</p>
        </div>
      )}

      {/* ── 52-week range ────────────────────────────────────── */}
      {data.week52Low != null && data.week52High != null && data.price != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">52-Wochen-Range</h3>
          <RangeBar low={data.week52Low} high={data.week52High} current={data.price} />
          <div className="grid grid-cols-3 gap-3 pt-1">
            {data.ma50 != null && <div className="text-center"><p className="text-[10px] text-slate-400">MA 50</p><p className={cn("text-xs font-semibold", data.price >= data.ma50 ? "text-emerald-600" : "text-red-500")}>{fmt(data.ma50, 2)}</p></div>}
            {data.ma200 != null && <div className="text-center"><p className="text-[10px] text-slate-400">MA 200</p><p className={cn("text-xs font-semibold", data.price >= data.ma200 ? "text-emerald-600" : "text-red-500")}>{fmt(data.ma200, 2)}</p></div>}
            {data.beta != null && <div className="text-center"><p className="text-[10px] text-slate-400">Beta</p><p className={cn("text-xs font-semibold", data.beta > 1.3 ? "text-red-500" : data.beta < 0.8 ? "text-emerald-600" : "text-slate-700")}>{fmt(data.beta, 2)}</p></div>}
          </div>
        </div>
      )}

      {/* ── Analyst consensus + price target ────────────────── */}
      {isStock && (hasAnalystData || data.analystRecs) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.analystRecs && (
            <Section title={`Analysten-Konsensus${data.numberOfAnalysts ? ` (${data.numberOfAnalysts})` : ""}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={cn("text-sm font-bold px-3 py-1 rounded-full", rec.bg, rec.color)}>{rec.label}</span>
              </div>
              <AnalystGauge recs={data.analystRecs} />
            </Section>
          )}
          {hasAnalystData && (
            <Section title="Kursziel (12 Monate)">
              <PriceTargetChart
                currentPrice={data.price!}
                low={data.targetLowPrice ?? data.price!}
                mean={data.targetMeanPrice!}
                high={data.targetHighPrice ?? data.targetMeanPrice!}
                currency={curr}
              />
            </Section>
          )}
        </div>
      )}

      {/* ── Revenue & Earnings ───────────────────────────────── */}
      {isStock && hasIncomeData && (
        <Section title="Umsatz & Gewinn">
          <IncomeChart annual={data.annualIncome} quarterly={data.quarterlyIncome} />
        </Section>
      )}

      {/* ── ETF info ─────────────────────────────────────────── */}
      {isEtf && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Fondsdaten">
            <Row label="Gesamtkostenquote (TER)" value={data.expenseRatio != null ? fmt(data.expenseRatio * 100, 2, "%") : "—"} highlight={data.expenseRatio != null && data.expenseRatio > 0.005 ? "amber" : "green"} />
            <Row label="Fondsvolumen (AUM)" value={fmtLarge(data.totalAssets, curr)} />
            <Row label="Kategorie" value={data.categoryName ?? "—"} />
            <Row label="Fondsstruktur" value={data.fundFamily ?? "—"} />
            <Row label="Auflegungsdatum" value={data.inceptionDate ? new Date(data.inceptionDate).toLocaleDateString("de-DE") : "—"} />
            <Row label="YTD Return" value={data.ytdReturn != null ? fmt(data.ytdReturn * 100, 2, "%") : "—"} highlight={data.ytdReturn != null ? (data.ytdReturn >= 0 ? "green" : "red") : undefined} />
          </Section>
          <Section title="Marktdaten">
            <Row label="Kurs" value={data.price != null ? `${fmt(data.price, 2)} ${curr}` : "—"} />
            <Row label="52w Hoch" value={data.week52High != null ? `${fmt(data.week52High, 2)} ${curr}` : "—"} />
            <Row label="52w Tief" value={data.week52Low != null ? `${fmt(data.week52Low, 2)} ${curr}` : "—"} />
            <Row label="Volumen (heute)" value={fmtVol(data.volume)} />
            {data.dividendYield != null && <Row label="Ausschüttungsrendite" value={fmt(data.dividendYield * 100, 2, "%")} />}
          </Section>
        </div>
      )}

      {/* ── Stock: Valuation + Market ────────────────────────── */}
      {isStock && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Bewertung">
            <Row label="KGV (trailing 12M)" value={fmt(data.trailingPE, 1, "x")} highlight={data.trailingPE != null ? (data.trailingPE > 30 ? "red" : data.trailingPE < 15 ? "green" : undefined) : undefined} />
            <Row label="KGV (forward)" value={fmt(data.forwardPE, 1, "x")} />
            <Row label="Kurs-Buch-Verhältnis" value={fmt(data.priceToBook, 2, "x")} />
            <Row label="Kurs-Umsatz-Verhältnis" value={fmt(data.priceToSales, 2, "x")} />
            <Row label="EPS (TTM)" value={data.eps != null ? `${fmt(data.eps, 2)} ${curr}` : "—"} />
            <Row label="EPS (forward)" value={data.epsForward != null ? `${fmt(data.epsForward, 2)} ${curr}` : "—"} />
          </Section>
          <Section title="Marktdaten">
            <Row label="Marktkapitalisierung" value={fmtLarge(data.marketCap, curr)} />
            <Row label="Ausstehende Aktien" value={fmtLarge(data.sharesOutstanding, "")} />
            <Row label="Beta" value={fmt(data.beta, 2)} highlight={data.beta != null ? (data.beta > 1.3 ? "amber" : undefined) : undefined} />
            <Row label="Sektor" value={data.sector ?? "—"} />
            <Row label="Branche" value={data.industry ?? "—"} />
            <Row label="Land" value={data.country ?? "—"} />
            {data.employees != null && <Row label="Mitarbeiter" value={data.employees.toLocaleString("de-DE")} />}
          </Section>
        </div>
      )}

      {/* ── Financial Health ─────────────────────────────────── */}
      {isStock && hasFinHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Bilanz & Verschuldung">
            <Row label="Gesamtverschuldung" value={fmtLarge(data.totalDebt, curr)} />
            <Row label="Liquidität (Cash)" value={fmtLarge(data.totalCash, curr)} />
            <Row label="Debt/Equity" value={data.debtToEquity != null ? fmt(data.debtToEquity / 100, 2, "x") : "—"} highlight={data.debtToEquity != null ? (data.debtToEquity > 200 ? "red" : data.debtToEquity < 50 ? "green" : "amber") : undefined} />
            <Row label="Current Ratio" value={fmt(data.currentRatio, 2, "x")} highlight={data.currentRatio != null ? (data.currentRatio >= 1.5 ? "green" : data.currentRatio < 1 ? "red" : "amber") : undefined} />
            <Row label="Free Cashflow" value={fmtLarge(data.freeCashflow, curr)} />
            <Row label="Operativer CF" value={fmtLarge(data.operatingCashflow, curr)} />
          </Section>
          <Section title="Rentabilität">
            <Row label="Eigenkapitalrendite (ROE)" value={data.returnOnEquity != null ? fmt(data.returnOnEquity * 100, 1, "%") : "—"} highlight={data.returnOnEquity != null ? (data.returnOnEquity > 0.15 ? "green" : data.returnOnEquity < 0 ? "red" : undefined) : undefined} />
            <Row label="Gesamtkapitalrendite (ROA)" value={data.returnOnAssets != null ? fmt(data.returnOnAssets * 100, 1, "%") : "—"} highlight={data.returnOnAssets != null ? (data.returnOnAssets > 0.05 ? "green" : data.returnOnAssets < 0 ? "red" : undefined) : undefined} />
            <Row label="Bruttomargin" value={data.grossMargins != null ? fmt(data.grossMargins * 100, 1, "%") : "—"} />
            <Row label="Operativmargin" value={data.operatingMargins != null ? fmt(data.operatingMargins * 100, 1, "%") : "—"} highlight={data.operatingMargins != null ? (data.operatingMargins > 0.15 ? "green" : data.operatingMargins < 0 ? "red" : undefined) : undefined} />
            <Row label="Nettomargin" value={data.profitMargins != null ? fmt(data.profitMargins * 100, 1, "%") : "—"} />
            <Row label="Umsatzwachstum (YoY)" value={data.revenueGrowth != null ? fmt(data.revenueGrowth * 100, 1, "%") : "—"} highlight={data.revenueGrowth != null ? (data.revenueGrowth > 0 ? "green" : "red") : undefined} />
          </Section>
        </div>
      )}

      {/* ── Dividend ─────────────────────────────────────────── */}
      {isStock && (data.dividendYield != null || data.dividendRate != null) && (
        <Section title="Dividende">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Dividendenrendite", value: data.dividendYield != null ? fmt(data.dividendYield * 100, 2, "%") : "—" },
              { label: "Dividende/Aktie", value: data.dividendRate != null ? `${fmt(data.dividendRate, 2)} ${curr}` : "—" },
              { label: "Ausschüttungsquote", value: data.payoutRatio != null ? fmt(data.payoutRatio * 100, 1, "%") : "—" },
              { label: "Ex-Dividende", value: data.exDividendDate ? new Date(data.exDividendDate).toLocaleDateString("de-DE") : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Company description ───────────────────────────────── */}
      {isStock && data.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Unternehmensbeschreibung</h3>
          <p className={cn("text-xs text-slate-500 leading-relaxed", !expanded && "line-clamp-4")}>
            {data.description}
          </p>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mt-2">
            {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
          {data.website && (
            <a href={data.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
              <ExternalLink size={11} />{data.website}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
