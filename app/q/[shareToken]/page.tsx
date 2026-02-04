import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { getQuoteByShareToken, getUserById, getLineItemsByQuoteId } from '@/lib/db/queries';
import { calculateQuotePricing } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { QUOTE_STATUS_LABELS, PRICING_TYPE_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PublicQuoteActions } from './public-quote-actions';

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'gold' | 'jade' | 'ember' | 'sent'
> = {
  draft: 'secondary',
  sent: 'sent',
  accepted: 'jade',
  declined: 'ember',
  paid: 'jade',
};

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const quote = await getQuoteByShareToken(shareToken);
  if (!quote) notFound();

  const [user, items] = await Promise.all([
    getUserById(quote.userId),
    getLineItemsByQuoteId(quote.id),
  ]);

  const pricing = calculateQuotePricing(
    items.map((item) => ({
      rate: item.rate,
      quantity: item.quantity,
      discount: item.discount,
    })),
    quote.depositPercent,
  );

  const isExpired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6">
      {/* Expiration banner */}
      {isExpired && quote.validUntil && (
        <div
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            This quote expired on {formatDate(quote.validUntil)}. It can no longer be accepted.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {user?.businessName && (
            <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              {user.businessName}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{quote.title}</h1>
          <p className="text-muted-foreground text-sm">
            {quote.quoteNumber} &middot; {formatDate(quote.createdAt)}
          </p>
        </div>
        <Badge variant={statusVariant[quote.status] ?? 'secondary'} className="text-sm">
          {QUOTE_STATUS_LABELS[quote.status]}
        </Badge>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader>
          <CardTitle>Prepared For</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{quote.clientName}</dd>
            </div>
            {quote.clientEmail && (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{quote.clientEmail}</dd>
              </div>
            )}
            {quote.validUntil && (
              <div>
                <dt className="text-muted-foreground">Valid Until</dt>
                <dd className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                  {formatDate(quote.validUntil)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No line items on this quote.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Desktop table header */}
              <div className="text-muted-foreground hidden grid-cols-12 gap-2 text-xs font-medium md:grid">
                <span className="col-span-4">Description</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-1 text-right">Qty</span>
                <span className="col-span-1 text-right">Discount</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              <Separator className="hidden md:block" />

              {items.map((item, index) => (
                <div key={item.id}>
                  {/* Desktop row */}
                  <div className="hidden grid-cols-12 gap-2 text-sm md:grid">
                    <span className="col-span-4">{item.description}</span>
                    <span className="text-muted-foreground col-span-2">
                      {PRICING_TYPE_LABELS[item.pricingType]}
                      {item.unit ? ` (${item.unit})` : ''}
                    </span>
                    <span className="col-span-2 text-right">
                      {formatCurrency(Number(item.rate))}
                    </span>
                    <span className="col-span-1 text-right">{item.quantity}</span>
                    <span className="col-span-1 text-right">
                      {Number(item.discount) > 0 ? `${item.discount}%` : '\u2014'}
                    </span>
                    <span className="col-span-2 text-right font-medium">
                      {formatCurrency(pricing.lineItemTotals[index])}
                    </span>
                  </div>
                  {/* Mobile card */}
                  <div className="space-y-1 rounded-lg border p-3 text-sm md:hidden">
                    <div className="flex items-start justify-between">
                      <span className="font-medium">{item.description}</span>
                      <span className="font-semibold">
                        {formatCurrency(pricing.lineItemTotals[index])}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                      <span>
                        {PRICING_TYPE_LABELS[item.pricingType]}
                        {item.unit ? ` (${item.unit})` : ''}
                      </span>
                      <span>
                        {formatCurrency(Number(item.rate))} × {item.quantity}
                      </span>
                      {Number(item.discount) > 0 && <span>{item.discount}% off</span>}
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Pricing summary */}
              <div className="ml-auto w-full space-y-2 sm:w-64">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
                </div>
                {quote.depositPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit ({quote.depositPercent}%)</span>
                    <span className="font-medium">{formatCurrency(pricing.depositAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{quote.depositPercent > 0 ? 'Amount Due' : 'Total'}</span>
                  <span>
                    {formatCurrency(
                      quote.depositPercent > 0 ? pricing.depositAmount : pricing.subtotal,
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes & Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Accept/Decline/Pay actions */}
      <PublicQuoteActions
        shareToken={shareToken}
        currentStatus={quote.status}
        isExpired={isExpired}
        paymentAmount={
          items.length > 0
            ? formatCurrency(quote.depositPercent > 0 ? pricing.depositAmount : pricing.subtotal)
            : undefined
        }
        paymentLabel={quote.depositPercent > 0 ? 'Deposit' : 'Full Amount'}
        testCardInfo={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_')}
      />
    </div>
  );
}
