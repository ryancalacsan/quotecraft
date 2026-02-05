'use client';

import { useSyncExternalStore } from 'react';
import { UserButton } from '@clerk/nextjs';

// Subscribe to cookie changes (no-op since cookies don't emit events)
const subscribe = () => () => {};

// Read demo mode from cookie on client
function getSnapshot() {
  return document.cookie.includes('demo_mode=true');
}

// Server always returns false (will hydrate correctly on client)
function getServerSnapshot() {
  return false;
}

export function UserMenu() {
  const isDemoMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Demo users: hide the "Manage account" option
  if (isDemoMode) {
    return (
      <UserButton
        appearance={{
          elements: {
            userButtonPopoverActionButton__manageAccount: {
              display: 'none',
            },
          },
        }}
      />
    );
  }

  // Regular users get full menu
  return <UserButton />;
}
