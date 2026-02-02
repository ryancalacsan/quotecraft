'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';

export function DemoBanner() {
  const { user } = useUser();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(document.cookie.includes('demo_mode=true'));
  }, []);

  if (!isDemoMode || !user) return null;

  function handleDismiss() {
    document.cookie = 'demo_mode=; path=/; max-age=0';
    setIsDemoMode(false);
  }

  return (
    <div className="relative z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      You&apos;re in demo mode. Data resets nightly.{' '}
      <Link href="/sign-up" className="underline underline-offset-2">
        Sign up for free &rarr;
      </Link>
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
