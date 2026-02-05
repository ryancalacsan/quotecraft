import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import Decimal from 'decimal.js';

import { db } from '..';
import { quotes, lineItems } from '../schema';

/**
 * Get analytics data for a user's quotes
 * Includes revenue metrics and time series data
 */
export async function getAnalytics(userId: string, demoSessionId: string | null = null) {
  const sessionFilter = demoSessionId
    ? eq(quotes.demoSessionId, demoSessionId)
    : isNull(quotes.demoSessionId);

  // Get all quotes with their line item totals
  const quotesWithTotals = await db
    .select({
      id: quotes.id,
      status: quotes.status,
      createdAt: quotes.createdAt,
      paidAt: quotes.paidAt,
      total: sql<string>`COALESCE(SUM(
        ${lineItems.rate}::numeric * ${lineItems.quantity}::numeric * (1 - ${lineItems.discount}::numeric / 100)
      ), 0)`,
    })
    .from(quotes)
    .leftJoin(lineItems, eq(quotes.id, lineItems.quoteId))
    .where(and(eq(quotes.userId, userId), sessionFilter))
    .groupBy(quotes.id);

  // Calculate metrics using Decimal.js for monetary precision
  const paidQuotes = quotesWithTotals.filter((q) => q.status === 'paid');
  const acceptedQuotes = quotesWithTotals.filter(
    (q) => q.status === 'accepted' || q.status === 'paid',
  );

  const totalRevenue = paidQuotes
    .reduce((sum, q) => sum.plus(q.total || '0'), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
  const acceptedValue = acceptedQuotes
    .reduce((sum, q) => sum.plus(q.total || '0'), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
  const averageQuoteValue =
    quotesWithTotals.length > 0
      ? quotesWithTotals
          .reduce((sum, q) => sum.plus(q.total || '0'), new Decimal(0))
          .dividedBy(quotesWithTotals.length)
          .toDecimalPlaces(2)
          .toNumber()
      : 0;

  // This month vs last month revenue
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthRevenue = paidQuotes
    .filter((q) => q.paidAt && new Date(q.paidAt) >= thisMonthStart)
    .reduce((sum, q) => sum.plus(q.total || '0'), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();

  const lastMonthRevenue = paidQuotes
    .filter((q) => {
      if (!q.paidAt) return false;
      const paidDate = new Date(q.paidAt);
      return paidDate >= lastMonthStart && paidDate < thisMonthStart;
    })
    .reduce((sum, q) => sum.plus(q.total || '0'), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();

  return {
    totalRevenue,
    acceptedValue,
    averageQuoteValue,
    thisMonthRevenue,
    lastMonthRevenue,
    revenueChange:
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
          ? 100
          : 0,
    quotesWithTotals,
  };
}

/**
 * Get revenue time series for charts (last 30 days)
 */
export async function getRevenueTimeSeries(userId: string, demoSessionId: string | null = null) {
  const sessionFilter = demoSessionId
    ? eq(quotes.demoSessionId, demoSessionId)
    : isNull(quotes.demoSessionId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get paid quotes with their totals from the last 30 days
  const recentPaidQuotes = await db
    .select({
      paidAt: quotes.paidAt,
      total: sql<string>`COALESCE(SUM(
        ${lineItems.rate}::numeric * ${lineItems.quantity}::numeric * (1 - ${lineItems.discount}::numeric / 100)
      ), 0)`,
    })
    .from(quotes)
    .leftJoin(lineItems, eq(quotes.id, lineItems.quoteId))
    .where(
      and(
        eq(quotes.userId, userId),
        sessionFilter,
        eq(quotes.status, 'paid'),
        gte(quotes.paidAt, thirtyDaysAgo),
      ),
    )
    .groupBy(quotes.id, quotes.paidAt);

  // Create a map of date -> revenue (using Decimal.js for precision)
  const revenueByDate = new Map<string, Decimal>();

  // Initialize all 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    revenueByDate.set(dateStr, new Decimal(0));
  }

  // Fill in actual revenue
  for (const quote of recentPaidQuotes) {
    if (quote.paidAt) {
      const dateStr = new Date(quote.paidAt).toISOString().split('T')[0];
      const existing = revenueByDate.get(dateStr) || new Decimal(0);
      revenueByDate.set(dateStr, existing.plus(quote.total || '0'));
    }
  }

  // Convert to array for chart
  return Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
    date,
    revenue: revenue.toDecimalPlaces(2).toNumber(),
  }));
}

/**
 * Get quotes created time series for charts (last 30 days)
 */
export async function getQuotesTimeSeries(userId: string, demoSessionId: string | null = null) {
  const sessionFilter = demoSessionId
    ? eq(quotes.demoSessionId, demoSessionId)
    : isNull(quotes.demoSessionId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentQuotes = await db
    .select({
      createdAt: quotes.createdAt,
      status: quotes.status,
    })
    .from(quotes)
    .where(and(eq(quotes.userId, userId), sessionFilter, gte(quotes.createdAt, thirtyDaysAgo)));

  // Create a map of date -> count
  const quotesByDate = new Map<string, number>();

  // Initialize all 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    quotesByDate.set(dateStr, 0);
  }

  // Fill in actual counts
  for (const quote of recentQuotes) {
    const dateStr = new Date(quote.createdAt).toISOString().split('T')[0];
    const existing = quotesByDate.get(dateStr) || 0;
    quotesByDate.set(dateStr, existing + 1);
  }

  // Convert to array for chart
  return Array.from(quotesByDate.entries()).map(([date, count]) => ({
    date,
    quotes: count,
  }));
}
