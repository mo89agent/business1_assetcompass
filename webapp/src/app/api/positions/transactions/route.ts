import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker") ?? "";
  if (!ticker) return NextResponse.json({ transactions: [] });

  const session = await getSession();
  if (!session) return NextResponse.json({ transactions: [] });

  try {
    const txs = await db.transaction.findMany({
      where: {
        workspaceId: session.workspaceId,
        type: { in: ["BUY", "SELL"] },
        isDeleted: false,
        instrument: { ticker: { equals: ticker.toUpperCase() } },
      },
      orderBy: { executedAt: "asc" },
      include: { instrument: true },
    });

    return NextResponse.json({
      transactions: txs.map((t) => ({
        id: t.id,
        type: t.type,
        date: t.executedAt.toISOString().split("T")[0],
        quantity: Number(t.quantity ?? 0),
        price: Number(t.price ?? 0),
        amount: Number(t.amount),
        currency: t.currency,
        notes: t.notes ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
