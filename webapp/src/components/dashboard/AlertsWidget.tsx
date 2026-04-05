import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
import type { AlertItem } from "@/lib/types";

interface AlertsWidgetProps {
  alerts: AlertItem[];
}

const SEVERITY_ICON = {
  CRITICAL: AlertCircle,
  WARNING: AlertTriangle,
  INFO: Info,
};

const SEVERITY_STYLE = {
  CRITICAL: "text-red-600 bg-red-50",
  WARNING: "text-amber-600 bg-amber-50",
  INFO: "text-blue-600 bg-blue-50",
};

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const unread = alerts.filter((a) => !a.isRead);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
          {unread.length > 0 && (
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
              {unread.length}
            </span>
          )}
        </div>
        <Link href="/dashboard/alerts" className="text-xs text-blue-600 hover:underline">
          All alerts
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="py-6 text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Info size={16} className="text-emerald-500" />
          </div>
          <p className="text-sm text-slate-500">All clear. No active alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 4).map((alert) => {
            const Icon = SEVERITY_ICON[alert.severity];
            const style = SEVERITY_STYLE[alert.severity];

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-lg",
                  alert.isRead ? "opacity-60" : "",
                  "bg-slate-50"
                )}
              >
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5", style)}>
                  <Icon size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 leading-tight">
                    {alert.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight line-clamp-2">
                    {alert.message}
                  </p>
                </div>
                <ChevronRight size={12} className="text-slate-400 shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
