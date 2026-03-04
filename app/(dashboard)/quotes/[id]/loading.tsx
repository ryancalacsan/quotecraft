import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function QuoteViewLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-3 rounded-none" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Header — stacked on mobile, row on desktop */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-1 w-12" />
          <Skeleton className="h-4 w-28" />
        </div>
        {/* Action buttons */}
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <Skeleton className="h-9 w-full md:w-16" />
          <Skeleton className="h-9 w-full md:w-32" />
          <Skeleton className="h-9 w-full md:w-28" />
        </div>
      </div>

      {/* Share link card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </CardContent>
      </Card>

      {/* Client info card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line items card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Desktop column headers */}
            <div className="hidden grid-cols-12 gap-2 md:grid">
              {[4, 2, 2, 1, 1, 2].map((span, i) => (
                <Skeleton key={i} className={`col-span-${span} h-4`} />
              ))}
            </div>
            <div className="bg-border hidden h-px md:block" />

            {/* Line item rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                {/* Desktop row */}
                <div className="hidden grid-cols-12 items-center gap-2 md:grid">
                  <Skeleton className="col-span-4 h-5" />
                  <Skeleton className="col-span-2 h-5" />
                  <Skeleton className="col-span-2 h-5" />
                  <Skeleton className="col-span-1 h-5" />
                  <Skeleton className="col-span-1 h-5" />
                  <Skeleton className="col-span-2 h-5" />
                </div>
                {/* Mobile card */}
                <div className="space-y-1 rounded-lg border p-3 md:hidden">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}

            <div className="bg-border h-px" />

            {/* Pricing summary */}
            <div className="ml-auto w-full space-y-2 sm:w-64">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="bg-border h-px" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
