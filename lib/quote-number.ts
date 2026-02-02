import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { and, eq, like, sql } from 'drizzle-orm';

/**
 * Generate the next quote number for a user.
 * Format: QC-YYYY-NNNN (e.g., QC-2026-0042)
 *
 * Filters by current year so numbering resets each January.
 * Caller should retry on unique constraint violation (race condition).
 */
export async function generateQuoteNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QC-${year}-`;

  const result = await db
    .select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .where(and(eq(quotes.userId, userId), like(quotes.quoteNumber, `${prefix}%`)))
    .orderBy(sql`${quotes.quoteNumber} DESC`)
    .limit(1);

  let nextNumber = 1;

  if (result.length > 0) {
    const lastNumber = result[0].quoteNumber;
    const match = lastNumber.match(/QC-\d{4}-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}
