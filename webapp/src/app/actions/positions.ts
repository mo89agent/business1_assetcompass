"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Helper ───────────────────────────────────────────────────────────────────

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function getOrCreateDefaultAccount(workspaceId: string, accountName: string) {
  let account = await db.account.findFirst({
    where: { workspaceId, name: accountName },
  });
  if (!account) {
    account = await db.account.create({
      data: {
        workspaceId,
        name: accountName,
        type: "BROKERAGE",
        currency: "EUR",
      },
    });
  }
  return account;
}

// ── Create or update instrument ──────────────────────────────────────────────

export interface InstrumentInput {
  ticker: string;
  isin?: string;
  name: string;
  assetClass: string;
  currency: string;
  exchange?: string;
  country?: string;
  sector?: string;
  ter?: number;
  description?: string;
}

export async function upsertInstrument(input: InstrumentInput) {
  const session = await requireSession();

  const data = {
    workspaceId: session.workspaceId,
    ticker: input.ticker.toUpperCase(),
    isin: input.isin || null,
    name: input.name,
    assetClass: input.assetClass as never,
    currency: input.currency,
    exchange: input.exchange || null,
    country: input.country || null,
    sector: input.sector || null,
    ter: input.ter ?? null,
    description: input.description || null,
  };

  // Try to find existing by ticker in workspace
  const existing = await db.instrument.findFirst({
    where: { workspaceId: session.workspaceId, ticker: input.ticker.toUpperCase() },
  });

  if (existing) {
    return db.instrument.update({ where: { id: existing.id }, data });
  }
  return db.instrument.create({ data });
}

// ── Add position (BUY transaction + position) ────────────────────────────────

export interface AddPositionInput {
  ticker: string;
  isin?: string;
  instrumentName: string;
  assetClass: string;
  currency: string;
  exchange?: string;
  country?: string;
  sector?: string;
  quantity: number;
  pricePerUnit: number;
  purchaseDate: string;       // ISO date string
  accountName: string;
  fees?: number;
  notes?: string;
}

export async function addPosition(input: AddPositionInput) {
  const session = await requireSession();

  // 1. Upsert instrument
  const instrument = await upsertInstrument({
    ticker: input.ticker,
    isin: input.isin,
    name: input.instrumentName,
    assetClass: input.assetClass,
    currency: input.currency,
    exchange: input.exchange,
    country: input.country,
    sector: input.sector,
  });

  // 2. Get or create account
  const account = await getOrCreateDefaultAccount(session.workspaceId, input.accountName);

  // 3. Record BUY transaction
  const totalAmount = -(input.quantity * input.pricePerUnit + (input.fees ?? 0));
  await db.transaction.create({
    data: {
      workspaceId: session.workspaceId,
      accountId: account.id,
      instrumentId: instrument.id,
      type: "BUY",
      quantity: input.quantity,
      price: input.pricePerUnit,
      amount: totalAmount,
      currency: input.currency,
      fees: input.fees ?? 0,
      executedAt: new Date(input.purchaseDate),
      provenance: "manual",
      isVerified: true,
      notes: input.notes || null,
    },
  });

  // 4. Upsert position (avg cost, quantity)
  const existing = await db.position.findFirst({
    where: { accountId: account.id, instrumentId: instrument.id },
  });

  const bookValue = input.quantity * input.pricePerUnit;

  if (existing) {
    const prevQty   = Number(existing.quantity);
    const prevBook  = Number(existing.bookValue);
    const newQty    = prevQty + input.quantity;
    const newBook   = prevBook + bookValue;
    const newAvgCost = newBook / newQty;
    await db.position.update({
      where: { id: existing.id },
      data: { quantity: newQty, avgCostBasis: newAvgCost, bookValue: newBook },
    });
  } else {
    await db.position.create({
      data: {
        workspaceId: session.workspaceId,
        accountId: account.id,
        instrumentId: instrument.id,
        quantity: input.quantity,
        avgCostBasis: input.pricePerUnit,
        bookValue,
        currency: input.currency,
        openedAt: new Date(input.purchaseDate),
      },
    });
  }

  revalidatePath("/dashboard/holdings");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Load positions from DB ────────────────────────────────────────────────────

export async function loadDbPositions() {
  const session = await requireSession();

  const positions = await db.position.findMany({
    where: { workspaceId: session.workspaceId },
    include: { instrument: true, account: true },
    orderBy: { bookValue: "desc" },
  });

  return positions.map((p) => ({
    id: p.id,
    accountId: p.accountId,
    accountName: p.account.name,
    instrumentId: p.instrumentId,
    ticker: p.instrument.ticker,
    name: p.instrument.name,
    assetClass: p.instrument.assetClass as string,
    currency: p.currency,
    quantity: Number(p.quantity),
    avgCostBasis: Number(p.avgCostBasis),
    bookValue: Number(p.bookValue),
    // Current price comes from live Yahoo fetch — use avgCostBasis as fallback
    currentPrice: Number(p.avgCostBasis),
    marketValue: Number(p.bookValue),
    unrealizedGain: 0,
    unrealizedGainPct: 0,
    weight: 0,
    isin: p.instrument.isin,
    sector: p.instrument.sector,
    country: p.instrument.country,
    ter: p.instrument.ter,
  }));
}

// ── Update instrument master data ─────────────────────────────────────────────

export interface MasterDataInput {
  instrumentId: string;
  isin?: string;
  name?: string;
  exchange?: string;
  country?: string;
  sector?: string;
  ter?: number;
  description?: string;
}

export async function updateInstrumentMasterData(input: MasterDataInput) {
  const session = await requireSession();

  // Verify ownership
  const instrument = await db.instrument.findFirst({
    where: { id: input.instrumentId, workspaceId: session.workspaceId },
  });
  if (!instrument) throw new Error("Instrument not found");

  await db.instrument.update({
    where: { id: input.instrumentId },
    data: {
      isin:        input.isin        !== undefined ? input.isin        : instrument.isin,
      name:        input.name        !== undefined ? input.name        : instrument.name,
      exchange:    input.exchange    !== undefined ? input.exchange    : instrument.exchange,
      country:     input.country     !== undefined ? input.country     : instrument.country,
      sector:      input.sector      !== undefined ? input.sector      : instrument.sector,
      ter:         input.ter         !== undefined ? input.ter         : instrument.ter,
      description: input.description !== undefined ? input.description : instrument.description,
    },
  });

  revalidatePath("/dashboard/holdings");
  return { success: true };
}

// ── Delete position ────────────────────────────────────────────────────────────

export async function deletePosition(positionId: string) {
  const session = await requireSession();

  const pos = await db.position.findFirst({
    where: { id: positionId, workspaceId: session.workspaceId },
  });
  if (!pos) throw new Error("Position not found");

  await db.position.delete({ where: { id: positionId } });
  revalidatePath("/dashboard/holdings");
  return { success: true };
}
