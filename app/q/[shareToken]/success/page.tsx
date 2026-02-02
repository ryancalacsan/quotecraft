import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { getQuoteByShareToken } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function QuoteSuccessPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const quote = await getQuoteByShareToken(shareToken);
  if (!quote) notFound();

  const isPaid = quote.status === 'paid';

  return (
    <div className="mx-auto max-w-lg px-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold tracking-tight">
            {isPaid ? 'Payment Received' : 'Quote Accepted'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isPaid
              ? 'Thank you for your payment. The sender has been notified and will follow up with next steps.'
              : 'Thank you for accepting this quote. The sender has been notified and will follow up with next steps.'}
          </p>
          <Button variant="outline" asChild>
            <Link href={`/q/${shareToken}`}>View Quote</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
