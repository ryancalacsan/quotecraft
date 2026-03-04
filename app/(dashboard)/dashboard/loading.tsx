import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-2 h-1 w-12" />
        <Skeleton className="mt-3 h-4 w-52" />
      </div>

      {/* Stats row — 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-border/60 bg-card rounded-lg border p-3 sm:p-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-2 h-7 w-10" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Filter tabs — 2 col mobile, flex wrap desktop */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full sm:w-24" />
        ))}
      </div>

      {/* Quote cards — single column */}
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
