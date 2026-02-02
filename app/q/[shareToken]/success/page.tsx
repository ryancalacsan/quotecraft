import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QuoteSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold tracking-tight">Quote Accepted</h1>
          <p className="text-muted-foreground text-sm">
            Thank you for accepting this quote. The sender has been notified and will follow up
            with next steps.
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Back to QuoteCraft</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
