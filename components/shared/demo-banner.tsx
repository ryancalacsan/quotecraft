'use client';

import { useState, useSyncExternalStore } from 'react';
import { useUser } from '@clerk/nextjs';
import { HelpCircle, X } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const BANNER_HIDDEN_KEY = 'demo_banner_hidden';

function subscribeToCookie() {
  // No real subscription needed - cookie only changes on user action
  return () => {};
}

function getSnapshot() {
  return typeof document !== 'undefined' && document.cookie.includes('demo_mode=true');
}

function getServerSnapshot() {
  return false;
}

export function DemoBanner() {
  const { user } = useUser();
  const isDemoMode = useSyncExternalStore(subscribeToCookie, getSnapshot, getServerSnapshot);
  const [isHidden, setIsHidden] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(BANNER_HIDDEN_KEY) === 'true';
  });

  if (!isDemoMode || !user || isHidden) return null;

  function handleDismiss() {
    sessionStorage.setItem(BANNER_HIDDEN_KEY, 'true');
    setIsHidden(true);
  }

  return (
    <div className="relative z-50 flex min-h-[40px] items-center justify-center bg-[#C9A96E] px-10 py-2 text-center text-sm font-medium text-[#1a1a1a]">
      <span className="inline-flex flex-wrap items-center justify-center gap-1">
        You&apos;re in demo mode. Data resets nightly.
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="hover:text-[#3a3a3a]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="sr-only">Demo mode info</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-left">
            This is a demo environment. All data (quotes, line items) resets daily at 2am UTC. Feel
            free to explore — your changes won&apos;t affect other users.
          </TooltipContent>
        </Tooltip>
      </span>
      <button
        onClick={handleDismiss}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 hover:bg-black/10"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
