"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { PropertyRecord, PropertyLoan, CostLine } from "@/lib/types";

// ── Map DB → PropertyRecord ───────────────────────────────────

function getConfidence(valueDate: Date | null): "high" | "medium" | "low" {
  if (!valueDate) return "low";
  const ageMs = Date.now() - valueDate.getTime();
  const ageDays = ageMs / 86_400_000;
  if (ageDays < 180) return "high";
  if (ageDays < 540) return "medium";
  return "low";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToPropertyRecord(p: any): PropertyRecord {
  const estimatedValue = Number(p.currentValue ?? p.acquisitionPrice ?? 0);
  const spread = estimatedValue * 0.05;

  const loans: PropertyLoan[] = (p.loans ?? []).map((l: any) => ({
    id: l.id,
    propertyId: p.id,
    lender: l.lenderName ?? "Bank",
    originalAmount: Number(l.principalOriginal),
    remainingBalance: Number(l.principalRemaining),
    interestRatePct: l.interestRate,
    isFixedRate: l.isFixedRate,
    fixedRateUntil: l.fixedRateUntil ? new Date(l.fixedRateUntil).toISOString().split("T")[0] : null,
    monthlyPayment: Number(l.monthlyPayment ?? 0),
    termYears: l.amortizationYears ?? 20,
    startDate: l.startDate ? new Date(l.startDate).toISOString().split("T")[0] : "",
    currency: l.currency ?? "EUR",
  }));

  const costLines: CostLine[] = [];
  if (Number(p.operatingCostsMonthly) > 0) {
    costLines.push({
      label: "Bewirtschaftungskosten",
      monthlyAmount: Number(p.operatingCostsMonthly),
      isEstimated: true,
      category: "management",
    });
  }
  if (Number(p.maintenanceReserve) > 0) {
    costLines.push({
      label: "Instandhaltungsrücklage",
      monthlyAmount: Number(p.maintenanceReserve),
      isEstimated: true,
      category: "maintenance",
    });
  }

  const typeMap: Record<string, "residential" | "commercial" | "mixed" | "land"> = {
    residential: "residential",
    commercial: "commercial",
    mixed: "mixed",
    land: "land",
    RESIDENTIAL: "residential",
    COMMERCIAL: "commercial",
    MIXED: "mixed",
    LAND: "land",
  };

  return {
    id: p.id,
    name: p.account?.name ?? "Immobilie",
    address: p.address,
    city: p.city,
    country: p.country ?? "DE",
    postalCode: p.postalCode ?? "",
    type: typeMap[p.propertyType] ?? "residential",
    subtype: p.usageType ?? undefined,
    sqm: p.floorAreaSqm ?? null,
    yearBuilt: p.buildYear ?? null,
    energyClass: p.energyClass ?? null,
    acquisitionDate: p.acquisitionDate
      ? new Date(p.acquisitionDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    acquisitionPrice: Number(p.acquisitionPrice ?? 0),
    acquisitionCosts: Number(p.ancillaryCosts ?? 0),
    valuation: {
      estimatedValue,
      valueLow: estimatedValue - spread,
      valueHigh: estimatedValue + spread,
      confidence: getConfidence(p.currentValueDate),
      method: "self_estimated",
      asOf: p.currentValueDate
        ? new Date(p.currentValueDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: p.notes ?? "",
      source: { type: "manual", label: "Manuelle Schätzung" },
    },
    loans,
    targetRentMonthly: Number(p.targetRentMonthly ?? 0),
    actualRentMonthly: Number(p.actualRentMonthly ?? 0),
    vacancyAllowancePct: (p.vacancyRate ?? 0) * 100,
    costLines,
    currency: p.acquisitionCurrency ?? "EUR",
  };
}

// ── Queries ───────────────────────────────────────────────────

export async function getDbProperties(): Promise<PropertyRecord[]> {
  const session = await getSession();
  if (!session) return [];

  const props = await db.property.findMany({
    where: { account: { workspaceId: session.workspaceId } },
    include: { account: true, loans: true },
    orderBy: { createdAt: "asc" },
  });

  return props.map(mapToPropertyRecord);
}

// ── Add property ──────────────────────────────────────────────

export interface AddPropertyInput {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  propertyType: string;
  floorAreaSqm?: number;
  buildYear?: number;
  energyClass?: string;
  acquisitionDate?: string;
  acquisitionPrice: number;
  ancillaryCosts?: number;
  currentValue?: number;
  targetRentMonthly?: number;
  actualRentMonthly?: number;
  vacancyRate?: number;
  operatingCostsMonthly?: number;
  maintenanceReserve?: number;
  notes?: string;
  // Optional mortgage
  mortgageLender?: string;
  mortgagePrincipal?: number;
  mortgageRemaining?: number;
  mortgageRate?: number;
  mortgageMonthly?: number;
  mortgageFixedUntil?: string;
}

export async function addProperty(input: AddPropertyInput): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Nicht eingeloggt" };

    const account = await db.account.create({
      data: {
        workspaceId: session.workspaceId,
        name: input.name,
        type: "PROPERTY",
        currency: input.country === "DE" ? "EUR" : "EUR",
        institution: input.address,
        notes: input.notes,
      },
    });

    const property = await db.property.create({
      data: {
        accountId: account.id,
        address: input.address,
        city: input.city,
        postalCode: input.postalCode ?? "",
        country: input.country ?? "DE",
        propertyType: input.propertyType,
        usageType: input.propertyType,
        floorAreaSqm: input.floorAreaSqm ?? null,
        buildYear: input.buildYear ?? null,
        energyClass: input.energyClass ?? null,
        acquisitionDate: input.acquisitionDate ? new Date(input.acquisitionDate) : null,
        acquisitionPrice: input.acquisitionPrice,
        acquisitionCurrency: "EUR",
        ancillaryCosts: input.ancillaryCosts ?? 0,
        currentValue: input.currentValue ?? input.acquisitionPrice,
        currentValueDate: new Date(),
        targetRentMonthly: input.targetRentMonthly ?? 0,
        actualRentMonthly: input.actualRentMonthly ?? 0,
        // vacancyRate stored as decimal (0–1); input must be percentage (0–100)
        vacancyRate: Math.min(Math.max((input.vacancyRate ?? 0), 0), 100) / 100,
        operatingCostsMonthly: input.operatingCostsMonthly ?? 0,
        maintenanceReserve: input.maintenanceReserve ?? 0,
        notes: input.notes ?? null,
      },
    });

    // Add mortgage if provided
    if (input.mortgagePrincipal && input.mortgagePrincipal > 0) {
      await db.loanDetails.create({
        data: {
          propertyId: property.id,
          lenderName: input.mortgageLender ?? "Bank",
          loanType: "MORTGAGE",
          principalOriginal: input.mortgagePrincipal,
          principalRemaining: input.mortgageRemaining ?? input.mortgagePrincipal,
          currency: "EUR",
          interestRate: input.mortgageRate ?? 0,
          isFixedRate: true,
          fixedRateUntil: input.mortgageFixedUntil ? new Date(input.mortgageFixedUntil) : null,
          monthlyPayment: input.mortgageMonthly ?? 0,
          amortizationYears: 20,
        },
      });
    }

    // Create a valuation entry so property value shows in net worth
    await db.valuation.create({
      data: {
        workspaceId: session.workspaceId,
        accountId: account.id,
        value: input.currentValue ?? input.acquisitionPrice,
        currency: "EUR",
        valuedAt: new Date(),
        source: "MANUAL",
        notes: "Erfasst bei Anlage",
      },
    });

    revalidatePath("/dashboard/real-estate");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
