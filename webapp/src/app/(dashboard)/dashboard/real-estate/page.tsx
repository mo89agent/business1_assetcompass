import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbProperties } from "@/app/actions/realEstate";
import { getProperties } from "@/lib/data/realEstate";
import { RealEstateShell } from "@/components/real-estate/RealEstateShell";

export const metadata = { title: "Immobilien" };

export default async function RealEstatePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let properties = await getDbProperties();
  let isDemo = false;

  if (properties.length === 0) {
    properties = await getProperties(); // demo fallback
    isDemo = true;
  }

  return <RealEstateShell properties={properties} isDemo={isDemo} />;
}
