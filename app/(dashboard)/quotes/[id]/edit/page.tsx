import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

import { getQuoteById, getLineItemsByQuoteId } from '@/lib/db/queries';
import { EditQuoteClient } from '@/components/quote-builder/edit-quote-client';

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const quote = await getQuoteById(id, userId);
  if (!quote) notFound();

  if (quote.status !== 'draft') {
    redirect(`/quotes/${id}`);
  }

  const items = await getLineItemsByQuoteId(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Quote</h2>
        <p className="text-muted-foreground">{quote.quoteNumber}</p>
      </div>
      <EditQuoteClient
        quote={quote}
        initialLineItems={items.map((item) => ({
          id: item.id,
          description: item.description,
          pricingType: item.pricingType,
          unit: item.unit ?? '',
          rate: item.rate,
          quantity: item.quantity,
          discount: item.discount,
        }))}
      />
    </div>
  );
}
