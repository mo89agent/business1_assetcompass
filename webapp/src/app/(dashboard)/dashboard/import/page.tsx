import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ImportWizard } from "@/components/import/ImportWizard";

export const metadata = { title: "Import" };

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Import Data</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload CSV files, bank statements, and broker exports
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
