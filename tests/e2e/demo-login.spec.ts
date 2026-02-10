import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

/**
 * Demo Login E2E Tests
 *
 * These tests verify the demo login flow works correctly.
 * They use Clerk's testing token to bypass bot detection.
 */
test.describe('Demo Login', () => {
  // Increase timeout for demo login tests since Sign-In Tokens can be slow
  test.setTimeout(90000);

  /**
   * Helper function to perform demo login with debugging
   */
  async function performDemoLogin(page: import('@playwright/test').Page): Promise<void> {
    // Capture console messages for debugging
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Intercept the demo login API to capture response
    let demoLoginResponse: { status: number; body: string } | null = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/demo/login')) {
        demoLoginResponse = {
          status: response.status(),
          body: await response.text().catch(() => 'Failed to get response body'),
        };
      }
    });

    // Setup Clerk testing token to bypass bot detection
    await setupClerkTestingToken({ page });

    // Navigate and wait for Clerk to be fully loaded
    await page.goto('/');

    // Wait for Clerk to initialize by checking for the Clerk-loaded class or script
    // The button uses useSignIn() which returns undefined until Clerk is ready
    await page.waitForFunction(
      () => {
        // Check if Clerk is loaded by looking for window.Clerk
        return typeof window !== 'undefined' && (window as unknown as { Clerk?: unknown }).Clerk;
      },
      { timeout: 30000 },
    );

    // Additional wait for React hydration and Clerk hooks to be ready
    await page.waitForTimeout(1000);

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

    // Use type assertion because TypeScript can't track mutations inside async callbacks
    const response = demoLoginResponse as { status: number; body: string } | null;

    if (!response) {
      console.error('Demo login API was never called after retries');
      console.error('Console messages:', consoleMessages.join('\n'));
      throw new Error('Demo login API was never called');
    }

    if (response.status !== 200) {
      console.error(`Demo login API failed: ${response.status}`);
      console.error(`Response: ${response.body}`);
      throw new Error(`Demo login API failed: ${response.status}`);
    }

    // Wait for redirect to dashboard
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 60000 });
    } catch (e) {
      console.error('Failed to redirect to dashboard');
      console.error('Current URL:', page.url());
      console.error('Console messages:', consoleMessages.join('\n'));
      throw e;
    }
  }

  test('demo login redirects to dashboard', async ({ page }) => {
    await performDemoLogin(page);

    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('demo data is pre-seeded', async ({ page }) => {
    await performDemoLogin(page);

    // Wait for dashboard content to load
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 15000,
    });

    // Demo data should include pre-seeded quotes
    // Look for the stats row which contains "Total Quotes" label
    const quoteStats = page.getByText('Total Quotes');
    await expect(quoteStats).toBeVisible({ timeout: 10000 });
  });

  test('demo session is isolated with cookie', async ({ page }) => {
    await performDemoLogin(page);

    // Check that demo_session_id cookie is set
    const cookies = await page.context().cookies();
    const demoSessionCookie = cookies.find((c) => c.name === 'demo_session_id');

    // Demo session cookie should exist
    expect(demoSessionCookie).toBeDefined();
    expect(demoSessionCookie?.value).toBeTruthy();
  });
});
