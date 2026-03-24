import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Alerts" };

const DEMO_ALERTS = [
  { id: "1", type: "MISSING_COST_BASIS", severity: "WARNING", title: "Missing cost basis", message: "3 positions are missing acquisition cost data. This affects unrealized gain calculations and tax reporting.", createdAt: "2026-03-22", isRead: false, isDismissed: false },
  { id: "2", type: "EXPIRING_FIXED_RATE", severity: "CRITICAL", title: "Fixed rate expiring in 47 days", message: "Mortgage on Berliner Str. 12 (€198,000 remaining) has a fixed rate expiry on 2026-05-01. Plan for refinancing or rate reset.", createdAt: "2026-03-20", isRead: false, isDismissed: false },
  { id: "3", type: "CONCENTRATION_RISK", severity: "INFO", title: "Sector concentration: Technology", message: "Technology sector represents 36.2% of your equity portfolio. Consider if this aligns with your target allocation.", createdAt: "2026-03-18", isRead: true, isDismissed: false },
  { id: "4", type: "BROKEN_IMPORT", severity: "WARNING", title: "Import partially failed", message: "2 rows from flatex_feb_2026.csv could not be parsed. Review in the import history.", createdAt: "2026-03-15", isRead: false, isDismissed: false },
  { id: "5", type: "TAX_READINESS_GAP", severity: "INFO", title: "Freistellungsauftrag not tracked", message: "No Freistellungsauftrag limit has been set. Add it in Settings → Tax Policy to get accurate tax estimates.", createdAt: "2026-03-10", isRead: true, isDismissed: false },
];

const ICONS = { CRITICAL: AlertCircle, WARNING: AlertTriangle, INFO: Info };
const STYLES = {
  CRITICAL: "bg-red-50 border-red-200 text-red-700",
  WARNING: "bg-amber-50 border-amber-200 text-amber-700",
  INFO: "bg-blue-50 border-blue-200 text-blue-700",
};
const ICON_STYLES = { CRITICAL: "text-red-600", WARNING: "text-amber-600", INFO: "text-blue-600" };

export default async function AlertsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const unread = DEMO_ALERTS.filter((a) => !a.isRead);
  const critical = DEMO_ALERTS.filter((a) => a.severity === "CRITICAL");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unread.length} unread · {critical.length} critical
          </p>
        </div>
        <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition">
          Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {DEMO_ALERTS.map((alert) => {
          const Icon = ICONS[alert.severity as keyof typeof ICONS] ?? Info;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-4 px-5 py-4 rounded-xl border ${STYLES[alert.severity as keyof typeof STYLES]} ${alert.isRead ? "opacity-60" : ""}`}
            >
              <Icon size={18} className={`shrink-0 mt-0.5 ${ICON_STYLES[alert.severity as keyof typeof ICON_STYLES]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <span className="text-xs opacity-70 shrink-0">{formatDate(alert.createdAt)}</span>
                </div>
                <p className="text-sm mt-1 opacity-80">{alert.message}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!alert.isRead && (
                  <button className="text-xs opacity-70 hover:opacity-100 underline">Mark read</button>
                )}
                <button className="text-xs opacity-70 hover:opacity-100 underline">Dismiss</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
