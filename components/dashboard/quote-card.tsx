'use client';

import Link from 'next/link';
import { Copy, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QUOTE_STATUS_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { deleteQuote, duplicateQuote } from '@/app/actions/quotes';
import type { Quote } from '@/lib/db/schema';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'default',
  declined: 'destructive',
  paid: 'default',
};

export function QuoteCard({ quote }: { quote: Quote }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${appUrl}/q/${quote.shareToken}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  }

  async function handleDuplicate() {
    await duplicateQuote(quote.id);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    await deleteQuote(quote.id);
    toast.success('Quote deleted');
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            <Link href={`/quotes/${quote.id}`} className="hover:underline">
              {quote.title}
            </Link>
          </CardTitle>
          <p className="text-muted-foreground text-sm">{quote.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[quote.status] ?? 'secondary'}>
            {QUOTE_STATUS_LABELS[quote.status]}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {quote.status === 'draft' && (
                <DropdownMenuItem asChild>
                  <Link href={`/quotes/${quote.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>{quote.quoteNumber}</span>
          <span>{formatDate(quote.createdAt!)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
