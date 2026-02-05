import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getQuotesByUserId } from '@/lib/db/queries';
import { getAnalytics, getRevenueTimeSeries } from '@/lib/db/queries/analytics';
import { getDemoSessionId } from '@/lib/demo-session';
import { AnalyticsSection } from '@/components/dashboard/analytics-section';
import { QuoteList } from '@/components/dashboard/quote-list';
import { StatsRow } from '@/components/dashboard/stats-row';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const demoSessionId = await getDemoSessionId(userId);

  // Fetch data in parallel
  const [quotes, analytics, revenueTimeSeries] = await Promise.all([
    getQuotesByUserId(userId, demoSessionId),
    getAnalytics(userId, demoSessionId),
    getRevenueTimeSeries(userId, demoSessionId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header with fade-in animation */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="font-display text-2xl tracking-tight">Quotes</h2>
        <p className="text-muted-foreground">Manage your quotes and proposals.</p>
      </div>

      {/* Stats overview row */}
      <StatsRow quotes={quotes} />

      {/* Analytics charts */}
      {quotes.length > 0 && (
        <AnalyticsSection
          revenueData={revenueTimeSeries}
          totalRevenue={analytics.totalRevenue}
          thisMonthRevenue={analytics.thisMonthRevenue}
          revenueChange={analytics.revenueChange}
          quotes={quotes}
        />
      )}

      {/* Quote list */}
      <QuoteList quotes={quotes} />
    </div>
  );
}
