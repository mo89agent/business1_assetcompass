import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { loadDbPositions } from "@/app/actions/positions";
import { getDemoPositions } from "@/lib/data/holdings";
import { getTaxLotsForPosition } from "@/lib/data/taxLots";
import { getEtfExposureForPosition } from "@/lib/data/etfExposure";
import { getDividendsForPosition } from "@/lib/data/positionDividends";
import { HoldingDetailShell } from "@/components/holdings/HoldingDetailShell";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { PositionRow } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

async function getPositions(): Promise<PositionRow[]> {
  try {
    const db = await loadDbPositions();
    if (db.length > 0) {
      const totalMV = db.reduce((s, p) => s + p.marketValue, 0);
      return db.map((p) => ({
        ...p,
        assetClass: p.assetClass as PositionRow["assetClass"],
        weight: totalMV > 0 ? (p.marketValue / totalMV) * 100 : 0,
      }));
    }
  } catch {}
  return getDemoPositions();
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const positions = await getPositions();
  const pos = positions.find((p) => p.id === id);
  return { title: pos ? `${pos.name} · Holdings` : "Position" };
}

export default async function HoldingDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const [positions, taxLots, etfExposure, dividends] = await Promise.all([
    getPositions(),
    getTaxLotsForPosition(id),
    getEtfExposureForPosition(id),
    getDividendsForPosition(id),
  ]);

  const position = positions.find((p) => p.id === id);
  if (!position) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-1">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 pb-4">
        <Link
          href="/dashboard/holdings"
          className="hover:text-slate-700 flex items-center gap-1 transition"
        >
          <ChevronLeft size={14} />
          Holdings
        </Link>
        <span>/</span>
        <span className="text-slate-700">{position.name}</span>
      </div>

      <HoldingDetailShell
        position={position}
        taxLots={taxLots}
        etfExposure={etfExposure}
        dividends={dividends}
      />
    </div>
  );
}
