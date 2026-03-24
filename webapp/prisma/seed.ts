// Seed file — creates a demo workspace with realistic data
// Run with: npx prisma db seed
// Requires: DATABASE_URL pointing to a running PostgreSQL instance

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding demo workspace...");

  // Clean up existing demo data
  const existing = await db.workspace.findFirst({ where: { slug: "demo-family" } });
  if (existing) {
    await db.workspace.delete({ where: { id: existing.id } });
  }
  const existingUser = await db.user.findFirst({ where: { email: "demo@assetcompass.app" } });
  if (existingUser) {
    await db.user.delete({ where: { id: existingUser.id } });
  }

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const user = await db.user.create({
    data: {
      name: "Max Müller",
      email: "demo@assetcompass.app",
      passwordHash,
    },
  });

  // Create workspace
  const workspace = await db.workspace.create({
    data: {
      name: "Müller Family",
      slug: "demo-family",
      currency: "EUR",
      country: "DE",
    },
  });

  // Add user as owner
  await db.workspaceMember.create({
    data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });

  // Create entities
  const personal = await db.entity.create({
    data: { workspaceId: workspace.id, name: "Max Müller (personal)", type: "INDIVIDUAL", country: "DE" },
  });
  await db.entity.create({
    data: { workspaceId: workspace.id, name: "Müller GmbH", type: "COMPANY", country: "DE" },
  });

  // Create accounts
  const flatexDepot = await db.account.create({
    data: { workspaceId: workspace.id, entityId: personal.id, name: "Flatex Depot", type: "BROKERAGE", currency: "EUR", institution: "Flatex" },
  });
  const tradeRepublic = await db.account.create({
    data: { workspaceId: workspace.id, entityId: personal.id, name: "Trade Republic", type: "BROKERAGE", currency: "EUR", institution: "Trade Republic" },
  });
  const dkbCash = await db.account.create({
    data: { workspaceId: workspace.id, entityId: personal.id, name: "DKB Tagesgeld", type: "SAVINGS_ACCOUNT", currency: "EUR", institution: "DKB" },
  });
  const coinbaseAccount = await db.account.create({
    data: { workspaceId: workspace.id, entityId: personal.id, name: "Coinbase", type: "CRYPTO_EXCHANGE", currency: "USD", institution: "Coinbase" },
  });
  const propertyAccount = await db.account.create({
    data: { workspaceId: workspace.id, entityId: personal.id, name: "Berliner Str. 12", type: "PROPERTY", currency: "EUR" },
  });
  const loanAccount = await db.account.create({
    data: { workspaceId: workspace.id, entityId: personal.id, name: "DKB Mortgage", type: "LOAN_ACCOUNT", currency: "EUR", institution: "DKB" },
  });

  // Create property
  await db.property.create({
    data: {
      accountId: propertyAccount.id,
      address: "Berliner Str. 12",
      city: "Berlin",
      postalCode: "10115",
      country: "DE",
      propertyType: "residential",
      usageType: "rental",
      units: 1,
      floorAreaSqm: 72,
      buildYear: 1998,
      energyClass: "C",
      acquisitionDate: new Date("2021-03-15"),
      acquisitionPrice: 320000,
      acquisitionCurrency: "EUR",
      ancillaryCosts: 24000,
      currentValue: 385000,
      currentValueDate: new Date("2025-12-01"),
      targetRentMonthly: 1450,
      actualRentMonthly: 1450,
      vacancyRate: 0,
      operatingCostsMonthly: 280,
      maintenanceReserve: 120,
    },
  });

  // Create loan details
  await db.loanDetails.create({
    data: {
      accountId: loanAccount.id,
      lenderName: "DKB",
      loanType: "mortgage",
      principalOriginal: 256000,
      principalRemaining: 198000,
      currency: "EUR",
      interestRate: 0.0185,
      isFixedRate: true,
      fixedRateUntil: new Date("2026-05-01"),
      monthlyPayment: 1820,
      amortizationYears: 25,
      startDate: new Date("2021-04-01"),
      ltv: 0.8,
    },
  });

  // Create instruments
  const vwrl = await db.instrument.create({
    data: { workspaceId: workspace.id, isin: "IE00B3RBWM25", ticker: "VWRL", name: "Vanguard FTSE All-World UCITS ETF", assetClass: "ETF", currency: "EUR", ter: 0.22 },
  });
  const msft = await db.instrument.create({
    data: { workspaceId: workspace.id, isin: "US5949181045", ticker: "MSFT", name: "Microsoft Corp.", assetClass: "STOCK", currency: "USD", country: "US", sector: "Technology" },
  });
  const btc = await db.instrument.create({
    data: { workspaceId: workspace.id, ticker: "BTC", name: "Bitcoin", assetClass: "CRYPTO", currency: "USD", network: "Bitcoin" },
  });

  // Create tax policy
  await db.taxPolicy.create({
    data: { workspaceId: workspace.id, name: "Germany — Abgeltungsteuer 2025", country: "DE", year: 2025, isActive: true },
  });

  // Create forecast assumption
  await db.forecastAssumption.create({
    data: { workspaceId: workspace.id, name: "Base Case 2025", isDefault: true },
  });

  // Create some transactions
  await db.transaction.createMany({
    data: [
      {
        workspaceId: workspace.id,
        accountId: flatexDepot.id,
        instrumentId: vwrl.id,
        type: "BUY",
        quantity: 420,
        price: 98.5,
        amount: -41370,
        currency: "EUR",
        fees: 5.9,
        executedAt: new Date("2022-06-15"),
        provenance: "manual",
        isVerified: true,
      },
      {
        workspaceId: workspace.id,
        accountId: flatexDepot.id,
        instrumentId: msft.id,
        type: "BUY",
        quantity: 85,
        price: 295,
        amount: -25075,
        currency: "USD",
        fees: 3.9,
        executedAt: new Date("2022-09-20"),
        provenance: "manual",
        isVerified: true,
      },
      {
        workspaceId: workspace.id,
        accountId: dkbCash.id,
        type: "DEPOSIT",
        amount: 85000,
        currency: "EUR",
        executedAt: new Date("2023-01-10"),
        description: "Initial savings deposit",
        provenance: "manual",
        isVerified: true,
      },
      {
        workspaceId: workspace.id,
        accountId: coinbaseAccount.id,
        instrumentId: btc.id,
        type: "BUY",
        quantity: 0.85,
        price: 38000,
        amount: -32300,
        currency: "USD",
        fees: 12.5,
        executedAt: new Date("2023-03-05"),
        provenance: "manual",
        isVerified: true,
      },
    ],
  });

  // Create alerts
  await db.alert.createMany({
    data: [
      {
        workspaceId: workspace.id,
        type: "EXPIRING_FIXED_RATE",
        severity: "CRITICAL",
        title: "Fixed rate expiring in 47 days",
        message: "Mortgage on Berliner Str. 12 resets on 2026-05-01. Plan for refinancing.",
        accountId: loanAccount.id,
        isRead: false,
      },
      {
        workspaceId: workspace.id,
        type: "MISSING_COST_BASIS",
        severity: "WARNING",
        title: "Missing cost basis",
        message: "3 positions are missing acquisition cost data. This affects tax calculations.",
        isRead: false,
      },
      {
        workspaceId: workspace.id,
        type: "CONCENTRATION_RISK",
        severity: "INFO",
        title: "Sector concentration: Technology",
        message: "Technology represents 36% of equity portfolio.",
        isRead: true,
      },
    ],
  });

  console.log("✅ Demo workspace created");
  console.log("   Email: demo@assetcompass.app");
  console.log("   Password: demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
