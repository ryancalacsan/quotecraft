import { NextResponse, type NextRequest } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { seedDemoData } from '@/lib/demo-seed';

// In-memory rate limiter: 10 requests per IP per hour
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Purge expired entries to prevent unbounded memory growth
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }

  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  const demoUserId = process.env.DEMO_USER_ID;

  if (!demoUserId) {
    return NextResponse.json({ error: 'Demo mode is not configured' }, { status: 503 });
  }

  try {
    const client = await clerkClient();

    // Ensure demo user exists in our database
    const clerkUser = await client.users.getUser(demoUserId);
    await db
      .insert(users)
      .values({
        id: demoUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? 'demo@quotecraft.dev',
        businessName:
          `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Demo User',
      })
      .onConflictDoNothing();

    // Generate unique session ID for this demo user
    const sessionId = nanoid();

    // Seed demo data scoped to this session
    await seedDemoData(demoUserId, sessionId);

    const signInToken = await client.signInTokens.createSignInToken({
      userId: demoUserId,
      expiresInSeconds: 3600, // 1 hour
    });

    return NextResponse.json({ token: signInToken.token, sessionId });
  } catch (err) {
    console.error('Failed to create demo sign-in token:', err);
    return NextResponse.json({ error: 'Failed to start demo session' }, { status: 500 });
  }
}
