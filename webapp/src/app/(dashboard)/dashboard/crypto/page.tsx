import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadDbPositions } from "@/app/actions/positions";
import { CryptoShell } from "@/components/crypto/CryptoShell";
import type { PositionRow } from "@/lib/types";

export const metadata = { title: "Crypto" };

export default async function CryptoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let cryptoPositions: PositionRow[] = [];
  try {
    const allPositions = await loadDbPositions();
    const totalMV = allPositions.reduce((s, p) => s + p.marketValue, 0);
    cryptoPositions = allPositions
      .filter((p) => p.assetClass === "CRYPTO")
      .map((p) => ({
        ...p,
        assetClass: p.assetClass as PositionRow["assetClass"],
        weight: totalMV > 0 ? (p.marketValue / totalMV) * 100 : 0,
      }));
  } catch {
    // Fall back to demo data inside CryptoShell
  }

  return (
    <div className="space-y-6">
      <CryptoShell cryptoPositions={cryptoPositions} />
    </div>
  );
}
