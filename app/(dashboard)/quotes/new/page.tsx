import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { QuoteForm } from '@/components/quote-builder/quote-form';

export default async function NewQuotePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Quote</h2>
        <p className="text-muted-foreground">Fill in the details to create a new quote.</p>
      </div>
      <QuoteForm />
    </div>
  );
}
