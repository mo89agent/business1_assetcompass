import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HoldingsTable } from "@/components/holdings/HoldingsTable";
import { getDemoPositions } from "@/lib/data/holdings";

export const metadata = { title: "Holdings" };

export default async function HoldingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const positions = await getDemoPositions();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Holdings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {positions.length} positions across all accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">
            Export
          </button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition">
            + Add position
          </button>
        </div>
      </div>

      <HoldingsTable positions={positions} />
    </div>
  );
}
