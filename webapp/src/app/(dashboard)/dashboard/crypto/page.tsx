import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatPercent, gainColor, gainBg, cn } from "@/lib/utils";

export const metadata = { title: "Crypto" };

const DEMO_CRYPTO = [
  { id: "c1", symbol: "BTC", name: "Bitcoin", account: "Coinbase", qty: 0.85, avgCost: 38000, currentPrice: 54200, value: 46070, gain: 13770, gainPct: 42.6, currency: "USD", staking: false },
  { id: "c2", symbol: "ETH", name: "Ethereum", account: "Coinbase", qty: 8.5, avgCost: 1800, currentPrice: 2280, value: 19380, gain: 4080, gainPct: 26.7, currency: "USD", staking: true },
  { id: "c3", symbol: "SOL", name: "Solana", account: "Phantom Wallet", qty: 45, avgCost: 95, currentPrice: 142, value: 6390, gain: 2115, gainPct: 49.5, currency: "USD", staking: true },
];

const totalValue = DEMO_CRYPTO.reduce((s, c) => s + c.value, 0);
const totalGain = DEMO_CRYPTO.reduce((s, c) => s + c.gain, 0);

export default async function CryptoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Crypto</h1>
          <p className="text-sm text-slate-500 mt-0.5">{DEMO_CRYPTO.length} positions</p>
        </div>
        <button className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition">
          + Add wallet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Value</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalValue, "USD")}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Unrealized Gain</p>
          <p className={`text-2xl font-bold mt-1 ${gainColor(totalGain)}`}>
            +{formatCurrency(totalGain, "USD")}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Staking Active</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {DEMO_CRYPTO.filter((c) => c.staking).length} assets
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Asset", "Account", "Quantity", "Avg Cost", "Current Price", "Value", "Gain/Loss", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide first:text-left last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {DEMO_CRYPTO.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                      {c.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.symbol}</p>
                      <p className="text-xs text-slate-400">{c.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{c.account}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-700">{c.qty.toFixed(4)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(c.avgCost, c.currency)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{formatCurrency(c.currentPrice, c.currency)}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatCurrency(c.value, c.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${gainBg(c.gain)}`}>
                    +{formatPercent(c.gainPct)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.staking && (
                    <span className="inline-block px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                      Staking ✓
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <strong>Tax note:</strong> Crypto held &gt;1 year may be tax-exempt in Germany (§23 EStG). Cost basis and holding periods are tracked per transaction lot. Review your tax settings.
      </div>
    </div>
  );
}
