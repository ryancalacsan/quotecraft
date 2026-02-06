'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { DollarSign } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
  totalRevenue: number;
  thisMonthRevenue: number;
  revenueChange: number;
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--color-gold)',
  },
} satisfies ChartConfig;

export function RevenueChart({
  data,
  totalRevenue,
  thisMonthRevenue,
  revenueChange,
}: RevenueChartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const hasRevenue = data.some((d) => d.revenue > 0);

  return (
    <Card className="paper-texture">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <DollarSign className="text-gold h-4 w-4" />
            Revenue
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
          <p className="text-muted-foreground text-xs">
            {formatCurrency(thisMonthRevenue)} this month
            {revenueChange !== 0 && (
              <span className={revenueChange > 0 ? 'text-jade ml-1' : 'text-destructive ml-1'}>
                ({revenueChange > 0 ? '+' : ''}
                {revenueChange.toFixed(0)}%)
              </span>
            )}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasRevenue ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={60}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {formatCurrency(value as number)}
                      </span>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill="url(#fillRevenue)"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground text-sm">No revenue data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
