import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Workspace, entities, and tax configuration</p>
      </div>

      {/* Workspace */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Workspace</h2>
        <div className="space-y-4">
          {[
            { label: "Workspace name", value: "Demo Family" },
            { label: "Base currency", value: "EUR" },
            { label: "Country", value: "Germany (DE)" },
            { label: "Timezone", value: "Europe/Berlin" },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-600">{f.label}</span>
              <span className="text-sm font-medium text-slate-800">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Entities */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Entities</h2>
          <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ Add entity</button>
        </div>
        <div className="space-y-2">
          {[
            { name: "Max Müller (personal)", type: "Individual", taxId: "12 345 678 901" },
            { name: "Müller GmbH", type: "Company", taxId: "DE123456789" },
          ].map((e) => (
            <div key={e.name} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">{e.name}</p>
                <p className="text-xs text-slate-500">{e.type} · Tax ID: {e.taxId}</p>
              </div>
              <button className="text-xs text-blue-600 hover:underline">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Policy */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Tax Policy</h2>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active: Germany 2025</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Abgeltungsteuer", value: "25%" },
            { label: "Solidaritätszuschlag", value: "5.5% on tax" },
            { label: "Kirchensteuer", value: "0% (not set)" },
            { label: "Freistellungsauftrag", value: "€1,000/year" },
            { label: "Spekulationsfrist (Crypto)", value: "1 year" },
            { label: "Spekulationsfrist (Real Estate)", value: "10 years" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">{r.label}</span>
              <span className="font-medium text-slate-800">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
          Tax rates are configurable. These are estimates for planning purposes — consult a tax advisor for official tax filings.
        </p>
      </div>

      {/* Forecast assumptions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Forecast Assumptions (Base Case)</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Equity return (annual)", value: "7.0%" },
            { label: "Bond return (annual)", value: "3.0%" },
            { label: "Real estate appreciation", value: "3.0%" },
            { label: "Crypto return (annual)", value: "15.0%" },
            { label: "Cash / savings rate", value: "2.5%" },
            { label: "Inflation rate", value: "2.0%" },
            { label: "Effective tax rate", value: "26.5%" },
            { label: "Average fee rate", value: "0.5%" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">{r.label}</span>
              <span className="font-medium text-slate-800">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
