import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { getQuotesByUserId } from '@/lib/db/queries';
import { QuoteList } from '@/components/dashboard/quote-list';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const quotes = await getQuotesByUserId(userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quotes</h2>
        <p className="text-muted-foreground">Manage your quotes and proposals.</p>
      </div>
      <QuoteList quotes={quotes} />
      <Toaster />
    </div>
  );
}
