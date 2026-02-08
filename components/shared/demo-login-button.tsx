'use client';

import { useState } from 'react';
import { useClerk, useSignIn } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DemoLoadingOverlay } from '@/components/shared/demo-loading-overlay';

interface DemoLoginButtonProps {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

// Maximum time to wait for session verification (ms)
const SESSION_VERIFY_TIMEOUT = 10000;
// Polling interval for session check (ms)
const SESSION_POLL_INTERVAL = 100;

/**
 * Waits for the session to be recognized server-side by making test requests.
 * This ensures the HTTP-only session cookie is actually set before navigating.
 */
async function waitForServerSession(): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < SESSION_VERIFY_TIMEOUT) {
    try {
      // Try to access a protected API endpoint
      const res = await fetch('/api/session-check', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        return true;
      }
    } catch {
      // Ignore fetch errors, keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, SESSION_POLL_INTERVAL));
  }

  return false;
}

export function DemoLoginButton({ variant = 'default', size = 'default' }: DemoLoginButtonProps) {
  const { signIn, setActive } = useSignIn();
  const clerk = useClerk();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemo() {
    if (!signIn || !setActive) return;

    setIsLoading(true);
    try {
      // Sign out existing session first to avoid "session_exists" error
      if (clerk.session) {
        await clerk.signOut();
      }

      const res = await fetch('/api/demo/login', { method: 'POST' });

      // Handle non-OK responses
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || `Failed to start demo (${res.status})`);
        return;
      }

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const attempt = await signIn.create({ strategy: 'ticket', ticket: data.token });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        document.cookie = 'demo_mode=true; path=/; max-age=86400';
        document.cookie = `demo_session_id=${data.sessionId}; path=/; max-age=86400`;

        // Wait for the session to be recognized server-side before navigating.
        // On mobile devices, the HTTP-only session cookie may take time to propagate.
        const sessionReady = await waitForServerSession();

        if (!sessionReady) {
          console.warn('Session verification timed out, navigating anyway');
        }

        // Use full page navigation to ensure cookies are included in the request
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Demo login failed:', err);
      toast.error('Failed to start demo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isLoading && <DemoLoadingOverlay />}
      <Button variant={variant} size={size} onClick={handleDemo} disabled={isLoading}>
        {isLoading ? 'Starting Demo...' : 'Try Demo'}
      </Button>
    </>
  );
}
