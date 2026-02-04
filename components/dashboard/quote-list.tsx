'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { QuoteCard } from './quote-card';
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/lib/constants';
import { STAGGER_DELAY } from '@/lib/animations';
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
        quotes.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="Your first quote awaits"
            description="Create a professional quote in minutes. Add line items, set pricing, and share with your client."
            action={
              <Link href="/quotes/new">
                <Button variant="gold" size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Quote
                </Button>
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={<Search />}
            title="No matching quotes"
            description="No quotes match the selected filter. Try selecting a different status."
          />
        )
      ) : (
        <div className="grid gap-4">
          {filtered.map((quote, index) => (
            <div
              key={quote.id}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{
                animationDelay: `${200 + index * STAGGER_DELAY}ms`,
                animationDuration: '400ms',
              }}
            >
              <QuoteCard quote={quote} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
