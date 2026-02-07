'use client';

import { RevenueChart } from './revenue-chart';
import { StatusChart } from './status-chart';
import type { Quote, QuoteStatus } from '@/lib/db/schema';

interface AnalyticsSectionProps {
  revenueData: { date: string; revenue: number }[];
  totalRevenue: number;
  thisMonthRevenue: number;
  revenueChange: number;
  quotes: Quote[];
}

export function AnalyticsSection({
  revenueData,
  totalRevenue,
  thisMonthRevenue,
  revenueChange,
  quotes,
}: AnalyticsSectionProps) {
  // Calculate status counts
  const statusCounts = quotes.reduce(
    (acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    },
    {} as Record<QuoteStatus, number>,
  );

  // Ensure all statuses have a count (even if 0)
  const allStatuses: QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'paid'];
  for (const status of allStatuses) {
    if (!(status in statusCounts)) {
      statusCounts[status] = 0;
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div
        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
        style={{ animationDelay: '200ms', animationDuration: '400ms' }}
      >
        <RevenueChart
          data={revenueData}
          totalRevenue={totalRevenue}
          thisMonthRevenue={thisMonthRevenue}
          revenueChange={revenueChange}
        />
      </div>
      <div
        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
        style={{ animationDelay: '275ms', animationDuration: '400ms' }}
      >
        <StatusChart statusCounts={statusCounts} />
      </div>
    </div>
  );
}
