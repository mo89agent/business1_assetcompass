import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MarketDetailShell } from "@/components/market/MarketDetailShell";

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol } = await params;
  return { title: `${symbol} — Marktdaten` };
}

export default async function MarketPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { symbol } = await params;

  return (
    <div className="max-w-5xl mx-auto">
      <MarketDetailShell symbol={decodeURIComponent(symbol)} />
    </div>
  );
}
