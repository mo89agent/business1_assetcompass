"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { AlertItem } from "@/lib/types";

// ── Load + auto-generate alerts ───────────────────────────────────────────────

export async function getAlerts(): Promise<AlertItem[]> {
  const session = await getSession();
  if (!session) return [];

  // 1. Load persisted alerts from DB
  const dbAlerts = await db.alert.findMany({
    where: { workspaceId: session.workspaceId, isDismissed: false },
    orderBy: { createdAt: "desc" },
  });

  const alerts: AlertItem[] = dbAlerts.map((a) => ({
    id: a.id,
    type: a.type as AlertItem["type"],
    severity: a.severity as AlertItem["severity"],
    title: a.title,
    message: a.message,
    createdAt: a.createdAt.toISOString().split("T")[0],
    isRead: a.isRead,
  }));

  // 2. Auto-generate smart alerts
  const smart = await generateSmartAlerts(session.workspaceId);
  for (const s of smart) {
    // Only add if no similar DB alert already exists
    if (!alerts.find((a) => a.type === s.type)) {
      alerts.unshift(s);
    }
  }

  return alerts;
}

async function generateSmartAlerts(workspaceId: string): Promise<AlertItem[]> {
  const generated: AlertItem[] = [];

  try {
    // A) Missing cost basis
    const zeroCostPositions = await db.position.count({
      where: { workspaceId, avgCostBasis: { equals: 0 } },
    });
    if (zeroCostPositions > 0) {
      generated.push({
        id: `smart-missing-cost-${workspaceId}`,
        type: "MISSING_COST_BASIS",
        severity: "WARNING",
        title: "Fehlende Einstandspreise",
        message: `${zeroCostPositions} Position(en) haben keinen Einstandspreis. Bitte ergänzen für korrekte Gewinn/Verlust-Rechnung.`,
        createdAt: new Date().toISOString().split("T")[0],
        isRead: false,
      });
    }
  } catch {}

  try {
    // B) Expiring fixed rates (within 90 days)
    const cutoff = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const expiringLoans = await db.loanDetails.findMany({
      where: {
        account: { workspaceId },
        fixedRateUntil: { lte: cutoff, gte: new Date() },
      },
      include: { account: true },
    });
    for (const loan of expiringLoans) {
      const daysLeft = Math.ceil(
        ((loan.fixedRateUntil?.getTime() ?? 0) - Date.now()) / 86_400_000
      );
      generated.push({
        id: `smart-loan-expiry-${loan.id}`,
        type: "EXPIRING_FIXED_RATE",
        severity: "CRITICAL",
        title: `Zinsbindung läuft in ${daysLeft} Tagen ab`,
        message: `Kredit "${loan.account?.name ?? loan.lenderName}" (${loan.currency} ${Number(loan.principalRemaining).toLocaleString("de-DE")}) — Zinsbindung endet am ${loan.fixedRateUntil?.toLocaleDateString("de-DE")}. Refinanzierung planen.`,
        createdAt: new Date().toISOString().split("T")[0],
        isRead: false,
      });
    }
  } catch {}

  try {
    // C) No tax policy
    const taxPolicyCount = await db.taxPolicy.count({ where: { workspaceId } });
    if (taxPolicyCount === 0) {
      generated.push({
        id: `smart-no-tax-policy-${workspaceId}`,
        type: "TAX_READINESS_GAP",
        severity: "INFO",
        title: "Steuerkonfiguration fehlt",
        message:
          "Keine Steuerrichtlinie hinterlegt. Bitte in Einstellungen → Steuerpolitik konfigurieren für korrekte Steuerberechnungen.",
        createdAt: new Date().toISOString().split("T")[0],
        isRead: false,
      });
    }
  } catch {}

  try {
    // D) Concentration risk
    const positions = await db.position.findMany({
      where: { workspaceId },
      include: { instrument: true },
    });
    if (positions.length > 0) {
      const totalMV = positions.reduce((s, p) => s + Number(p.bookValue), 0);
      const byClass: Record<string, number> = {};
      for (const p of positions) {
        const ac = p.instrument.assetClass as string;
        byClass[ac] = (byClass[ac] ?? 0) + Number(p.bookValue);
      }
      for (const [ac, val] of Object.entries(byClass)) {
        const pct = totalMV > 0 ? (val / totalMV) * 100 : 0;
        if (pct > 40) {
          generated.push({
            id: `smart-concentration-${ac}`,
            type: "CONCENTRATION_RISK",
            severity: "INFO",
            title: `Konzentrationsrisiko: ${ac}`,
            message: `${ac} macht ${pct.toFixed(1)} % Ihres Portfolios aus. Diversifikation prüfen.`,
            createdAt: new Date().toISOString().split("T")[0],
            isRead: false,
          });
        }
      }
    }
  } catch {}

  return generated;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function markAlertRead(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Only update real DB alerts (not smart-generated ones)
  if (!id.startsWith("smart-")) {
    await db.alert.updateMany({
      where: { id, workspaceId: session.workspaceId },
      data: { isRead: true },
    });
  }

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function dismissAlert(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  if (!id.startsWith("smart-")) {
    await db.alert.updateMany({
      where: { id, workspaceId: session.workspaceId },
      data: { isDismissed: true },
    });
  }

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function markAllAlertsRead() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.alert.updateMany({
    where: { workspaceId: session.workspaceId, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/alerts");
  return { success: true };
}
