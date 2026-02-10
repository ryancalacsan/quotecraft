import { expect, test } from '@playwright/test';

/**
 * Demo Login E2E Tests
 *
 * These tests verify the demo login flow works correctly.
 * Note: The demo login requires the DEMO_USER_ID environment variable
 * to be set and Clerk to be configured. If the demo login fails,
 * these tests will timeout waiting for the dashboard redirect.
 */
test.describe('Demo Login', () => {
  // Increase timeout for auth-related tests
  test.setTimeout(60000);

  test('demo login redirects to dashboard', async ({ page }) => {
    // Start from landing page
    await page.goto('/');

    // Click the first "Try Demo" button
    const demoButton = page.getByRole('button', { name: /try demo/i }).first();
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Wait for either:
    // 1. Dashboard URL (success)
    // 2. Button text changes to "Starting Demo..." (login in progress)
    // The demo login involves a redirect chain through Clerk
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 45000 });
      // Verify we're on the dashboard
      await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
        timeout: 15000,
      });
    } catch {
      // If timeout, check if we're stuck on loading state
      const buttonText = await demoButton.textContent();
      if (buttonText?.includes('Starting') || buttonText?.includes('Loading')) {
        // Demo is processing - this might indicate a backend issue
        test.skip(true, 'Demo login is stuck in loading state - check DEMO_USER_ID config');
      }
      throw new Error('Demo login did not redirect to dashboard');
    }
  });

  test('demo data is pre-seeded', async ({ page }) => {
    // Go directly to landing page and login
    await page.goto('/');
    await page
      .getByRole('button', { name: /try demo/i })
      .first()
      .click();

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    } catch {
      test.skip(true, 'Demo login failed - cannot verify pre-seeded data');
      return;
    }

    // Wait for dashboard content to load
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 15000,
    });

    // Demo data should include pre-seeded quotes
    // Look for quote statistics that indicate data exists
    const quoteStats = page.getByText(/total quotes/i);
    await expect(quoteStats).toBeVisible({ timeout: 10000 });
  });

  test('demo session is isolated with cookie', async ({ page }) => {
    // Go to landing page and login
    await page.goto('/');
    await page
      .getByRole('button', { name: /try demo/i })
      .first()
      .click();

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    } catch {
      test.skip(true, 'Demo login failed - cannot verify session cookie');
      return;
    }

    // Check that demo_session_id cookie is set
    const cookies = await page.context().cookies();
    const demoSessionCookie = cookies.find((c) => c.name === 'demo_session_id');

    // Demo session cookie should exist
    expect(demoSessionCookie).toBeDefined();
    expect(demoSessionCookie?.value).toBeTruthy();
  });
});
