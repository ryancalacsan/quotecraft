'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { CreditCard, Edit, Eye, FolderOpen, Send, X } from 'lucide-react';

const GUIDE_DISMISSED_KEY = 'demo_guide_dismissed';

function subscribeToCookie() {
  return () => {};
}

function getSnapshot() {
  return typeof document !== 'undefined' && document.cookie.includes('demo_mode=true');
}

function getServerSnapshot() {
  return false;
}

const steps = [
  {
    icon: Edit,
    text: 'Edit the "Brand Identity Package" draft — add or remove line items',
    href: '/dashboard',
  },
  {
    icon: Send,
    text: 'Send it to a client — copy the share link from the modal',
    href: null,
  },
  {
    icon: Eye,
    text: 'Open the share link in a new tab to see the client view',
    href: null,
  },
  {
    icon: CreditCard,
    text: null, // rendered with Stripe card pill
    href: null,
  },
  {
    icon: FolderOpen,
    text: 'Create a new quote from a template',
    href: '/quotes/new',
  },
];

export function DemoGuide() {
  const { user } = useUser();
  const isDemoMode = useSyncExternalStore(subscribeToCookie, getSnapshot, getServerSnapshot);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(GUIDE_DISMISSED_KEY) === 'true';
  });

  if (!isDemoMode || !user || isDismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 bg-card relative rounded-lg border border-l-4 border-l-[#C9A96E] p-4 shadow-sm duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Where to start</h3>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Try these steps to see QuoteCraft in action.
          </p>
          <ol className="mt-3 space-y-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const content =
                step.icon === CreditCard ? (
                  <span>
                    Pay with test card{' '}
                    <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      4242 4242 4242 4242
                    </span>
                    , any future date, any CVC
                  </span>
                ) : step.href ? (
                  <Link href={step.href} className="hover:underline">
                    {step.text}
                  </Link>
                ) : (
                  <span>{step.text}</span>
                );

              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-muted-foreground mt-0.5 shrink-0 font-mono text-xs">
                    {i + 1}.
                  </span>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
                  <span className="text-foreground">{content}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm p-1 transition-colors"
          aria-label="Dismiss demo guide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
