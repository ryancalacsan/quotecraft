'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { QuoteCard } from './quote-card';
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/lib/constants';
import type { Quote } from '@/lib/db/schema';

const FILTER_OPTIONS = ['all', ...QUOTE_STATUSES] as const;

export function QuoteList({ quotes }: { quotes: Quote[] }) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter);

  return (
    <div className="space-y-6">
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {FILTER_OPTIONS.map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : QUOTE_STATUS_LABELS[status]}
            {status === 'all'
              ? ` (${quotes.length})`
              : ` (${quotes.filter((q) => q.status === status).length})`}
          </Button>
        ))}
      </div>

      {/* Quote list or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">
            {quotes.length === 0 ? 'No quotes yet' : 'No matching quotes'}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {quotes.length === 0
              ? 'Create your first quote to get started.'
              : 'Try a different filter.'}
          </p>
          {quotes.length === 0 && (
            <Link href="/quotes/new">
              <Button>Create Quote</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}
