import { expect, test } from '@playwright/test';

test.describe('Quote Workflow', () => {
  // Auth state is loaded from storage, just navigate to dashboard
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('send quote changes status from draft to sent', async ({ page }) => {
    // Create a new quote
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Quote to Send');
    await page.getByLabel(/client name/i).fill('Send Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to quote detail page
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    // Click "Mark as Sent" or similar button
    await page.getByRole('button', { name: /mark as sent|send/i }).click();

    // Wait for status update
    await page.waitForTimeout(1000);

    // Verify status changed to "Sent"
    await expect(page.getByText(/sent/i)).toBeVisible({ timeout: 5000 });

    // Verify share link appears
    await expect(page.getByText(/share|link|\/q\//i)).toBeVisible({ timeout: 5000 });
  });

  test('sent quote shows share link', async ({ page }) => {
    // Create and send a quote
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Share Link Quote');
    await page.getByLabel(/client name/i).fill('Share Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /mark as sent|send/i }).click();
    await page.waitForTimeout(1000);

    // Look for share link or copy button
    const shareElement = page
      .getByText(/\/q\//)
      .or(page.getByRole('button', { name: /copy link|copy/i }))
      .or(page.locator('[data-testid="share-link"]'));

    await expect(shareElement).toBeVisible({ timeout: 5000 });
  });

  test('sent quote hides edit button', async ({ page }) => {
    // Create and send a quote
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('No Edit Quote');
    await page.getByLabel(/client name/i).fill('No Edit Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    // Verify edit button is visible before sending
    const editButton = page.getByRole('link', { name: /edit/i });
    await expect(editButton).toBeVisible({ timeout: 5000 });

    // Send the quote
    await page.getByRole('button', { name: /mark as sent|send/i }).click();
    await page.waitForTimeout(1000);

    // Verify edit button is no longer visible
    await expect(editButton).not.toBeVisible({ timeout: 5000 });
  });

  test('cannot navigate to edit page for sent quote', async ({ page }) => {
    // Create and send a quote
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Locked Quote');
    await page.getByLabel(/client name/i).fill('Lock Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Get the quote ID from the URL
    const editUrl = page.url();
    const quoteId = editUrl.match(/\/quotes\/([^/]+)\/edit/)?.[1];

    // Navigate to detail and send
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /mark as sent|send/i }).click();
    await page.waitForTimeout(1000);

    // Try to navigate directly to edit page
    await page.goto(`/quotes/${quoteId}/edit`);
    await page.waitForLoadState('networkidle');

    // Should either redirect away or show an error message
    // Check if we're still on edit page (shouldn't be) or see an error
    const currentUrl = page.url();
    const isOnEditPage = currentUrl.includes('/edit');

    if (isOnEditPage) {
      // If still on edit page, there should be an error message or disabled state
      await expect(
        page.getByText(/cannot edit|locked|only draft/i).or(page.getByRole('alert')),
      ).toBeVisible({ timeout: 5000 });
    } else {
      // Redirected away from edit page - that's correct behavior
      expect(currentUrl).not.toContain('/edit');
    }
  });
});
