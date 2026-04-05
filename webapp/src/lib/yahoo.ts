/**
 * Singleton yahoo-finance2 instance.
 *
 * yahoo-finance2 v3+ changed from a default-exported singleton to a class
 * that must be instantiated with `new`.  Import from this file everywhere
 * instead of importing yahoo-finance2 directly.
 */
import YahooFinanceClass from "yahoo-finance2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const yahooFinance = new (YahooFinanceClass as any)();
