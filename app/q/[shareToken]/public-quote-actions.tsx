'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { acceptQuote, declineQuote } from '@/app/actions/public-quotes';

interface PublicQuoteActionsProps {
  shareToken: string;
  currentStatus: string;
  isExpired: boolean;
}

export function PublicQuoteActions({ shareToken, currentStatus, isExpired }: PublicQuoteActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (currentStatus !== 'sent') {
    if (currentStatus === 'accepted') {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4 text-center text-sm text-green-800">
            This quote has been accepted. Thank you!
          </CardContent>
        </Card>
      );
    }
    if (currentStatus === 'declined') {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-center text-sm text-red-800">
            This quote has been declined.
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  if (isExpired) {
    return null;
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptQuote(shareToken);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Quote accepted!');
      router.refresh();
    });
  }

  function handleDecline() {
    startTransition(async () => {
      const result = await declineQuote(shareToken);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Quote declined');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <p className="text-sm text-muted-foreground">
          Would you like to accept or decline this quote?
        </p>
        <div className="flex gap-2">
          <Button disabled={isPending} onClick={handleAccept}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {isPending ? 'Processing...' : 'Accept Quote'}
          </Button>
          <Button variant="outline" disabled={isPending} onClick={handleDecline}>
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
