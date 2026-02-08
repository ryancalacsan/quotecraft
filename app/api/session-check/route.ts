import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Simple endpoint to verify the session is recognized server-side.
 * Used by the demo login flow to confirm the session cookie is set
 * before navigating to protected routes.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
