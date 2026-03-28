import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDemoPositions } from "@/lib/data/holdings";
import { getPortfolioBreakdown } from "@/lib/data/positionMeta";
import { HoldingsShell } from "@/components/holdings/HoldingsShell";

export const metadata = { title: "Holdings" };

export default async function HoldingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const positions = await getDemoPositions();
  const breakdown = getPortfolioBreakdown(positions);

  return (
    <div className="space-y-6">
      <HoldingsShell positions={positions} breakdown={breakdown} />
    </div>
  );
}
