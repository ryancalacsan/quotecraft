'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { acceptQuote, declineQuote } from '@/app/actions/public-quotes';

interface PublicQuoteActionsProps {
  shareToken: string;
  currentStatus: string;
  isExpired: boolean;
  paymentAmount?: string;
  paymentLabel?: string;
  testCardInfo?: boolean;
}

export function PublicQuoteActions({
  shareToken,
  currentStatus,
  isExpired,
  paymentAmount,
  paymentLabel,
  testCardInfo,
}: PublicQuoteActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (currentStatus === 'paid') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4 text-center text-sm text-green-800">
          This quote has been paid. Thank you!
        </CardContent>
      </Card>
    );
  }

  if (currentStatus === 'accepted') {
    return (
      <div className="space-y-2">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-green-800">
              This quote has been accepted.
              {paymentAmount && ' You can now proceed with payment.'}
            </p>
            {paymentAmount && (
              <Button
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ shareToken }),
                    });
                    const data = await res.json();
                    if (data.error) {
                      toast.error(data.error);
                      return;
                    }
                    window.location.href = data.url;
                  });
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isPending ? 'Redirecting...' : `Pay ${paymentLabel} (${paymentAmount})`}
              </Button>
            )}
          </CardContent>
        </Card>
        {testCardInfo && paymentAmount && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Test mode — use card{' '}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
              4242 4242 4242 4242
            </code>
            , any future expiry, any CVC.
          </div>
        )}
      </div>
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

  if (currentStatus !== 'sent' || isExpired) {
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
        <p className="text-muted-foreground text-sm">
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
