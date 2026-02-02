import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Edit, Send } from 'lucide-react';

import { getQuoteById, getLineItemsByQuoteId } from '@/lib/db/queries';
import { calculateQuotePricing } from '@/lib/pricing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { QUOTE_STATUS_LABELS, PRICING_TYPE_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { QuoteStatusActions } from '@/components/quote-builder/quote-status-actions';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'default',
  declined: 'destructive',
  paid: 'default',
};

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const quote = await getQuoteById(id, userId);
  if (!quote) notFound();

  const items = await getLineItemsByQuoteId(id);
  const pricing = calculateQuotePricing(
    items.map((item) => ({
      rate: item.rate,
      quantity: item.quantity,
      discount: item.discount,
    })),
    quote.depositPercent,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{quote.title}</h2>
            <Badge variant={statusVariant[quote.status] ?? 'secondary'}>
              {QUOTE_STATUS_LABELS[quote.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">{quote.quoteNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {quote.status === 'draft' && (
            <Link href={`/quotes/${quote.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          <QuoteStatusActions quoteId={quote.id} currentStatus={quote.status} />
        </div>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
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
                <dd className="font-medium">{formatDate(quote.validUntil)}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{formatDate(quote.createdAt)}</dd>
            </div>
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
              {/* Header row */}
              <div className="text-muted-foreground grid grid-cols-12 gap-2 text-xs font-medium">
                <span className="col-span-4">Description</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-1 text-right">Qty</span>
                <span className="col-span-1 text-right">Discount</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              <Separator />

              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 text-sm">
                  <span className="col-span-4">{item.description}</span>
                  <span className="text-muted-foreground col-span-2">
                    {PRICING_TYPE_LABELS[item.pricingType]}
                    {item.unit ? ` (${item.unit})` : ''}
                  </span>
                  <span className="col-span-2 text-right">{formatCurrency(Number(item.rate))}</span>
                  <span className="col-span-1 text-right">{item.quantity}</span>
                  <span className="col-span-1 text-right">
                    {Number(item.discount) > 0 ? `${item.discount}%` : '—'}
                  </span>
                  <span className="col-span-2 text-right font-medium">
                    {formatCurrency(pricing.lineItemTotals[index])}
                  </span>
                </div>
              ))}

              <Separator />

              {/* Pricing summary */}
              <div className="ml-auto w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
                </div>
                {quote.depositPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Deposit ({quote.depositPercent}%)
                    </span>
                    <span className="font-medium">{formatCurrency(pricing.depositAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
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
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
