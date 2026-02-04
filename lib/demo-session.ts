import { cookies } from 'next/headers';

const DEMO_USER_ID = process.env.DEMO_USER_ID;

/**
 * Gets the demo session ID for demo users.
 * Returns null for real users (their quotes have demoSessionId = null).
 */
export async function getDemoSessionId(userId: string): Promise<string | null> {
  if (!DEMO_USER_ID || userId !== DEMO_USER_ID) return null;
  const cookieStore = await cookies();
  return cookieStore.get('demo_session_id')?.value ?? null;
}
