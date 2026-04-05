"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getWorkspaceSettings() {
  const session = await getSession();
  if (!session) return null;

  try {
    const ws = await db.workspace.findUnique({ where: { id: session.workspaceId } });
    return ws;
  } catch { return null; }
}

export async function updateWorkspaceSettings(data: {
  name?: string; currency?: string; country?: string; timezone?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.workspace.update({
    where: { id: session.workspaceId },
    data: {
      ...(data.name     ? { name: data.name }         : {}),
      ...(data.currency ? { currency: data.currency } : {}),
      ...(data.country  ? { country: data.country }   : {}),
      ...(data.timezone ? { timezone: data.timezone } : {}),
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getOrCreateTaxPolicy() {
  const session = await getSession();
  if (!session) return null;

  try {
    let policy = await db.taxPolicy.findFirst({
      where: { workspaceId: session.workspaceId, isActive: true },
    });

    if (!policy) {
      policy = await db.taxPolicy.create({
        data: {
          workspaceId: session.workspaceId,
          name: "Deutschland 2025",
          country: "DE",
          year: 2025,
          isActive: true,
          capitalGainsTaxRate: 0.25,
          soliRate: 0.055,
          churchTaxRate: 0,
          freistellungsauftrag: 1000,
          spekulationsfristYears: 10,
        },
      });
    }
    return policy;
  } catch { return null; }
}

export async function updateTaxPolicy(data: {
  capitalGainsTaxRate?: number; soliRate?: number; churchTaxRate?: number;
  freistellungsauftrag?: number; spekulationsfristYears?: number; name?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  let policy = await db.taxPolicy.findFirst({
    where: { workspaceId: session.workspaceId, isActive: true },
  });

  if (!policy) {
    policy = await db.taxPolicy.create({
      data: {
        workspaceId: session.workspaceId,
        name: data.name ?? "Deutschland 2025",
        country: "DE",
        year: 2025,
        isActive: true,
        capitalGainsTaxRate: data.capitalGainsTaxRate ?? 0.25,
        soliRate: data.soliRate ?? 0.055,
        churchTaxRate: data.churchTaxRate ?? 0,
        freistellungsauftrag: data.freistellungsauftrag ?? 1000,
        spekulationsfristYears: data.spekulationsfristYears ?? 10,
      },
    });
  } else {
    await db.taxPolicy.update({
      where: { id: policy.id },
      data: {
        ...(data.capitalGainsTaxRate  != null ? { capitalGainsTaxRate: data.capitalGainsTaxRate }   : {}),
        ...(data.soliRate             != null ? { soliRate: data.soliRate }                         : {}),
        ...(data.churchTaxRate        != null ? { churchTaxRate: data.churchTaxRate }               : {}),
        ...(data.freistellungsauftrag != null ? { freistellungsauftrag: data.freistellungsauftrag } : {}),
        ...(data.spekulationsfristYears != null ? { spekulationsfristYears: data.spekulationsfristYears } : {}),
        ...(data.name ? { name: data.name } : {}),
      },
    });
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getOrCreateForecastAssumption() {
  const session = await getSession();
  if (!session) return null;

  try {
    let fa = await db.forecastAssumption.findFirst({
      where: { workspaceId: session.workspaceId, isDefault: true },
    });
    if (!fa) {
      fa = await db.forecastAssumption.create({
        data: {
          workspaceId: session.workspaceId,
          name: "Base Case",
          isDefault: true,
        },
      });
    }
    return fa;
  } catch { return null; }
}

export async function updateForecastAssumption(data: {
  equityReturnAnnual?: number; bondReturnAnnual?: number;
  realEstateAppreciation?: number; cryptoReturnAnnual?: number;
  cashReturnAnnual?: number; inflationRate?: number;
  effectiveTaxRate?: number; avgFeeRate?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  let fa = await db.forecastAssumption.findFirst({
    where: { workspaceId: session.workspaceId, isDefault: true },
  });

  if (!fa) {
    fa = await db.forecastAssumption.create({
      data: { workspaceId: session.workspaceId, name: "Base Case", isDefault: true },
    });
  }

  await db.forecastAssumption.update({
    where: { id: fa.id },
    data: {
      ...(data.equityReturnAnnual      != null ? { equityReturnAnnual: data.equityReturnAnnual }           : {}),
      ...(data.bondReturnAnnual        != null ? { bondReturnAnnual: data.bondReturnAnnual }               : {}),
      ...(data.realEstateAppreciation  != null ? { realEstateAppreciation: data.realEstateAppreciation }   : {}),
      ...(data.cryptoReturnAnnual      != null ? { cryptoReturnAnnual: data.cryptoReturnAnnual }           : {}),
      ...(data.cashReturnAnnual        != null ? { cashReturnAnnual: data.cashReturnAnnual }               : {}),
      ...(data.inflationRate           != null ? { inflationRate: data.inflationRate }                     : {}),
      ...(data.effectiveTaxRate        != null ? { effectiveTaxRate: data.effectiveTaxRate }               : {}),
      ...(data.avgFeeRate              != null ? { avgFeeRate: data.avgFeeRate }                           : {}),
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
