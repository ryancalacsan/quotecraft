import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

/**
 * Auth setup for E2E tests.
 *
 * Uses Clerk's recommended approach with a test user that has password auth.
 * Requires these environment variables:
 * - E2E_CLERK_USER_USERNAME: Test user's email/username
 * - E2E_CLERK_USER_PASSWORD: Test user's password
 *
 * To set up:
 * 1. Create a test user in Clerk Dashboard with email/password
 * 2. Add credentials to .env.local and GitHub Secrets
 */
setup('authenticate', async ({ page }) => {
  // Setup Clerk testing token to bypass bot detection
  await setupClerkTestingToken({ page });

  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Sign in using Clerk's testing helper with password strategy
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
    timeout: 15000,
  });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
