import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadDbPositions } from "@/app/actions/positions";
import { getDemoPositions } from "@/lib/data/holdings";
import { getPortfolioBreakdown } from "@/lib/data/positionMeta";
import { HoldingsShell } from "@/components/holdings/HoldingsShell";
import type { PositionRow } from "@/lib/types";

export const metadata = { title: "Holdings" };

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function HoldingsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { filter } = await searchParams;

  // Load from DB; fall back to demo data if portfolio is empty
  let positions: PositionRow[];
  try {
    const dbPositions = await loadDbPositions();
    if (dbPositions.length > 0) {
      // Compute portfolio weights
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

  const breakdown = getPortfolioBreakdown(positions);

  return (
    <div className="space-y-6">
      <HoldingsShell positions={positions} breakdown={breakdown} filterClass={filter} />
    </div>
  );
}
