'use client';

import { Pie, PieChart, Cell } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { QuoteStatus } from '@/lib/db/schema';

interface StatusChartProps {
  statusCounts: Record<QuoteStatus, number>;
}

const statusConfig: Record<QuoteStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'oklch(0.55 0.02 250)' },
  sent: { label: 'Sent', color: 'oklch(0.55 0.2 250)' },
  accepted: { label: 'Accepted', color: 'oklch(0.65 0.13 165)' }, // jade
  declined: { label: 'Declined', color: 'oklch(0.55 0.2 25)' },
  paid: { label: 'Paid', color: 'oklch(0.75 0.12 85)' }, // gold
};

const chartConfig = Object.fromEntries(
  Object.entries(statusConfig).map(([key, value]) => [
    key,
    { label: value.label, color: value.color },
  ]),
) satisfies ChartConfig;

export function StatusChart({ statusCounts }: StatusChartProps) {
  const data = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      label: statusConfig[status as QuoteStatus].label,
      fill: statusConfig[status as QuoteStatus].color,
    }));

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <Card className="paper-texture">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <PieChartIcon className="text-muted-foreground h-4 w-4" />
            Quote Status
          </CardTitle>
          <CardDescription>Distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground text-sm">No quotes yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="paper-texture">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <PieChartIcon className="text-muted-foreground h-4 w-4" />
          Quote Status
        </CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `${value} quote${value === 1 ? '' : 's'}`,
                      statusConfig[name as QuoteStatus]?.label || name,
                    ]}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col gap-2">
            {data.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-muted-foreground text-sm">{item.label}</span>
                <span className="font-mono text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
