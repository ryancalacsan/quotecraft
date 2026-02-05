'use client';

import { useState, useSyncExternalStore } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Get window origin safely (empty string on server, actual origin on client)
const emptySubscribe = () => () => {};
function useWindowOrigin() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => '' // Server fallback
  );
}

interface ShareLinkCardProps {
  shareToken: string;
}

export function ShareLinkCard({ shareToken }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const sharePath = `/q/${shareToken}`;
  const origin = useWindowOrigin();
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Quote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Share this link with your client so they can view and respond to the quote.
        </p>
        <div className="flex gap-2">
          <Input value={shareUrl} readOnly className="font-mono text-sm" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className={copied ? 'border-green-500 text-green-600' : ''}
          >
            {copied ? (
              <Check className="animate-in zoom-in-50 h-4 w-4 duration-200" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a href={sharePath} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
