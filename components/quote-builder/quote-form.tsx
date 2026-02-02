'use client';

import { useActionState, useId } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { LineItemRow, type LineItemData } from './line-item-row';
import { PricingSummary } from './pricing-summary';
import { calculateQuotePricing } from '@/lib/pricing';
import { createQuote, updateQuote } from '@/app/actions/quotes';
import type { Quote } from '@/lib/db/schema';
import { useState } from 'react';

interface QuoteFormProps {
  quote?: Quote;
  lineItems?: LineItemData[];
  onLineItemChange?: (id: string, field: keyof LineItemData, value: string) => void;
  onLineItemRemove?: (id: string) => void;
  onLineItemAdd?: () => void;
}

export function QuoteForm({
  quote,
  lineItems = [],
  onLineItemChange,
  onLineItemRemove,
  onLineItemAdd,
}: QuoteFormProps) {
  const isEditing = !!quote;
  const formId = useId();

  const [depositPercent, setDepositPercent] = useState<string>(
    quote?.depositPercent?.toString() ?? '0',
  );

  const pricing = calculateQuotePricing(
    lineItems.map((item) => ({
      rate: item.rate || '0',
      quantity: item.quantity || '0',
      discount: item.discount || '0',
    })),
    parseInt(depositPercent) || 0,
  );

  async function handleSubmit(_prev: unknown, formData: FormData) {
    if (isEditing) {
      return updateQuote(quote.id, formData);
    }
    return createQuote(formData);
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  const fieldErrors = state?.error as Record<string, string[]> | undefined;

  return (
    <form action={formAction} className="space-y-6">
      {/* Quote details */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-title`}>Title</Label>
              <Input
                id={`${formId}-title`}
                name="title"
                placeholder="e.g. Website Redesign"
                defaultValue={quote?.title ?? ''}
                required
              />
              {fieldErrors?.title && (
                <p className="text-destructive text-sm">{fieldErrors.title[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-clientName`}>Client Name</Label>
              <Input
                id={`${formId}-clientName`}
                name="clientName"
                placeholder="e.g. Acme Corp"
                defaultValue={quote?.clientName ?? ''}
                required
              />
              {fieldErrors?.clientName && (
                <p className="text-destructive text-sm">{fieldErrors.clientName[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-clientEmail`}>Client Email</Label>
              <Input
                id={`${formId}-clientEmail`}
                name="clientEmail"
                type="email"
                placeholder="client@example.com"
                defaultValue={quote?.clientEmail ?? ''}
              />
              {fieldErrors?.clientEmail && (
                <p className="text-destructive text-sm">{fieldErrors.clientEmail[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-validUntil`}>Valid Until</Label>
              <Input
                id={`${formId}-validUntil`}
                name="validUntil"
                type="date"
                defaultValue={
                  quote?.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : ''
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-depositPercent`}>Deposit Percentage</Label>
              <Input
                id={`${formId}-depositPercent`}
                name="depositPercent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-notes`}>Notes</Label>
            <Textarea
              id={`${formId}-notes`}
              name="notes"
              placeholder="Additional notes or terms..."
              rows={3}
              defaultValue={quote?.notes ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line items — only shown in edit mode */}
      {isEditing && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={onLineItemAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Column headers */}
            {lineItems.length > 0 && (
              <>
                <div className="text-muted-foreground grid grid-cols-12 gap-2 text-xs font-medium">
                  <span className="col-span-3">Description</span>
                  <span className="col-span-2">Pricing Type</span>
                  <span className="col-span-2">Rate</span>
                  <span className="col-span-1">Qty</span>
                  <span className="col-span-1">Discount</span>
                  <span className="col-span-1 text-right">Total</span>
                  <span className="col-span-1" />
                </div>
                <Separator />
              </>
            )}

            {lineItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No line items yet. Click &quot;Add Item&quot; to get started.
              </p>
            ) : (
              lineItems.map((item) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  onChange={onLineItemChange!}
                  onRemove={onLineItemRemove!}
                />
              ))
            )}

            {lineItems.length > 0 && (
              <>
                <Separator />
                <PricingSummary
                  subtotal={pricing.subtotal}
                  depositPercent={parseInt(depositPercent) || 0}
                  depositAmount={pricing.depositAmount}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form error */}
      {fieldErrors?._form && (
        <p className="text-destructive text-sm">{fieldErrors._form[0]}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save Quote'
              : 'Create Quote'}
        </Button>
      </div>
    </form>
  );
}
