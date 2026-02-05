'use client';

import { useState, useTransition, useSyncExternalStore } from 'react';
import { Check, Copy, ExternalLink, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { updateQuoteStatus } from '@/app/actions/quotes';

// Get window origin safely (empty string on server, actual origin on client)
const emptySubscribe = () => () => {};
function useWindowOrigin() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => '', // Server fallback
  );
}

interface SendQuoteModalProps {
  quoteId: string;
  shareToken: string;
}

export function SendQuoteModal({ quoteId, shareToken }: SendQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sharePath = `/q/${shareToken}`;
  const origin = useWindowOrigin();
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSend() {
    startTransition(async () => {
      // Copy link to clipboard first
      await navigator.clipboard.writeText(shareUrl);

      // Update status
      await updateQuoteStatus(quoteId, 'sent');

      // Close modal and show success
      setOpen(false);
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Quote marked as sent</span>
          <span className="text-muted-foreground text-xs">
            Link copied — share it with your client
          </span>
        </div>,
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Send className="mr-2 h-4 w-4" />
          Send Quote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Quote to Client</DialogTitle>
          <DialogDescription>
            Copy the link below and share it with your client via email, message, or any other
            method. They&apos;ll be able to view, accept, or decline the quote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
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
                <a href={sharePath} target="_blank" rel="noopener noreferrer" title="Preview quote">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Once marked as sent, the quote will be locked and can no longer be edited.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking as Sent...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link & Mark as Sent
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
