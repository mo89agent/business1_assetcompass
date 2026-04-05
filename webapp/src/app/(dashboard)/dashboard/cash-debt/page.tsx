import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCashAccounts, getLoans } from "@/app/actions/accounts";
import { CashDebtShell } from "@/components/cash-debt/CashDebtShell";

export const metadata = { title: "Cash & Debt" };

export default async function CashDebtPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [cashAccounts, loans] = await Promise.all([
    getCashAccounts(),
    getLoans(),
  ]);

  const isDemo = cashAccounts.length === 0 && loans.length === 0;

  return <CashDebtShell initialCash={cashAccounts} initialLoans={loans} isDemo={isDemo} />;
}
