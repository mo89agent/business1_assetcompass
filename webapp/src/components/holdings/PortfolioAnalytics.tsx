"use client";

import type { PortfolioBreakdown, WeightedLabel } from "@/lib/types";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  breakdown: PortfolioBreakdown;
}

// Color palettes
const COUNTRY_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316", "#84cc16",
  "#ec4899", "#14b8a6",
];

const SECTOR_COLORS: Record<string, string> = {
  "Technologie":       "#3b82f6",
  "Finanzen":          "#10b981",
  "Gesundheit":        "#f59e0b",
  "Zyklischer Konsum": "#8b5cf6",
  "Industrie":         "#64748b",
  "Kommunikation":     "#06b6d4",
  "Basiskonsumgüter":  "#84cc16",
  "Energie":           "#f97316",
  "Materialien":       "#a78bfa",
  "Immobilien":        "#f43f5e",
  "Versorger":         "#14b8a6",
};

const STYLE_COLORS: Record<string, string> = {
  Growth:   "#3b82f6",
  Blend:    "#8b5cf6",
  Value:    "#10b981",
  Dividend: "#f59e0b",
};

const CAP_COLORS: Record<string, string> = {
  "Large Cap": "#1e3a8a",
  "Mid Cap":   "#3b82f6",
  "Small Cap": "#93c5fd",
};

function fmt(pct: number) {
  return pct >= 1 ? pct.toFixed(1) + "%" : "<1%";
}

function HorizontalBar({ items, colorMap, colorList }: {
  items: WeightedLabel[];
  colorMap?: Record<string, string>;
  colorList?: string[];
}) {
  const top = items.slice(0, 10);
  const maxPct = Math.max(...top.map((i) => i.pct), 1);

  return (
    <div className="space-y-2">
      {top.map((item, idx) => {
        const color = colorMap?.[item.label] ?? colorList?.[idx] ?? "#94a3b8";
        return (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-[9.5rem] text-xs text-slate-600 truncate shrink-0 text-right">
              {item.label}
            </div>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(item.pct / maxPct) * 100}%`,
                  backgroundColor: color,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div className="w-10 text-xs text-slate-500 tabular-nums text-right">
              {fmt(item.pct)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StackedBar({ items, colorMap }: { items: WeightedLabel[]; colorMap: Record<string, string> }) {
  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-6 w-full flex rounded-lg overflow-hidden gap-px">
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              width: `${item.pct}%`,
              backgroundColor: colorMap[item.label] ?? "#94a3b8",
              minWidth: item.pct > 2 ? undefined : "0px",
            }}
            title={`${item.label}: ${fmt(item.pct)}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: colorMap[item.label] ?? "#94a3b8" }}
            />
            <span className="text-xs text-slate-600">
              {item.label}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {fmt(item.pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {note && (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info size={10} />
            {note}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function PortfolioAnalytics({ breakdown }: Props) {
  const { countries, sectors, marketCap, style, equitySlicePct } = breakdown;

  return (
    <div className="space-y-4">
      {/* Coverage note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          Die folgenden Auswertungen beziehen sich auf{" "}
          <strong>{equitySlicePct.toFixed(0)}%</strong> des Portfolios (Aktien & ETFs).
          Krypto, Cash und Edelmetalle sind ausgeschlossen.
        </span>
      </div>

      {/* Style + Market Cap row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Marktkapitalisierung" note="Aktien & ETFs">
          <StackedBar items={marketCap} colorMap={CAP_COLORS} />
        </Card>
        <Card title="Anlagestil" note="Aktien & ETFs">
          <StackedBar items={style} colorMap={STYLE_COLORS} />
        </Card>
      </div>

      {/* Country chart */}
      <Card title="Länderallokation" note="Aktien & ETFs, nach Marktwert gewichtet">
        <HorizontalBar items={countries} colorList={COUNTRY_COLORS} />
        {countries.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Keine Daten</p>
        )}
      </Card>

      {/* Sector chart */}
      <Card title="Sektorallokation" note="Aktien & ETFs, nach Marktwert gewichtet">
        <HorizontalBar items={sectors} colorMap={SECTOR_COLORS} />
        {sectors.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Keine Daten</p>
        )}
      </Card>
    </div>
  );
}
