import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { AllocationChart } from "@/components/dashboard/AllocationChart";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { IncomeWidget } from "@/components/dashboard/IncomeWidget";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { TopHoldings } from "@/components/dashboard/TopHoldings";
import { IrrCard } from "@/components/dashboard/IrrCard";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardData(session.workspaceId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Wealth Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          All entities · {new Date().toLocaleDateString("en-DE", { dateStyle: "long" })}
        </p>
      </div>

      {/* Net worth summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <NetWorthCard
          title="Net Worth"
          value={data.netWorth}
          change={data.netWorthChange}
          changePct={data.netWorthChangePct}
          currency={data.currency}
          className="lg:col-span-1"
        />
        <NetWorthCard
          title="Total Assets"
          value={data.totalAssets}
          currency={data.currency}
        />
        <NetWorthCard
          title="Total Liabilities"
          value={data.totalLiabilities}
          currency={data.currency}
          negative
        />
        <NetWorthCard
          title="Liquid Cash"
          value={data.liquidCash}
          currency={data.currency}
          subtitle="Available to invest"
        />
        <IrrCard
          xirrRate={data.xirrRate}
          isDemo={data.xirrIsDemo}
        />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance chart — 2/3 width */}
        <div className="lg:col-span-2">
          <PerformanceChart data={data.performanceHistory} currency={data.currency} />
        </div>

        {/* Allocation — 1/3 width */}
        <AllocationChart allocations={data.allocations} currency={data.currency} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopHoldings positions={data.topHoldings} currency={data.currency} />
        <IncomeWidget income={data.recentIncome} currency={data.currency} />
        <AlertsWidget alerts={data.alerts} />
      </div>
    </div>
  );
}
