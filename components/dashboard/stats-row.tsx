'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Calendar, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Quote } from '@/lib/db/schema';

interface StatsRowProps {
  quotes: Quote[];
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 500): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
}

// Single stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  trend?: 'up' | 'down' | 'neutral';
  delay: number;
}) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-lg border border-border/60 bg-card p-3 sm:p-4 paper-texture"
      style={{ animationDelay: `${delay}ms`, animationDuration: '400ms' }}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">{label}</span>
      </div>
      <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-semibold">{value}</span>
        {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-jade" />}
      </div>
      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}

export function StatsRow({ quotes }: StatsRowProps) {
  // Calculate stats
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => q.status === 'sent').length;
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted' || q.status === 'paid').length;

  // This month's quotes
  const now = new Date();
  const thisMonthQuotes = quotes.filter((q) => {
    const created = new Date(q.createdAt!);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  // Conversion rate (accepted+paid / total sent+accepted+paid+declined)
  const actionedQuotes = quotes.filter((q) =>
    ['sent', 'accepted', 'declined', 'paid'].includes(q.status)
  ).length;
  const conversionRate = actionedQuotes > 0 ? Math.round((acceptedQuotes / actionedQuotes) * 100) : 0;

  // Animated values
  const animatedTotal = useAnimatedCounter(totalQuotes);
  const animatedPending = useAnimatedCounter(pendingQuotes);
  const animatedThisMonth = useAnimatedCounter(thisMonthQuotes.length);
  const animatedConversion = useAnimatedCounter(conversionRate);

  // Don't show stats row if no quotes
  if (totalQuotes === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={TrendingUp}
        label="Total Quotes"
        value={animatedTotal.toString()}
        subtext={`${acceptedQuotes} accepted`}
        trend={acceptedQuotes > 0 ? 'up' : 'neutral'}
        delay={0}
      />
      <StatCard
        icon={Clock}
        label="Awaiting"
        value={animatedPending.toString()}
        subtext={pendingQuotes === 1 ? 'quote pending' : 'quotes pending'}
        delay={50}
      />
      <StatCard
        icon={Calendar}
        label="This Month"
        value={animatedThisMonth.toString()}
        subtext={thisMonthQuotes.length === 1 ? 'quote created' : 'quotes created'}
        delay={100}
      />
      <StatCard
        icon={Target}
        label="Conversion"
        value={`${animatedConversion}%`}
        subtext={actionedQuotes > 0 ? `of ${actionedQuotes} sent` : 'no data yet'}
        delay={150}
      />
    </div>
  );
}
