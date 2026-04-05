import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getImportJobs, getReviewItems } from "@/lib/data/importJobs";
import { getDemoTransactions } from "@/lib/data/transactions";
import { ImportHubShell } from "@/components/import/ImportHubShell";

export const metadata = { title: "Import & Datenprüfung" };

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [jobs, transactions] = await Promise.all([
    getImportJobs(),
    getDemoTransactions(),
  ]);

  const reviewItems = getReviewItems(jobs);

  return (
    <div className="max-w-5xl mx-auto">
      <ImportHubShell
        jobs={jobs}
        reviewItems={reviewItems}
        existingTransactions={transactions}
      />
    </div>
  );
}
