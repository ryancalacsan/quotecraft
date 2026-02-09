'use client';

import { useTransition } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { updateQuoteStatus } from '@/app/actions/quotes';
import { SendQuoteModal } from './send-quote-modal';

interface QuoteStatusActionsProps {
  quoteId: string;
  currentStatus: string;
  shareToken: string;
  fullWidthMobile?: boolean;
}

export function QuoteStatusActions({
  quoteId,
  currentStatus,
  shareToken,
  fullWidthMobile,
}: QuoteStatusActionsProps) {
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
        <SendQuoteModal
          quoteId={quoteId}
          shareToken={shareToken}
          fullWidthMobile={fullWidthMobile}
        />
      )}
      {currentStatus === 'sent' && (
        <div className={`flex gap-2 ${fullWidthMobile ? 'w-full md:w-auto' : ''}`}>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => handleStatusChange('accepted')}
            className={fullWidthMobile ? 'flex-1 md:flex-none' : ''}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => handleStatusChange('declined')}
            className={fullWidthMobile ? 'flex-1 md:flex-none' : ''}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Decline
          </Button>
        </div>
      )}
    </>
  );
}
