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
  fullWidthMobile?: boolean;
}

export function SendQuoteModal({ quoteId, shareToken, fullWidthMobile }: SendQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sharePath = `/q/${shareToken}`;
  const origin = useWindowOrigin();
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link. Please copy manually.');
    }
  }

  function handleSend() {
    startTransition(async () => {
      try {
        // Update status first - this is the critical action
        await updateQuoteStatus(quoteId, 'sent');

        // Then try to copy (best effort)
        let clipboardSuccess = true;
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch (clipboardError) {
          console.warn('Clipboard copy failed:', clipboardError);
          clipboardSuccess = false;
        }

        // Close modal and show success
        setOpen(false);
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-medium">Quote marked as sent</span>
            <span className="text-muted-foreground text-xs">
              {clipboardSuccess
                ? 'Link copied — share it with your client'
                : 'Copy the link from the quote page to share'}
            </span>
          </div>,
        );
      } catch (error) {
        console.error('Failed to send quote:', error);
        toast.error('Failed to mark quote as sent. Please try again.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={fullWidthMobile ? 'w-full md:w-auto' : ''}>
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
                aria-label={copied ? 'Link copied' : 'Copy share link'}
                className={copied ? 'border-green-500 text-green-600' : ''}
              >
                {copied ? (
                  <Check className="animate-in zoom-in-50 h-4 w-4 duration-200" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" asChild aria-label="Preview quote in new tab">
                <a href={sharePath} target="_blank" rel="noopener noreferrer">
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
