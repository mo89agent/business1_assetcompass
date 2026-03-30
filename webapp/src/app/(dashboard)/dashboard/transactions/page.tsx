import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbTransactions } from "@/app/actions/transactions";
import { getDemoTransactions } from "@/lib/data/transactions";
import { TransactionsShell } from "@/components/transactions/TransactionsShell";
import type { TransactionRow } from "@/lib/types";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let transactions: TransactionRow[];
  let isDemo = false;
  try {
    const dbTxs = await getDbTransactions();
    if (dbTxs.length > 0) {
      transactions = dbTxs;
    } else {
      transactions = await getDemoTransactions();
      isDemo = true;
    }
  } catch {
    transactions = await getDemoTransactions();
    isDemo = true;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <TransactionsShell transactions={transactions} isDemo={isDemo} />
    </div>
  );
}
