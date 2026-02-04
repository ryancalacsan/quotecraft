import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getQuotesByUserId } from '@/lib/db/queries';
import { getDemoSessionId } from '@/lib/demo-session';
import { QuoteList } from '@/components/dashboard/quote-list';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const demoSessionId = await getDemoSessionId(userId);
  const quotes = await getQuotesByUserId(userId, demoSessionId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quotes</h2>
        <p className="text-muted-foreground">Manage your quotes and proposals.</p>
      </div>
      <QuoteList quotes={quotes} />
    </div>
  );
}
