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

export function DemoLoginButton({ variant = 'default', size = 'default' }: DemoLoginButtonProps) {
  const { signIn, setActive } = useSignIn();
  const { signOut, session } = useClerk();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemo() {
    if (!signIn || !setActive) return;

    setIsLoading(true);
    try {
      // Sign out existing session first to avoid "session_exists" error
      if (session) {
        await signOut();
      }

      const res = await fetch('/api/demo/login', { method: 'POST' });
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
        // Use full page navigation to ensure cookies are included in the request
        // router.push() can cause race conditions with newly-set cookies
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
