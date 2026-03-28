import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getPropertyById, computePropertyMetrics } from "@/lib/data/realEstate";
import { PropertyDetailShell } from "@/components/real-estate/PropertyDetailShell";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const property = await getPropertyById(id);
  return { title: property ? `${property.name} · Immobilien` : "Objekt" };
}

export default async function RealEstateDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  const metrics = computePropertyMetrics(property);

  return (
    <div className="max-w-5xl mx-auto space-y-1">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 pb-4">
        <Link
          href="/dashboard/real-estate"
          className="hover:text-slate-700 flex items-center gap-1 transition"
        >
          <ChevronLeft size={14} />
          Immobilien
        </Link>
        <span>/</span>
        <span className="text-slate-700">{property.name}</span>
      </div>

      <PropertyDetailShell property={property} metrics={metrics} />
    </div>
  );
}
