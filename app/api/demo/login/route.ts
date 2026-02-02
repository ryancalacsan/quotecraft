import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { seedDemoData } from '@/lib/demo-seed';

export async function POST() {
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

    // Seed demo data so the user has quotes to explore
    await seedDemoData(demoUserId);

    const signInToken = await client.signInTokens.createSignInToken({
      userId: demoUserId,
      expiresInSeconds: 3600, // 1 hour
    });

    return NextResponse.json({ token: signInToken.token });
  } catch (err) {
    console.error('Failed to create demo sign-in token:', err);
    return NextResponse.json({ error: 'Failed to start demo session' }, { status: 500 });
  }
}
