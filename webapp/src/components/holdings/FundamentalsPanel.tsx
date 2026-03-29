"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

interface Fundamentals {
  symbol: string;
  quoteType: string | null;
  shortName: string | null;
  exchange: string | null;
  currency: string | null;
  price: number | null;
  change: number | null;
  changePct: number | null;
  previousClose: number | null;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  eps: number | null;
  epsForward: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  exDividendDate: string | null;
  payoutRatio: number | null;
  week52High: number | null;
  week52Low: number | null;
  ma50: number | null;
  ma200: number | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  employees: number | null;
  description: string | null;
  website: string | null;
  // ETF
  expenseRatio: number | null;
  totalAssets: number | null;
  ytdReturn: number | null;
  beta3Year: number | null;
  categoryName: string | null;
  fundFamily: string | null;
  inceptionDate: string | null;
}

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
  if (v >= 1e6)  return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3)  return (v / 1e3).toFixed(0) + "K";
  return v.toLocaleString("de-DE");
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" | "amber" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn(
        "text-xs font-semibold",
        highlight === "green" ? "text-emerald-600" :
        highlight === "red"   ? "text-red-500" :
        highlight === "amber" ? "text-amber-600" :
        "text-slate-800"
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

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  const range = high - low;
  const pct = range > 0 ? Math.min(Math.max((current - low) / range, 0), 1) * 100 : 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{low.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="font-medium text-slate-600">{label}</span>
        <span>{high.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="relative h-1.5 bg-slate-100 rounded-full">
        <div
          className="absolute top-0 h-full bg-slate-300 rounded-full"
          style={{ left: 0, right: 0 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
    </div>
  );
}

interface Props {
  symbol: string;
  assetClass?: string;
}

export function FundamentalsPanel({ symbol, assetClass }: Props) {
  const [data, setData] = useState<Fundamentals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(false);
    fetch(`/api/yahoo/fundamentals?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(true); } else { setData(d as Fundamentals); }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center gap-2 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Fundamentaldaten werden geladen…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Keine Fundamentaldaten für {symbol} verfügbar.
      </div>
    );
  }

  const isEtf = assetClass === "ETF" || assetClass === "FUND" ||
    data.quoteType === "ETF" || data.quoteType === "MUTUALFUND";
  const isStock = !isEtf;
  const curr = data.currency ?? "USD";
  const isUp = (data.changePct ?? 0) >= 0;

  return (
    <div className="space-y-4">

      {/* Live price strip */}
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
            {data.previousClose != null && (
              <div><p className="text-[10px] text-slate-400 mb-0.5">Vortag</p><p className="font-medium text-slate-700">{fmt(data.previousClose, 2)}</p></div>
            )}
            {data.volume != null && (
              <div><p className="text-[10px] text-slate-400 mb-0.5">Volumen</p><p className="font-medium text-slate-700">{fmtVol(data.volume)}</p></div>
            )}
            {data.avgVolume != null && (
              <div><p className="text-[10px] text-slate-400 mb-0.5">Ø Volumen</p><p className="font-medium text-slate-700">{fmtVol(data.avgVolume)}</p></div>
            )}
            {data.exchange && (
              <div><p className="text-[10px] text-slate-400 mb-0.5">Börse</p><p className="font-medium text-slate-700">{data.exchange}</p></div>
            )}
          </div>
          <p className="text-[10px] text-slate-300 ml-auto">Quelle: Yahoo Finance · Echtzeit</p>
        </div>
      )}

      {/* 52w range */}
      {data.week52Low != null && data.week52High != null && data.price != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">52-Wochen-Range</h3>
          <RangeBar low={data.week52Low} high={data.week52High} current={data.price} label={`Aktuell ${data.price.toFixed(2)}`} />
          <div className="grid grid-cols-3 gap-3 pt-1">
            {data.ma50 != null && (
              <div className="text-center">
                <p className="text-[10px] text-slate-400">MA 50</p>
                <p className={cn("text-xs font-semibold", data.price >= data.ma50 ? "text-emerald-600" : "text-red-500")}>
                  {fmt(data.ma50, 2)}
                </p>
              </div>
            )}
            {data.ma200 != null && (
              <div className="text-center">
                <p className="text-[10px] text-slate-400">MA 200</p>
                <p className={cn("text-xs font-semibold", data.price >= data.ma200 ? "text-emerald-600" : "text-red-500")}>
                  {fmt(data.ma200, 2)}
                </p>
              </div>
            )}
            {data.beta != null && (
              <div className="text-center">
                <p className="text-[10px] text-slate-400">Beta</p>
                <p className={cn("text-xs font-semibold",
                  data.beta > 1.3 ? "text-red-500" : data.beta < 0.8 ? "text-emerald-600" : "text-slate-700"
                )}>{fmt(data.beta, 2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ETF info */}
      {isEtf && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Fondsdaten">
            <Row label="Gesamtkostenquote (TER)" value={data.expenseRatio != null ? fmt(data.expenseRatio * 100, 2, "%") : "—"} highlight={data.expenseRatio != null && data.expenseRatio > 0.005 ? "amber" : "green"} />
            <Row label="Fondsvolumen (AUM)" value={fmtLarge(data.totalAssets, curr)} />
            <Row label="Kategorie" value={data.categoryName ?? "—"} />
            <Row label="Fondsstruktur" value={data.fundFamily ?? "—"} />
            <Row label="Auflegungsdatum" value={data.inceptionDate ? new Date(data.inceptionDate).toLocaleDateString("de-DE") : "—"} />
            <Row label="YTD Return" value={data.ytdReturn != null ? fmt(data.ytdReturn * 100, 2, "%") : "—"} highlight={data.ytdReturn != null ? (data.ytdReturn >= 0 ? "green" : "red") : undefined} />
            {data.beta3Year != null && <Row label="Beta (3 Jahre)" value={fmt(data.beta3Year, 2)} />}
          </Section>
          <Section title="Marktdaten">
            <Row label="Kurs" value={data.price != null ? `${fmt(data.price, 2)} ${curr}` : "—"} />
            <Row label="52w Hoch" value={data.week52High != null ? `${fmt(data.week52High, 2)} ${curr}` : "—"} />
            <Row label="52w Tief" value={data.week52Low != null ? `${fmt(data.week52Low, 2)} ${curr}` : "—"} />
            <Row label="Volumen (heute)" value={fmtVol(data.volume)} />
            <Row label="Ø Volumen (10T)" value={fmtVol(data.avgVolume)} />
            {data.dividendYield != null && <Row label="Ausschüttungsrendite" value={fmt(data.dividendYield * 100, 2, "%")} />}
          </Section>
        </div>
      )}

      {/* Stock: Valuation */}
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
            {data.employees != null && (
              <Row label="Mitarbeiter" value={data.employees.toLocaleString("de-DE")} />
            )}
          </Section>
        </div>
      )}

      {/* Stock: Dividende */}
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

      {/* Company description */}
      {isStock && data.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Unternehmensbeschreibung</h3>
          <p className={cn("text-xs text-slate-500 leading-relaxed", !expanded && "line-clamp-4")}>
            {data.description}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
            >
              <ExternalLink size={11} />
              {data.website}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
