import { NextResponse } from 'next/server';
import { isNotNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';

/**
 * Cron job to clean up all demo session data.
 * Deletes all quotes with a demoSessionId (cascade deletes line items).
 * Fresh data is seeded when users start a new demo session.
 */
export async function POST(req: Request) {
  // Verify cron secret to prevent unauthorized resets
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete ALL demo quotes (those with any demoSessionId)
    await db.delete(quotes).where(isNotNull(quotes.demoSessionId));
    return NextResponse.json({
      success: true,
      message: 'Demo data cleaned up successfully',
    });
  } catch (err) {
    console.error('Demo cleanup failed:', err);
    return NextResponse.json({ error: 'Failed to clean up demo data' }, { status: 500 });
  }
}
