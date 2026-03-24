import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScenarioLab } from "@/components/scenarios/ScenarioLab";

export const metadata = { title: "Scenario Lab" };

export default async function ScenariosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Scenario Lab</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Stress-test your portfolio against different market scenarios
        </p>
      </div>
      <ScenarioLab />
    </div>
  );
}
