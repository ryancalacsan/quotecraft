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
      <Card className="border-jade/30 bg-jade/5">
        <CardContent className="py-6 text-center space-y-2">
          <CheckCircle className="h-8 w-8 mx-auto text-jade" />
          <p className="text-jade font-medium">Payment Received</p>
          <p className="text-sm text-muted-foreground">
            This quote has been paid in full. Thank you for your business!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (currentStatus === 'accepted') {
    return (
      <div className="space-y-3">
        <Card className="border-jade/30 bg-jade/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <CheckCircle className="h-6 w-6 text-jade shrink-0" />
                <div>
                  <p className="font-medium text-jade">Quote Accepted</p>
                  <p className="text-sm text-muted-foreground">
                    {paymentAmount ? 'Proceed with payment to complete your order.' : 'Thank you for accepting this quote.'}
                  </p>
                </div>
              </div>
              {paymentAmount && (
                <Button
                  variant="gold"
                  size="lg"
                  disabled={isPending}
                  className="shrink-0"
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
            </div>
          </CardContent>
        </Card>
        {testCardInfo && paymentAmount && (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium">Test mode</span> — use card{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
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
      <Card className="border-ember/30 bg-ember/5">
        <CardContent className="py-6 text-center space-y-2">
          <XCircle className="h-8 w-8 mx-auto text-ember/70" />
          <p className="text-ember font-medium">Quote Declined</p>
          <p className="text-sm text-muted-foreground">
            This quote has been declined. Contact the sender if you have any questions.
          </p>
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
    <Card className="paper-texture border-gold/30">
      <CardContent className="py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm text-center sm:text-left">
            Would you like to accept or decline this quote?
          </p>
          <div className="flex gap-3">
            <Button
              variant="gold"
              size="lg"
              disabled={isPending}
              onClick={handleAccept}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Processing...' : 'Accept Quote'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              disabled={isPending}
              onClick={handleDecline}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
