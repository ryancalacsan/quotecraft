import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

// Must run serially when Playwright is configured for full parallelization
setup.describe.configure({ mode: 'serial' });

setup('global setup', async () => {
  await clerkSetup();
});
