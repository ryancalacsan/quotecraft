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

  // Capture console messages for debugging
  const consoleMessages: string[] = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Setup Clerk testing token to bypass bot detection
  await setupClerkTestingToken({ page });

  // Intercept the demo login API to capture response
  let demoLoginResponse: { status: number; body: string } | null = null;
  page.on('response', async (response) => {
    if (response.url().includes('/api/demo/login')) {
      demoLoginResponse = {
        status: response.status(),
        body: await response.text().catch(() => 'Failed to get response body'),
      };
      console.log(`Demo login API response: ${response.status()}`);
    }
  });

  // Navigate to home and wait for Clerk to be fully loaded
  await page.goto('/');

  // Wait for Clerk to initialize by checking for window.Clerk
  // The button uses useSignIn() which returns undefined until Clerk is ready
  await page.waitForFunction(
    () => {
      return typeof window !== 'undefined' && (window as unknown as { Clerk?: unknown }).Clerk;
    },
    { timeout: 30000 },
  );

  // Additional wait for React hydration and Clerk hooks to be ready
  await page.waitForTimeout(1000);

  // Click the demo login button
  const demoButton = page.getByRole('button', { name: /try demo/i }).first();
  await expect(demoButton).toBeVisible({ timeout: 10000 });

  // Retry clicking the button if the API call doesn't happen
  // This handles race conditions where Clerk hooks aren't ready yet
  let retries = 3;
  while (retries > 0 && !demoLoginResponse) {
    await demoButton.click();

    // Wait for API call (shorter timeout for retries)
    const waitStart = Date.now();
    while (!demoLoginResponse && Date.now() - waitStart < 10000) {
      await page.waitForTimeout(500);
    }

    if (demoLoginResponse) break;

    retries--;
    if (retries > 0) {
      console.log(`Demo login API not called, retrying... (${retries} retries left)`);
      await page.waitForTimeout(1000);
    }
  }

  // Log debug info if API call failed or didn't happen
  if (!demoLoginResponse) {
    console.error('Demo login API was never called');
    console.error('Console messages:', consoleMessages.join('\n'));
    await page.screenshot({ path: 'tests/e2e/.auth/debug-no-api-call.png' });
    throw new Error('Demo login API was never called - check if button click worked');
  }

  if (demoLoginResponse.status !== 200) {
    console.error(`Demo login API failed with status ${demoLoginResponse.status}`);
    console.error(`Response body: ${demoLoginResponse.body}`);
    console.error('Console messages:', consoleMessages.join('\n'));
    await page.screenshot({ path: 'tests/e2e/.auth/debug-api-error.png' });
    throw new Error(
      `Demo login API failed: ${demoLoginResponse.status} - ${demoLoginResponse.body}`,
    );
  }

  console.log('Demo login API succeeded, waiting for redirect...');

  // Wait for successful login and redirect to dashboard
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  } catch (e) {
    console.error('Failed to redirect to dashboard');
    console.error('Current URL:', page.url());
    console.error('Console messages:', consoleMessages.join('\n'));
    await page.screenshot({ path: 'tests/e2e/.auth/debug-redirect-failed.png' });
    throw e;
  }

  await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
    timeout: 15000,
  });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
