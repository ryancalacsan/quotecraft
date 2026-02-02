import { NextResponse } from 'next/server';

import { seedDemoData } from '@/lib/demo-seed';

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

  const demoUserId = process.env.DEMO_USER_ID;
  if (!demoUserId) {
    return NextResponse.json({ error: 'DEMO_USER_ID not configured' }, { status: 503 });
  }

  try {
    await seedDemoData(demoUserId);
    return NextResponse.json({ success: true, message: 'Demo data reset successfully' });
  } catch (err) {
    console.error('Demo reset failed:', err);
    return NextResponse.json({ error: 'Failed to reset demo data' }, { status: 500 });
  }
}
