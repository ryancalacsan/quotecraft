import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '.';
import { users, quotes, lineItems } from './schema';

/**
 * Ensures the Clerk user exists in our DB.
 * Needed until the Clerk webhook is operational (requires deployed URL).
 */
export async function ensureUserExists(userId: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error('Unable to fetch current user from Clerk');

  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      businessName: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null,
    })
    .onConflictDoNothing()
    .returning();

  return newUser ?? (await db.query.users.findFirst({ where: eq(users.id, userId) }));
}

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
