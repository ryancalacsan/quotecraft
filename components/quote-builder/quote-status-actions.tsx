'use client';

import { useTransition } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { updateQuoteStatus } from '@/app/actions/quotes';

interface QuoteStatusActionsProps {
  quoteId: string;
  currentStatus: string;
}

export function QuoteStatusActions({ quoteId, currentStatus }: QuoteStatusActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateQuoteStatus(quoteId, newStatus);
      toast.success(`Quote marked as ${newStatus}`);
    });
  }

  return (
    <>
      {currentStatus === 'draft' && (
        <Button size="sm" disabled={isPending} onClick={() => handleStatusChange('sent')}>
          <Send className="mr-2 h-4 w-4" />
          {isPending ? 'Sending...' : 'Mark as Sent'}
        </Button>
      )}
      {currentStatus === 'sent' && (
        <div className="flex gap-2">
          <Button size="sm" disabled={isPending} onClick={() => handleStatusChange('accepted')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => handleStatusChange('declined')}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      )}
    </>
  );
}
