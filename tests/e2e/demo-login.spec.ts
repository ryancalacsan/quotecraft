import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test } from '@playwright/test';

/**
 * Demo Login E2E Tests
 *
 * These tests verify the demo login flow works correctly.
 * They use Clerk's testing token to bypass bot detection.
 */
test.describe('Demo Login', () => {
  test('demo login redirects to dashboard', async ({ page }) => {
    // Setup Clerk testing token to bypass bot detection
    await setupClerkTestingToken({ page });

    // Start from landing page
    await page.goto('/');

    // Click the first "Try Demo" button
    const demoButton = page.getByRole('button', { name: /try demo/i }).first();
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });

    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('demo data is pre-seeded', async ({ page }) => {
    await setupClerkTestingToken({ page });

    await page.goto('/');
    await page
      .getByRole('button', { name: /try demo/i })
      .first()
      .click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });

    // Wait for dashboard content to load
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 15000,
    });

    // Demo data should include pre-seeded quotes
    const quoteStats = page.getByText(/total quotes/i);
    await expect(quoteStats).toBeVisible({ timeout: 10000 });
  });

  test('demo session is isolated with cookie', async ({ page }) => {
    await setupClerkTestingToken({ page });

    await page.goto('/');
    await page
      .getByRole('button', { name: /try demo/i })
      .first()
      .click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });

    // Check that demo_session_id cookie is set
    const cookies = await page.context().cookies();
    const demoSessionCookie = cookies.find((c) => c.name === 'demo_session_id');

    // Demo session cookie should exist
    expect(demoSessionCookie).toBeDefined();
    expect(demoSessionCookie?.value).toBeTruthy();
  });
});
