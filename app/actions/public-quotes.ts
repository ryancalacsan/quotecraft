'use server';

import { and, eq, isNull, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';

const shareTokenSchema = z.string().min(1).max(30).regex(/^[A-Za-z0-9_-]+$/);

/**
 * Atomically updates a quote's status via shareToken.
 * Uses WHERE status = 'sent' to prevent race conditions (TOCTOU).
 * Also checks expiration at the application level before updating.
 */
async function transitionSentQuote(shareToken: string, newStatus: 'accepted' | 'declined') {
  const parsed = shareTokenSchema.safeParse(shareToken);
  if (!parsed.success) return { error: 'Invalid share token' };

  // Fetch quote to check expiration (can't easily do date comparison in Drizzle WHERE)
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.shareToken, parsed.data),
  });

  if (!quote) return { error: 'Quote not found' };
  if (quote.status !== 'sent') return { error: 'Quote is no longer available for response' };

  const isExpired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;
  if (isExpired) return { error: 'This quote has expired' };

  // Atomic update: WHERE includes status = 'sent' to prevent race conditions
  const [updated] = await db
    .update(quotes)
    .set({
      status: newStatus,
      version: quote.version + 1,
    })
    .where(and(eq(quotes.id, quote.id), eq(quotes.status, 'sent')))
    .returning({ id: quotes.id });

  if (!updated) return { error: 'Quote is no longer available for response' };

  revalidatePath(`/q/${shareToken}`);
  revalidatePath(`/quotes/${quote.id}`);
  revalidatePath('/dashboard');

  return { success: true };
}

export async function acceptQuote(shareToken: string) {
  return transitionSentQuote(shareToken, 'accepted');
}

export async function declineQuote(shareToken: string) {
  return transitionSentQuote(shareToken, 'declined');
}
