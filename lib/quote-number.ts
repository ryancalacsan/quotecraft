import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { and, eq, isNull, like, sql } from 'drizzle-orm';

/**
 * Generate the next quote number for a user.
 * Format: QC-YYYY-NNNN (e.g., QC-2026-0042) for real users
 * Format: DEMO-{session6}-YYYY-NNNN for demo users
 *
 * Filters by current year so numbering resets each January.
 * Caller should retry on unique constraint violation (race condition).
 */
export async function generateQuoteNumber(
  userId: string,
  demoSessionId: string | null = null,
): Promise<string> {
  const year = new Date().getFullYear();

  // Use session-scoped prefix for demo users to ensure uniqueness
  const prefix = demoSessionId ? `DEMO-${demoSessionId.slice(0, 6)}-${year}-` : `QC-${year}-`;

  const sessionFilter = demoSessionId
    ? eq(quotes.demoSessionId, demoSessionId)
    : isNull(quotes.demoSessionId);

  const result = await db
    .select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .where(and(eq(quotes.userId, userId), sessionFilter, like(quotes.quoteNumber, `${prefix}%`)))
    .orderBy(sql`${quotes.quoteNumber} DESC`)
    .limit(1);

  let nextNumber = 1;

  if (result.length > 0) {
    const lastNumber = result[0].quoteNumber;
    // Match the last numeric segment (works for both QC-YYYY-NNNN and DEMO-xxx-YYYY-NNNN)
    const match = lastNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}
