"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CashAccountRow {
  id: string;
  name: string;
  institution: string | null;
  balance: number;
  currency: string;
  interestRate: number;
  type: string;
}

export interface LoanRow {
  id: string;
  name: string;
  lender: string | null;
  principal: number;
  remaining: number;
  currency: string;
  rate: number;
  monthly: number;
  maturity: string | null;
  fixedUntil: string | null;
  type: string;
  ltv: number | null;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getCashAccounts(): Promise<CashAccountRow[]> {
  const session = await getSession();
  if (!session) return [];

  const accounts = await db.account.findMany({
    where: {
      workspaceId: session.workspaceId,
      type: { in: ["BANK_ACCOUNT", "SAVINGS_ACCOUNT", "FIXED_DEPOSIT"] as never[] },
      isActive: true,
    },
    include: {
      valuations: { orderBy: { valuedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    institution: a.institution,
    balance: a.valuations[0] ? Number(a.valuations[0].value) : 0,
    currency: a.currency,
    interestRate: 0,
    type:
      a.type === "SAVINGS_ACCOUNT"
        ? "Savings"
        : a.type === "FIXED_DEPOSIT"
        ? "Fixed"
        : "Current",
  }));
}

export async function getLoans(): Promise<LoanRow[]> {
  const session = await getSession();
  if (!session) return [];

  const loans = await db.loanDetails.findMany({
    where: {
      account: { workspaceId: session.workspaceId },
    },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });

  return loans.map((l) => ({
    id: l.id,
    name: l.account?.name ?? l.lenderName ?? "Kredit",
    lender: l.lenderName,
    principal: Number(l.principalOriginal),
    remaining: Number(l.principalRemaining),
    currency: l.currency,
    rate: l.interestRate,
    monthly: l.monthlyPayment ? Number(l.monthlyPayment) : 0,
    maturity: l.maturityDate?.toISOString().split("T")[0] ?? null,
    fixedUntil: l.fixedRateUntil?.toISOString().split("T")[0] ?? null,
    type: l.loanType,
    ltv: l.ltv,
  }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export interface AddCashAccountInput {
  name: string;
  institution?: string;
  balance: number;
  currency: string;
  interestRate?: number;
  type: "Current" | "Savings" | "Fixed" | "FX";
}

export async function addCashAccount(input: AddCashAccountInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const accountType =
    input.type === "Savings"
      ? "SAVINGS_ACCOUNT"
      : input.type === "Fixed"
      ? "FIXED_DEPOSIT"
      : "BANK_ACCOUNT";

  const account = await db.account.create({
    data: {
      workspaceId: session.workspaceId,
      name: input.name,
      institution: input.institution || null,
      type: accountType as never,
      currency: input.currency,
    },
  });

  if (input.balance > 0) {
    await db.valuation.create({
      data: {
        workspaceId: session.workspaceId,
        accountId: account.id,
        value: input.balance,
        currency: input.currency,
        valuedAt: new Date(),
        source: "MANUAL",
      },
    });
  }

  revalidatePath("/dashboard/cash-debt");
  revalidatePath("/dashboard");
  return { success: true, id: account.id };
}

export interface AddLoanInput {
  name: string;
  lender?: string;
  principal: number;
  remaining: number;
  currency: string;
  rate: number;
  monthly?: number;
  maturity?: string;
  fixedUntil?: string;
  type?: string;
  ltv?: number;
}

export async function addLoan(input: AddLoanInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const account = await db.account.create({
    data: {
      workspaceId: session.workspaceId,
      name: input.name,
      institution: input.lender || null,
      type: "LOAN_ACCOUNT" as never,
      currency: input.currency,
    },
  });

  await db.loanDetails.create({
    data: {
      accountId: account.id,
      lenderName: input.lender || null,
      loanType: input.type || "Loan",
      principalOriginal: input.principal,
      principalRemaining: input.remaining,
      currency: input.currency,
      interestRate: input.rate,
      isFixedRate: true,
      monthlyPayment: input.monthly ?? null,
      maturityDate: input.maturity ? new Date(input.maturity) : null,
      fixedRateUntil: input.fixedUntil ? new Date(input.fixedUntil) : null,
      ltv: input.ltv ?? null,
    },
  });

  revalidatePath("/dashboard/cash-debt");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCashAccountBalance(accountId: string, balance: number, currency: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.valuation.create({
    data: {
      workspaceId: session.workspaceId,
      accountId,
      value: balance,
      currency,
      valuedAt: new Date(),
      source: "MANUAL",
    },
  });

  revalidatePath("/dashboard/cash-debt");
  revalidatePath("/dashboard");
  return { success: true };
}
