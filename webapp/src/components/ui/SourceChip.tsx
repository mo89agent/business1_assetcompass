"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { FileText, PenLine, Zap, HelpCircle, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceRef, SourceType } from "@/lib/types";

// ─── Visual config per source type ───────────────────────────

const SOURCE_CONFIG: Record<
  SourceType,
  { icon: React.ElementType; label: string; className: string }
> = {
  manual: {
    icon: PenLine,
    label: "Manuell",
    className: "bg-slate-100 text-slate-600",
  },
  import: {
    icon: FileText,
    label: "Import",
    className: "bg-blue-50 text-blue-600",
  },
  yahoo: {
    icon: Zap,
    label: "Yahoo Finance",
    className: "bg-violet-50 text-violet-600",
  },
  ecb: {
    icon: Landmark,
    label: "EZB",
    className: "bg-emerald-50 text-emerald-600",
  },
  estimated: {
    icon: HelpCircle,
    label: "Geschätzt",
    className: "bg-amber-50 text-amber-600",
  },
};

// ─── Tooltip content ──────────────────────────────────────────

function ProvenanceTooltipContent({ source }: { source: SourceRef }) {
  return (
    <div className="max-w-[220px] space-y-1">
      <p className="text-xs font-semibold text-slate-100">{source.label}</p>
      {source.importFile && (
        <p className="text-[11px] text-slate-400">
          Datei: {source.importFile}
          {source.importRow != null ? ` · Zeile ${source.importRow}` : ""}
        </p>
      )}
      {source.fetchedAt && (
        <p className="text-[11px] text-slate-400">
          Abgerufen:{" "}
          {new Date(source.fetchedAt).toLocaleString("de-DE", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      )}
      {source.effectiveAt && (
        <p className="text-[11px] text-slate-400">
          Gültig ab:{" "}
          {new Date(source.effectiveAt).toLocaleDateString("de-DE")}
        </p>
      )}
      {source.type === "estimated" && (
        <p className="text-[11px] text-amber-400">
          Aus anderen Werten berechnet. Nicht verifiziert.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

interface SourceChipProps {
  source: SourceRef;
  /** compact: icon-only chip (for table cells). default: icon + label */
  compact?: boolean;
  className?: string;
}

export function SourceChip({ source, compact = false, className }: SourceChipProps) {
  const config = SOURCE_CONFIG[source.type];
  const Icon = config.icon;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium cursor-default select-none",
              config.className,
              className
            )}
          >
            <Icon size={10} className="shrink-0" />
            {!compact && <span>{config.label}</span>}
          </span>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="start"
            sideOffset={4}
            className="z-50 rounded-lg bg-slate-900 px-3 py-2 shadow-lg"
          >
            <ProvenanceTooltipContent source={source} />
            <Tooltip.Arrow className="fill-slate-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
