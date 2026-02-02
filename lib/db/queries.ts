import { and, eq } from 'drizzle-orm';

import { db } from '.';
import { quotes, lineItems } from './schema';

export async function getQuotesByUserId(userId: string) {
  return db.query.quotes.findMany({
    where: eq(quotes.userId, userId),
    orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
  });
}

/** Fetches a quote only if it belongs to the given user. */
export async function getQuoteById(quoteId: string, userId: string) {
  return db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.userId, userId)),
  });
}

/** Fetches a quote by share token (public, no auth required). */
export async function getQuoteByShareToken(shareToken: string) {
  return db.query.quotes.findFirst({
    where: eq(quotes.shareToken, shareToken),
  });
}

export async function getLineItemsByQuoteId(quoteId: string) {
  return db.query.lineItems.findMany({
    where: eq(lineItems.quoteId, quoteId),
    orderBy: (lineItems, { asc }) => [asc(lineItems.sortOrder)],
  });
}
