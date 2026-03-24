import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TransactionLedger } from "@/components/transactions/TransactionLedger";
import { getDemoTransactions } from "@/lib/data/transactions";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const transactions = await getDemoTransactions();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Transaction Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete record of all economic events
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">
            Export CSV
          </button>
          <button className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition">
            + Add transaction
          </button>
        </div>
      </div>

      <TransactionLedger transactions={transactions} />
    </div>
  );
}
