"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Globe, ExternalLink } from "lucide-react";
import { AssetPriceChart } from "@/components/holdings/AssetPriceChart";

interface CryptoStats {
  price: number | null;
  change: number | null;
  changePct: number | null;
  marketCap: number | null;
  volume: number | null;
  avgVolume: number | null;
  week52High: number | null;
  week52Low: number | null;
  ma50: number | null;
  ma200: number | null;
  currency: string | null;
  shortName: string | null;
  description: string | null;
  website: string | null;
  previousClose: number | null;
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtBig(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1000)  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)     return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
}

interface Props {
  symbol: string;         // e.g. "BTC-USD"
  name: string;
  ticker: string | null;  // e.g. "BTC"
  currency?: string;
  avgCostBasis?: number;
}

export function CryptoDataPanel({ symbol, name, ticker, currency = "USD", avgCostBasis = 0 }: Props) {
  const [data, setData] = useState<CryptoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    fetch(`/api/yahoo/fundamentals?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => r.json())
      .then((d) => {
        setData({
          price:         d.price         ?? null,
          change:        d.change        ?? null,
          changePct:     d.changePct     ?? null,
          marketCap:     d.marketCap     ?? null,
          volume:        d.volume        ?? null,
          avgVolume:     d.avgVolume     ?? null,
          week52High:    d.week52High    ?? null,
          week52Low:     d.week52Low     ?? null,
          ma50:          d.ma50          ?? null,
          ma200:         d.ma200         ?? null,
          currency:      d.currency      ?? currency,
          shortName:     d.shortName     ?? name,
          description:   d.description   ?? null,
          website:       d.website       ?? null,
          previousClose: d.previousClose ?? null,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [symbol, name, currency]);

  const isUp = (data?.changePct ?? 0) >= 0;
  const cur = data?.currency ?? "USD";

  // 52-week range position
  const rangePos = data?.week52High && data?.week52Low
    ? ((data.price ?? 0) - data.week52Low) / (data.week52High - data.week52Low) * 100
    : null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg" />)}
        </div>
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Price card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">{data?.shortName ?? name} · {symbol}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {fmtPrice(data?.price)} <span className="text-sm font-normal text-slate-400">{cur}</span>
              </span>
              {data?.changePct != null && (
                <span className={`flex items-center gap-0.5 text-sm font-semibold px-2 py-0.5 rounded-lg ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {data.changePct >= 0 ? "+" : ""}{data.changePct.toFixed(2)}%
                </span>
              )}
            </div>
            {data?.change != null && (
              <p className={`text-sm mt-0.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                {data.change >= 0 ? "+" : ""}{fmtPrice(data.change)} heute
              </p>
            )}
          </div>
          {data?.website && (
            <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition">
              <Globe size={12} />
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* ── Marktdaten Grid (Coinbase-style) ───────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Marktdaten</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          {[
            { label: "Marktkapitalisierung",    value: fmtBig(data?.marketCap) },
            { label: "24h-Volumen",             value: fmtBig(data?.volume) },
            { label: "Ø Volumen (30T)",         value: fmtBig(data?.avgVolume) },
            { label: "Vortagesschluss",         value: data?.previousClose ? `${fmtPrice(data.previousClose)} ${cur}` : "—" },
            { label: "SMA 50",                  value: data?.ma50 ? `${fmtPrice(data.ma50)} ${cur}` : "—" },
            { label: "SMA 200",                 value: data?.ma200 ? `${fmtPrice(data.ma200)} ${cur}` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="border-b border-slate-50 pb-3 last:border-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* 52-week range slider */}
        {data?.week52Low != null && data?.week52High != null && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span>52W Tief: {fmtPrice(data.week52Low)}</span>
              <span className="font-medium text-slate-600">
                {rangePos != null ? `${rangePos.toFixed(0)}% der Range` : ""}
              </span>
              <span>52W Hoch: {fmtPrice(data.week52High)}</span>
            </div>
            <div className="relative h-2 bg-slate-100 rounded-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500"
                style={{ width: `${rangePos ?? 50}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow"
                style={{ left: `${rangePos ?? 50}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Kursverlauf ────────────────────────────────────────── */}
      <AssetPriceChart
        ticker={symbol}
        assetClass="CRYPTO"
        currency={cur}
        avgCostBasis={avgCostBasis}
        name={name}
      />

      {/* ── Technische Lage ────────────────────────────────────── */}
      {data?.ma50 != null && data?.ma200 != null && data?.price != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Technische Lage</h3>
          <div className="space-y-2.5">
            {[
              {
                label: "Kurs vs. SMA 50",
                pct: ((data.price - data.ma50) / data.ma50) * 100,
                note: data.price > data.ma50 ? "Kurs über SMA50 — kurzfristiger Aufwärtstrend" : "Kurs unter SMA50 — kurzfristiger Abwärtsdruck",
              },
              {
                label: "Kurs vs. SMA 200",
                pct: ((data.price - data.ma200) / data.ma200) * 100,
                note: data.price > data.ma200 ? "Kurs über SMA200 — langfristiger Bullenmarkt" : "Kurs unter SMA200 — langfristiger Bärenmarkt",
              },
            ].map(({ label, pct, note }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{note}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-300 mt-3">
            Technische Analyse · Kein Anlagehinweis
          </p>
        </div>
      )}

      {/* ── Über diese Währung ─────────────────────────────────── */}
      {data?.description && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Über {data.shortName ?? name}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-6">
            {data.description}
          </p>
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:underline"
            >
              <Globe size={11} />
              {data.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-300 text-center">
        Quelle: Yahoo Finance · Echtzeitkurse können leicht verzögert sein · Keine Anlageberatung
      </p>
    </div>
  );
}
