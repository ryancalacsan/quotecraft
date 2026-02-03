'use client';

import { useSyncExternalStore } from 'react';
import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';

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

  if (!isDemoMode || !user) return null;

  function handleDismiss() {
    document.cookie = 'demo_mode=; path=/; max-age=0';
    window.location.reload();
  }

  return (
    <div className="relative z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      You&apos;re in demo mode. Data resets nightly.
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 hover:bg-amber-600/30"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
