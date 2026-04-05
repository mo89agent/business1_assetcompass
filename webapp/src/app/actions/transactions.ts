"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { TransactionRow } from "@/lib/types";

// ── Load real DB transactions ─────────────────────────────────────────────────

export async function getDbTransactions(): Promise<TransactionRow[]> {
  const session = await getSession();
  if (!session) return [];

  const txs = await db.transaction.findMany({
    where: { workspaceId: session.workspaceId, isDeleted: false },
    include: { account: true, instrument: true },
    orderBy: { executedAt: "desc" },
    take: 500,
  });

  return txs.map((tx) => ({
    id: tx.id,
    type: tx.type as TransactionRow["type"],
    executedAt: tx.executedAt.toISOString().split("T")[0],
    settledAt: tx.settledAt?.toISOString().split("T")[0] ?? null,
    accountName: tx.account.name,
    accountId: tx.accountId,
    instrumentName: tx.instrument?.name ?? null,
    instrumentId: tx.instrumentId ?? null,
    ticker: tx.instrument?.ticker ?? null,
    quantity: tx.quantity !== null ? Number(tx.quantity) : null,
    price: tx.price !== null ? Number(tx.price) : null,
    amount: Number(tx.amount),
    currency: tx.currency,
    fees: Number(tx.fees),
    taxes: Number(tx.taxes),
    description: tx.description ?? tx.notes ?? null,
    source: {
      type: tx.provenance === "import" ? ("import" as const) : ("manual" as const),
      label: tx.provenance === "import" ? "Importiert" : "Manuell eingegeben",
    },
    isVerified: tx.isVerified,
    isDuplicate: tx.isDuplicate,
  }));
}

// ── Add a transaction manually ────────────────────────────────────────────────

export interface AddTransactionInput {
  type: string;
  executedAt: string;
  accountName: string;
  ticker?: string | null;
  instrumentName?: string | null;
  quantity?: number | null;
  price?: number | null;
  amount: number;
  currency: string;
  fees?: number;
  taxes?: number;
  description?: string;
}

export async function addTransaction(input: AddTransactionInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Find or create account
  let account = await db.account.findFirst({
    where: { workspaceId: session.workspaceId, name: input.accountName },
  });
  if (!account) {
    account = await db.account.create({
      data: {
        workspaceId: session.workspaceId,
        name: input.accountName,
        type: "BROKERAGE" as never,
        currency: input.currency,
      },
    });
  }

  // Find instrument if ticker provided
  let instrumentId: string | null = null;
  if (input.ticker) {
    const instrument = await db.instrument.findFirst({
      where: { workspaceId: session.workspaceId, ticker: input.ticker.toUpperCase() },
    });
    if (instrument) instrumentId = instrument.id;
  }

  await db.transaction.create({
    data: {
      workspaceId: session.workspaceId,
      accountId: account.id,
      instrumentId,
      type: input.type as never,
      quantity: input.quantity ?? null,
      price: input.price ?? null,
      amount: input.amount,
      currency: input.currency,
      fees: input.fees ?? 0,
      taxes: input.taxes ?? 0,
      executedAt: new Date(input.executedAt),
      description: input.description || null,
      provenance: "manual",
      isVerified: true,
    },
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Mark transaction as verified ──────────────────────────────────────────────

export async function markTransactionVerified(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.transaction.updateMany({
    where: { id, workspaceId: session.workspaceId },
    data: { isVerified: true, isDuplicate: false },
  });

  revalidatePath("/dashboard/transactions");
  return { success: true };
}

// ── Delete transaction ────────────────────────────────────────────────────────

export async function deleteTransaction(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await db.transaction.updateMany({
    where: { id, workspaceId: session.workspaceId },
    data: { isDeleted: true },
  });

  revalidatePath("/dashboard/transactions");
  return { success: true };
}
