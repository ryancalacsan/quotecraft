import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';

import { getQuoteById, getLineItemsByQuoteId } from '@/lib/db/queries';
import { getDemoSessionId } from '@/lib/demo-session';
import { EditQuoteClient } from '@/components/quote-builder/edit-quote-client';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const demoSessionId = await getDemoSessionId(userId);
  const quote = await getQuoteById(id, userId, demoSessionId);
  if (!quote) notFound();

  if (quote.status !== 'draft') {
    redirect(`/quotes/${id}`);
  }

  const items = await getLineItemsByQuoteId(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: quote.title, href: `/quotes/${quote.id}` },
          { label: 'Edit' },
        ]}
      />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="font-display text-2xl font-bold tracking-tight">Edit Quote</h2>
        <div className="bg-gold mt-2 h-1 w-12 rounded-full" />
        <p className="text-muted-foreground mt-3 font-mono text-sm">{quote.quoteNumber}</p>
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
