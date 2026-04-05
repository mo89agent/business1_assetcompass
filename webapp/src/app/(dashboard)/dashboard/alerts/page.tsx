import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAlerts } from "@/app/actions/alerts";
import { AlertsShell } from "@/components/alerts/AlertsShell";
import type { AlertItem } from "@/lib/types";

export const metadata = { title: "Alerts" };

const DEMO_ALERTS: AlertItem[] = [
  { id: "1", type: "MISSING_COST_BASIS", severity: "WARNING", title: "Fehlende Einstandspreise", message: "3 Positionen haben keinen Einstandspreis. Dies beeinträchtigt die Gewinn/Verlust-Berechnung und steuerliche Auswertung.", createdAt: "2026-03-22", isRead: false },
  { id: "2", type: "EXPIRING_FIXED_RATE", severity: "CRITICAL", title: "Zinsbindung endet in 47 Tagen", message: "Hypothek auf Berliner Str. 12 (€198.000 Restschuld) hat Zinsbindungsende am 01.05.2026. Refinanzierung oder Anschlussfinanzierung planen.", createdAt: "2026-03-20", isRead: false },
  { id: "3", type: "CONCENTRATION_RISK", severity: "INFO", title: "Sektorkonzentration: Technologie", message: "Der Technologiesektor macht 36,2% Ihres Aktienportfolios aus. Prüfen Sie, ob dies Ihrer Zielallokation entspricht.", createdAt: "2026-03-18", isRead: true },
  { id: "4", type: "TAX_READINESS_GAP", severity: "INFO", title: "Freistellungsauftrag nicht hinterlegt", message: "Kein Freistellungsauftrag hinterlegt. In Einstellungen → Steuerpolitik ergänzen für genaue Steuervorschau.", createdAt: "2026-03-10", isRead: true },
];

export default async function AlertsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let alerts: AlertItem[];
  let isDemo = false;
  try {
    alerts = await getAlerts();
    if (alerts.length === 0) {
      alerts = DEMO_ALERTS;
      isDemo = true;
    }
  } catch {
    alerts = DEMO_ALERTS;
    isDemo = true;
  }

  return <AlertsShell initialAlerts={alerts} isDemo={isDemo} />;
}
