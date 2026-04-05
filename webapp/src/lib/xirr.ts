/**
 * XIRR — Extended Internal Rate of Return (money-weighted return).
 *
 * Finds the annualised discount rate r such that:
 *   NPV = Σ CF_i / (1+r)^(t_i/365) = 0
 *
 * Uses Newton-Raphson iteration with a robust restart strategy.
 *
 * Convention:
 *   amount < 0  →  outflow  (deposit, purchase)
 *   amount > 0  →  inflow   (withdrawal, dividend, terminal portfolio value)
 *
 * Returns null when the series has no solution (e.g. all-positive or all-negative cash flows).
 */

export interface CashFlow {
  amount: number;
  date: Date;
}

function npv(rate: number, amounts: number[], years: number[]): number {
  let v = 0;
  for (let i = 0; i < amounts.length; i++) {
    const base = 1 + rate;
    if (base <= 0) return NaN;
    v += amounts[i] / Math.pow(base, years[i]);
  }
  return v;
}

function dnpv(rate: number, amounts: number[], years: number[]): number {
  let v = 0;
  for (let i = 0; i < amounts.length; i++) {
    const base = 1 + rate;
    if (base <= 0) return NaN;
    v -= years[i] * amounts[i] / (Math.pow(base, years[i]) * base);
  }
  return v;
}

export function xirr(cashflows: CashFlow[], maxIter = 300): number | null {
  if (cashflows.length < 2) return null;

  // Validate: need at least one positive and one negative cash flow
  const hasPos = cashflows.some((c) => c.amount > 0);
  const hasNeg = cashflows.some((c) => c.amount < 0);
  if (!hasPos || !hasNeg) return null;

  // Sort by date
  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date.getTime();
  const MS_PER_YEAR = 365.25 * 86_400_000;
  const years = sorted.map((cf) => (cf.date.getTime() - t0) / MS_PER_YEAR);
  const amounts = sorted.map((cf) => cf.amount);

  // Try multiple starting guesses; pick the one that converges
  const guesses = [0.1, 0.0, 0.3, -0.1, 1.0, -0.5];

  for (const guess of guesses) {
    let r = guess;
    for (let iter = 0; iter < maxIter; iter++) {
      const f = npv(r, amounts, years);
      if (isNaN(f) || !isFinite(f)) break;
      if (Math.abs(f) < 1e-7) return r; // converged

      const df = dnpv(r, amounts, years);
      if (isNaN(df) || Math.abs(df) < 1e-15) break; // near-zero derivative

      const rNew = r - f / df;
      if (!isFinite(rNew)) break;

      // Clamp to avoid divergence into invalid territory
      const rClamped = Math.max(-0.9999, Math.min(rNew, 100));
      if (Math.abs(rClamped - r) < 1e-10) return rClamped;
      r = rClamped;
    }
  }

  return null; // no convergence
}

/**
 * Format XIRR result as percentage string with sign.
 * Returns null if xirr is null.
 */
export function formatXirr(rate: number | null): string | null {
  if (rate === null) return null;
  const pct = rate * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(2) + " % p.a.";
}
