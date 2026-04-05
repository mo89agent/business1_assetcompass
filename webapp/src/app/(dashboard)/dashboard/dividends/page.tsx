import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadDbPositions } from "@/app/actions/positions";
import { getDemoPositions } from "@/lib/data/holdings";
import { DividendsShell } from "@/components/dividends/DividendsShell";
import type { PositionRow } from "@/lib/types";

export const metadata = { title: "Dividenden" };

export default async function DividendsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let positions: PositionRow[];
  try {
    const db = await loadDbPositions();
    positions = db.length > 0
      ? db.map((p) => ({ ...p, assetClass: p.assetClass as PositionRow["assetClass"] }))
      : await getDemoPositions();
  } catch {
    positions = await getDemoPositions();
  }

  return (
    <div className="space-y-6">
      <DividendsShell positions={positions} />
    </div>
  );
}
