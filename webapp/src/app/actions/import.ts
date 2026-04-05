"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface ImportRow {
  date: string;
  type: string;
  isin: string | null;
  ticker: string | null;
  name: string | null;
  quantity: number;
  price: number;
  amount: number;
  currency: string;
  fees: number;
}

export async function importTransactions(rows: ImportRow[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { workspaceId } = session;
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.date || !["BUY", "SELL", "DIVIDEND", "DEPOSIT", "WITHDRAWAL"].includes(row.type)) {
      skipped++;
      continue;
    }

    try {
      // Find or create account (default brokerage)
      let account = await db.account.findFirst({ where: { workspaceId, type: "BROKERAGE" } });
      if (!account) {
        account = await db.account.create({
          data: { workspaceId, name: "Import", type: "BROKERAGE", currency: row.currency },
        });
      }

      let instrumentId: string | null = null;

      // For BUY/SELL/DIVIDEND, look up or create instrument
      if (["BUY", "SELL", "DIVIDEND"].includes(row.type) && (row.isin || row.ticker || row.name)) {
        let instrument = await db.instrument.findFirst({
          where: {
            workspaceId,
            OR: [
              ...(row.isin   ? [{ isin: row.isin }] : []),
              ...(row.ticker ? [{ ticker: row.ticker.toUpperCase() }] : []),
            ],
          },
        });

        if (!instrument && (row.name || row.ticker)) {
          instrument = await db.instrument.create({
            data: {
              workspaceId,
              ticker: row.ticker?.toUpperCase() ?? null,
              isin: row.isin ?? null,
              name: row.name ?? row.ticker ?? "Unknown",
              assetClass: "STOCK",
              currency: row.currency,
            },
          });
        }
        instrumentId = instrument?.id ?? null;
      }

      // Create transaction
      await db.transaction.create({
        data: {
          workspaceId,
          accountId: account.id,
          instrumentId,
          type: row.type as never,
          quantity: row.quantity > 0 ? row.quantity : null,
          price: row.price > 0 ? row.price : null,
          amount: row.type === "BUY" ? -row.amount : row.amount,
          currency: row.currency,
          fees: row.fees,
          executedAt: new Date(row.date),
          provenance: "import",
          isVerified: false,
        },
      });

      // Update position for BUY/SELL
      if (instrumentId && row.quantity > 0 && row.price > 0) {
        if (row.type === "BUY") {
          const existing = await db.position.findFirst({
            where: { accountId: account.id, instrumentId },
          });
          const bookValue = row.quantity * row.price;
          if (existing) {
            const newQty = Number(existing.quantity) + row.quantity;
            const newBook = Number(existing.bookValue) + bookValue;
            await db.position.update({
              where: { id: existing.id },
              data: { quantity: newQty, bookValue: newBook, avgCostBasis: newBook / newQty },
            });
          } else {
            await db.position.create({
              data: {
                workspaceId,
                accountId: account.id,
                instrumentId,
                quantity: row.quantity,
                avgCostBasis: row.price,
                bookValue: row.quantity * row.price,
                currency: row.currency,
                openedAt: new Date(row.date),
              },
            });
          }
        } else if (row.type === "SELL") {
          const existing = await db.position.findFirst({
            where: { accountId: account.id, instrumentId },
          });
          if (existing) {
            const newQty = Math.max(Number(existing.quantity) - row.quantity, 0);
            const newBook = newQty * Number(existing.avgCostBasis);
            if (newQty === 0) {
              await db.position.delete({ where: { id: existing.id } });
            } else {
              await db.position.update({
                where: { id: existing.id },
                data: { quantity: newQty, bookValue: newBook },
              });
            }
          }
        }
      }

      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/dashboard/holdings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");

  return { imported, skipped };
}
