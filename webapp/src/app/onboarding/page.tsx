import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">AC</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to AssetCompass</h1>
          <p className="text-slate-500 mt-2">Your personal wealth OS is ready. Here's how to get started:</p>
        </div>

        <div className="space-y-3">
          {[
            { step: "1", title: "Add your accounts", desc: "Set up broker depots, bank accounts, and wallets", href: "/dashboard/settings", cta: "Go to Settings" },
            { step: "2", title: "Import transactions", desc: "Upload CSV files from your broker or bank", href: "/dashboard/import", cta: "Start Import" },
            { step: "3", title: "Review your dashboard", desc: "See your consolidated wealth overview", href: "/dashboard", cta: "View Dashboard" },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                {s.step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
              <Link
                href={s.href}
                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition shrink-0"
              >
                {s.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            Skip and go to dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
