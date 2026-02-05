import { notFound } from 'next/navigation';
import { AlertTriangle, Clock, Tag, Package } from 'lucide-react';

import { getQuoteByShareToken, getUserById, getLineItemsByQuoteId } from '@/lib/db/queries';
import { calculateQuotePricing } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { QUOTE_STATUS_LABELS, PRICING_TYPE_LABELS, type PricingType } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PublicQuoteActions } from './public-quote-actions';

// Icons for pricing types
const PRICING_TYPE_ICONS: Record<PricingType, React.ElementType> = {
  hourly: Clock,
  fixed: Tag,
  per_unit: Package,
};

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

  const isPaid = quote.status === 'paid';

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      {/* Paid watermark overlay */}
      {isPaid && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          <span className="text-jade/[0.06] rotate-[-15deg] text-[120px] font-bold tracking-[0.3em] uppercase select-none">
            Paid
          </span>
        </div>
      )}

      {/* Expiration banner */}
      {isExpired && quote.validUntil && (
        <div
          className="border-ember/30 bg-ember/5 text-ember flex items-center gap-3 rounded-lg border p-4 text-sm"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            This quote expired on {formatDate(quote.validUntil)}. It can no longer be accepted.
          </span>
        </div>
      )}

      {/* Digital Letterhead Header */}
      <header className="border-border/60 space-y-4 border-b pb-6 text-center">
        {user?.businessName && (
          <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">
            {user.businessName}
          </p>
        )}
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.4em] uppercase">
            Quote
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{quote.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">{quote.quoteNumber}</p>
        </div>
        <div className="flex items-center justify-center gap-4 pt-2">
          <span className="text-muted-foreground text-sm">
            Issued {formatDate(quote.createdAt)}
          </span>
          <Badge variant={statusVariant[quote.status] ?? 'secondary'} className="text-sm">
            {QUOTE_STATUS_LABELS[quote.status]}
          </Badge>
        </div>
      </header>

      {/* Client info */}
      <Card className="paper-texture">
        <CardHeader className="pb-3">
          <CardTitle className="text-muted-foreground text-sm font-medium">Prepared For</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs">Client</dt>
              <dd className="text-base font-semibold">{quote.clientName}</dd>
            </div>
            {quote.clientEmail && (
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs">Email</dt>
                <dd className="font-medium">{quote.clientEmail}</dd>
              </div>
            )}
            {quote.validUntil && (
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs">Valid Until</dt>
                <dd className={`font-mono font-medium ${isExpired ? 'text-ember' : ''}`}>
                  {formatDate(quote.validUntil)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card className="paper-texture">
        <CardHeader className="pb-3">
          <CardTitle className="text-muted-foreground text-sm font-medium">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No line items on this quote.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Desktop table header */}
              <div className="text-muted-foreground hidden grid-cols-12 gap-2 text-xs font-medium tracking-wide uppercase md:grid">
                <span className="col-span-4">Description</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-1 text-right">Qty</span>
                <span className="col-span-1 text-right">Disc</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              <Separator className="hidden md:block" />

              {items.map((item, index) => {
                const PricingIcon = PRICING_TYPE_ICONS[item.pricingType as PricingType] || Tag;
                return (
                  <div key={item.id}>
                    {/* Desktop row */}
                    <div className="hover:bg-muted/30 hidden grid-cols-12 gap-2 rounded py-2 text-sm transition-colors md:grid">
                      <span className="col-span-4 font-medium">{item.description}</span>
                      <span className="text-muted-foreground col-span-2 flex items-center gap-1.5">
                        <PricingIcon className="h-3.5 w-3.5" />
                        {PRICING_TYPE_LABELS[item.pricingType as PricingType]}
                        {item.unit ? ` (${item.unit})` : ''}
                      </span>
                      <span className="col-span-2 text-right font-mono tabular-nums">
                        {formatCurrency(Number(item.rate))}
                      </span>
                      <span className="col-span-1 text-right font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <span className="text-muted-foreground col-span-1 text-right font-mono tabular-nums">
                        {Number(item.discount) > 0 ? `${item.discount}%` : '\u2014'}
                      </span>
                      <span className="col-span-2 text-right font-mono font-semibold tabular-nums">
                        {formatCurrency(pricing.lineItemTotals[index])}
                      </span>
                    </div>
                    {/* Mobile card */}
                    <div className="border-border/60 space-y-2 rounded-lg border p-4 text-sm md:hidden">
                      <div className="flex items-start justify-between">
                        <span className="font-medium">{item.description}</span>
                        <span className="font-mono font-semibold tabular-nums">
                          {formatCurrency(pricing.lineItemTotals[index])}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="flex items-center gap-1">
                          <PricingIcon className="h-3 w-3" />
                          {PRICING_TYPE_LABELS[item.pricingType as PricingType]}
                          {item.unit ? ` (${item.unit})` : ''}
                        </span>
                        <span className="font-mono">
                          {formatCurrency(Number(item.rate))} × {item.quantity}
                        </span>
                        {Number(item.discount) > 0 && (
                          <span className="text-gold font-medium">{item.discount}% off</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <Separator />

              {/* Pricing summary - receipt style */}
              <div className="border-border/60 bg-card/50 ml-auto w-72 rounded-lg border p-4">
                <p className="text-muted-foreground mb-3 text-center text-sm font-medium">
                  Quote Summary
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(pricing.subtotal)}
                    </span>
                  </div>
                  {quote.depositPercent > 0 && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Deposit ({quote.depositPercent}%)
                        </span>
                        <span className="text-gold font-mono font-medium tabular-nums">
                          {formatCurrency(pricing.depositAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Balance Due</span>
                        <span className="font-mono tabular-nums">
                          {formatCurrency(pricing.subtotal - pricing.depositAmount)}
                        </span>
                      </div>
                    </>
                  )}
                  <Separator className="my-2" />
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-base font-semibold">
                      {quote.depositPercent > 0 ? 'Amount Due' : 'Total'}
                    </span>
                    <span className="font-mono text-xl font-semibold tabular-nums">
                      {formatCurrency(
                        quote.depositPercent > 0 ? pricing.depositAmount : pricing.subtotal,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card className="paper-texture">
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Notes & Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {quote.notes}
            </p>
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
