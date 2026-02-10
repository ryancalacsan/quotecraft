import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

/**
 * Auth setup for E2E tests.
 *
 * Uses the demo login flow (Clerk Sign-In Tokens) since regular sign-in
 * is disabled for this portfolio project.
 *
 * The setupClerkTestingToken() helps bypass Clerk's bot detection,
 * making the demo login more reliable in CI.
 */
setup('authenticate', async ({ page }) => {
  setup.setTimeout(120000); // 2 minute timeout for auth

  // Setup Clerk testing token to bypass bot detection
  await setupClerkTestingToken({ page });

  // Navigate to home and click demo login
  await page.goto('/');

  // Click the demo login button
  await page
    .getByRole('button', { name: /try demo/i })
    .first()
    .click();

  // Wait for successful login and redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 90000 });
  await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
    timeout: 15000,
  });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
