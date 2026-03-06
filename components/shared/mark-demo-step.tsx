'use client';

import { useEffect } from 'react';

import { completeDemoStep } from '@/lib/demo-guide';

/**
 * Invisible client component that marks a demo step complete on mount.
 * Used in server-rendered pages (e.g. Stripe success) that live outside
 * the dashboard layout where the floating guide widget lives.
 */
export function MarkDemoStep({ step }: { step: number }) {
  useEffect(() => {
    completeDemoStep(step);
  }, [step]);

  return null;
}
