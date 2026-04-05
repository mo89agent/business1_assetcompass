"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import type { AlertItem } from "@/lib/types";
import { markAlertRead, dismissAlert, markAllAlertsRead } from "@/app/actions/alerts";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  initialAlerts: AlertItem[];
  isDemo?: boolean;
}

const ICONS = { CRITICAL: AlertCircle, WARNING: AlertTriangle, INFO: Info };
const STYLES = {
  CRITICAL: "bg-red-50 border-red-200 text-red-700",
  WARNING: "bg-amber-50 border-amber-200 text-amber-700",
  INFO: "bg-blue-50 border-blue-200 text-blue-700",
};
const ICON_STYLES = { CRITICAL: "text-red-600", WARNING: "text-amber-600", INFO: "text-blue-600" };

type SeverityFilter = "ALL" | "CRITICAL" | "WARNING" | "INFO";

export function AlertsShell({ initialAlerts, isDemo }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [filter, setFilter] = useState<SeverityFilter>("ALL");
  const [markingAll, setMarkingAll] = useState(false);

  const visible = alerts.filter((a) => filter === "ALL" || a.severity === filter);
  const unread = alerts.filter((a) => !a.isRead).length;
  const critical = alerts.filter((a) => a.severity === "CRITICAL").length;

  const handleMarkRead = async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    await markAlertRead(id).catch(() => {});
  };

  const handleDismiss = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await dismissAlert(id).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    await markAllAlertsRead().catch(() => {});
    setMarkingAll(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Alerts & Hinweise</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isDemo ? (
              <span className="text-amber-600">Demo-Daten werden angezeigt</span>
            ) : (
              <>
                {unread > 0 ? (
                  <span>{unread} ungelesen · {critical} kritisch</span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Alle gelesen
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Severity filter */}
          <div className="flex gap-1">
            {(["ALL", "CRITICAL", "WARNING", "INFO"] as SeverityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  filter === f ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {f === "ALL" ? "Alle" : f === "CRITICAL" ? "Kritisch" : f === "WARNING" ? "Warnung" : "Info"}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition disabled:opacity-60"
            >
              Alle gelesen
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
          <p className="text-slate-500 text-sm">Keine Alerts in dieser Kategorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((alert) => {
            const Icon = ICONS[alert.severity] ?? Info;
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4 rounded-xl border transition-opacity",
                  STYLES[alert.severity],
                  alert.isRead && "opacity-55"
                )}
              >
                <Icon
                  size={18}
                  className={`shrink-0 mt-0.5 ${ICON_STYLES[alert.severity]}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <span className="text-xs opacity-70 shrink-0">{formatDate(alert.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 opacity-80 leading-relaxed">{alert.message}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="text-xs opacity-70 hover:opacity-100 underline whitespace-nowrap"
                    >
                      Gelesen
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="text-xs opacity-70 hover:opacity-100"
                    title="Verwerfen"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
        Alerts werden automatisch aus deinem Portfolio generiert (fehlende Einstandspreise, auslaufende Zinsbindungen, Konzentrationsrisiken) und aus der Datenbank geladen.
      </div>
    </div>
  );
}
