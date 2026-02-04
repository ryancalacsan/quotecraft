'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useSignIn } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface DemoLoginButtonProps {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function DemoLoginButton({ variant = 'default', size = 'default' }: DemoLoginButtonProps) {
  const { signIn, setActive } = useSignIn();
  const { signOut, session } = useClerk();
  const router = useRouter();
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
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Demo login failed:', err);
      toast.error('Failed to start demo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDemo} disabled={isLoading}>
      {isLoading ? 'Starting Demo...' : 'Try Demo'}
    </Button>
  );
}
