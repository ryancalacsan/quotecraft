'use client';

import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Quote } from '@/lib/db/schema';

// Skeleton that matches the chart cards layout
function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue chart skeleton */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
        style={{ animationDelay: '200ms', animationDuration: '400ms' }}
      >
        <Card className="paper-texture">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-8 w-28" />
              <Skeleton className="ml-auto h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Status chart skeleton */}
      <div
        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
        style={{ animationDelay: '275ms', animationDuration: '400ms' }}
      >
        <Card className="paper-texture">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-1 h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-18" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dynamically import AnalyticsSection to lazy load Recharts
const AnalyticsSection = dynamic(
  () => import('./analytics-section').then((mod) => mod.AnalyticsSection),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false, // Disable SSR to prevent hydration mismatch with charts
  },
);

interface LazyAnalyticsSectionProps {
  revenueData: { date: string; revenue: number }[];
  totalRevenue: number;
  thisMonthRevenue: number;
  revenueChange: number;
  quotes: Quote[];
}

export function LazyAnalyticsSection(props: LazyAnalyticsSectionProps) {
  return <AnalyticsSection {...props} />;
}
