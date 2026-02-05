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
        <CardContent className="space-y-2 py-6 text-center">
          <CheckCircle className="text-jade mx-auto h-8 w-8" />
          <p className="text-jade font-medium">Payment Received</p>
          <p className="text-muted-foreground text-sm">
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
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <CheckCircle className="text-jade h-6 w-6 shrink-0" />
                <div>
                  <p className="text-jade font-medium">Quote Accepted</p>
                  <p className="text-muted-foreground text-sm">
                    {paymentAmount
                      ? 'Proceed with payment to complete your order.'
                      : 'Thank you for accepting this quote.'}
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
                      // Validate Stripe checkout URL for security
                      if (!data.url || !data.url.startsWith('https://checkout.stripe.com/')) {
                        toast.error('Invalid checkout URL received');
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
          <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-lg border px-4 py-3 text-sm">
            <span className="font-medium">Test mode</span> — use card{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
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
        <CardContent className="space-y-2 py-6 text-center">
          <XCircle className="text-ember/70 mx-auto h-8 w-8" />
          <p className="text-ember font-medium">Quote Declined</p>
          <p className="text-muted-foreground text-sm">
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
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-center text-sm sm:text-left">
            Would you like to accept or decline this quote?
          </p>
          <div className="flex gap-3">
            <Button variant="gold" size="lg" disabled={isPending} onClick={handleAccept}>
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
