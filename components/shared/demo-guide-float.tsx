'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CreditCard,
  Edit,
  Eye,
  FolderOpen,
  ListChecks,
  Send,
} from 'lucide-react';

import {
  completeDemoStep,
  DEMO_GUIDE_OPEN_KEY,
  DEMO_STEP_COUNT,
  DEMO_STEPS_KEY,
  loadDemoSteps,
} from '@/lib/demo-guide';

// Cookie detection — same pattern as DemoBanner
function subscribeToCookie() {
  return () => {};
}
function getSnapshot() {
  return typeof document !== 'undefined' && document.cookie.includes('demo_mode=true');
}
function getServerSnapshot() {
  return false;
}

// SSR-safe mounted detection
const emptySubscribe = () => () => {};

const stepDefs = [
  {
    icon: Edit,
    label: 'Edit the "Brand Identity Package" draft',
    sublabel: 'Add or remove line items',
    href: '/dashboard',
  },
  {
    icon: Send,
    label: 'Send it to a client',
    sublabel: 'Copy the share link from the modal',
    href: null,
  },
  {
    icon: Eye,
    label: 'Open the share link in a new tab',
    sublabel: 'See the client view',
    href: null,
  },
  {
    icon: CreditCard,
    label: (
      <>
        Pay with test card{' '}
        <span className="bg-muted rounded px-1 py-0.5 font-mono text-xs">4242 4242 4242 4242</span>
      </>
    ),
    sublabel: 'Any future date, any CVC',
    href: null,
  },
  {
    icon: FolderOpen,
    label: 'Create a quote from a template',
    sublabel: 'Visit the Templates page',
    href: '/templates',
  },
] as const;

export function DemoGuideFloat() {
  const { user } = useUser();
  const isDemoMode = useSyncExternalStore(subscribeToCookie, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const pathname = usePathname();

  // Lazy init reads localStorage on client; returns safe defaults on server
  const [steps, setSteps] = useState<boolean[]>(() => {
    if (typeof window === 'undefined') return Array(DEMO_STEP_COUNT).fill(false);
    return loadDemoSteps();
  });
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const savedOpen = localStorage.getItem(DEMO_GUIDE_OPEN_KEY);
    return savedOpen === null ? true : savedOpen === 'true';
  });

  // 1. Custom event listener — same-tab step completions from other components
  //    Must be defined before the route-detection effect so the listener is
  //    registered before the route effect fires its first event.
  useEffect(() => {
    function handleStepComplete(e: Event) {
      const { step } = (e as CustomEvent<{ step: number }>).detail;
      setSteps((prev) => {
        if (prev[step]) return prev;
        return loadDemoSteps();
      });
    }
    window.addEventListener('demo-step-complete', handleStepComplete);
    return () => window.removeEventListener('demo-step-complete', handleStepComplete);
  }, []);

  // 2. Storage event listener — cross-tab step completions (e.g. Stripe success)
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === DEMO_STEPS_KEY && e.newValue) {
        try {
          const parsed: unknown = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSteps(parsed as boolean[]);
        } catch {
          // Ignore parse errors
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 3. Route-based step detection — fires event (picked up by listener above)
  useEffect(() => {
    if (pathname.includes('/edit')) {
      completeDemoStep(0);
    }
  }, [pathname]);

  function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    localStorage.setItem(DEMO_GUIDE_OPEN_KEY, String(next));
  }

  if (!mounted || !isDemoMode || !user) return null;

  const completedCount = steps.filter(Boolean).length;
  const allDone = completedCount === DEMO_STEP_COUNT;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {isOpen && (
        <div className="animate-in slide-in-from-bottom-2 fade-in bg-card w-80 overflow-hidden rounded-xl border shadow-xl duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Where to start</p>
              <p className="text-muted-foreground text-xs">
                {allDone ? 'All steps complete!' : `${completedCount} of 5 steps completed`}
              </p>
            </div>
            <button
              onClick={toggleOpen}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm p-1 transition-colors"
              aria-label="Collapse demo guide"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-muted h-1">
            <div
              className="h-1 bg-[#C9A96E] transition-all duration-500"
              style={{ width: `${(completedCount / DEMO_STEP_COUNT) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <ol className="space-y-1 p-4">
            {stepDefs.map((step, i) => {
              const done = steps[i];
              return (
                <li key={i} className={`flex items-start gap-3 ${done ? 'opacity-50' : ''}`}>
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A96E]" />
                  ) : (
                    <Circle className="text-muted-foreground/30 mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm leading-snug">
                      {step.href ? (
                        <Link href={step.href} className="font-medium hover:underline">
                          {step.label}
                        </Link>
                      ) : (
                        <span className="font-medium">{step.label}</span>
                      )}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{step.sublabel}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Launcher button */}
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 rounded-full bg-[#C9A96E] px-4 py-2 text-sm font-semibold text-[#1a1a1a] shadow-lg transition-all hover:bg-[#C9A96E]/90 hover:shadow-xl active:scale-95"
        aria-label={isOpen ? 'Collapse demo guide' : 'Open demo guide'}
      >
        <ListChecks className="h-4 w-4" />
        <span>Try the demo</span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 opacity-70" />
        )}
        <span className="rounded-full bg-[#1a1a1a]/20 px-1.5 py-0.5 font-mono text-xs">
          {completedCount}/{DEMO_STEP_COUNT}
        </span>
      </button>
    </div>
  );
}
