import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getQuotesByUserId } from '@/lib/db/queries';
import { getDemoSessionId } from '@/lib/demo-session';
import { QuoteList } from '@/components/dashboard/quote-list';
import { StatsRow } from '@/components/dashboard/stats-row';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const demoSessionId = await getDemoSessionId(userId);
  const quotes = await getQuotesByUserId(userId, demoSessionId);

  return (
    <div className="space-y-6">
      {/* Header with fade-in animation */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="font-display text-2xl tracking-tight">Quotes</h2>
        <p className="text-muted-foreground">Manage your quotes and proposals.</p>
      </div>

      {/* Stats overview row */}
      <StatsRow quotes={quotes} />

      {/* Quote list */}
      <QuoteList quotes={quotes} />
    </div>
  );
}
