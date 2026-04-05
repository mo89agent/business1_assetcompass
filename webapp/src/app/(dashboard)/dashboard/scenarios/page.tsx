import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadDbPositions } from "@/app/actions/positions";
import { getDemoPositions } from "@/lib/data/holdings";
import { ScenarioLabShell } from "@/components/scenarios/ScenarioLabShell";
import type { PositionRow } from "@/lib/types";

export const metadata = { title: "Scenario Lab" };

export default async function ScenariosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let positions: PositionRow[];
  try {
    const dbPositions = await loadDbPositions();
    if (dbPositions.length > 0) {
      const totalMV = dbPositions.reduce((s, p) => s + p.marketValue, 0);
      positions = dbPositions.map((p) => ({
        ...p,
        assetClass: p.assetClass as PositionRow["assetClass"],
        weight: totalMV > 0 ? (p.marketValue / totalMV) * 100 : 0,
      }));
    } else {
      positions = await getDemoPositions();
    }
  } catch {
    positions = await getDemoPositions();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Scenario Lab</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Monte Carlo Simulation · VaR/CVaR · Historische Stresstests
        </p>
      </div>
      <ScenarioLabShell positions={positions} />
    </div>
  );
}
