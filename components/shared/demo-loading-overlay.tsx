'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const loadingMessages = [
  'Setting up your demo...',
  'Preparing sample quotes...',
  'Almost ready...',
];

// SSR-safe way to check if we're in the browser
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function DemoLoadingOverlay() {
  const isMounted = useIsMounted();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Cycle through messages
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Q Logo */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="bg-gold/20 absolute inset-0 animate-ping rounded-2xl" />

          {/* Logo container */}
          <div className="bg-foreground shadow-gold/20 relative flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl shadow-lg">
            <span className="text-background font-serif text-4xl font-semibold italic">Q</span>
          </div>
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-foreground text-lg font-medium">{loadingMessages[messageIndex]}</p>

          {/* Animated dots */}
          <div className="flex gap-1.5">
            <span
              className="bg-gold h-2 w-2 animate-bounce rounded-full"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="bg-gold h-2 w-2 animate-bounce rounded-full"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="bg-gold h-2 w-2 animate-bounce rounded-full"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
