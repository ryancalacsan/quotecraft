import { expect, test } from '@playwright/test';

test.describe('Quote Workflow', () => {
  test.setTimeout(90000);

  // Auth state is loaded from storage, just navigate to dashboard
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });
  });

  // Helper function to send a quote via the modal
  async function sendQuote(page: import('@playwright/test').Page) {
    // Click "Send Quote" to open modal
    const sendQuoteBtn = page.getByRole('button', { name: /send quote/i });
    await expect(sendQuoteBtn).toBeVisible({ timeout: 5000 });
    await sendQuoteBtn.click();

    // Click "Copy Link & Mark as Sent" in the modal
    const markAsSentBtn = page.getByRole('button', {
      name: /copy link.*mark as sent|mark as sent/i,
    });
    await expect(markAsSentBtn).toBeVisible({ timeout: 5000 });
    await markAsSentBtn.click();

    // Wait for modal to close
    await expect(markAsSentBtn).not.toBeVisible({ timeout: 10000 });
  }

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
    await expect(page.getByRole('heading', { name: 'Quote to Send' })).toBeVisible({
      timeout: 10000,
    });

    // Send the quote via modal
    await sendQuote(page);

    // Verify share link input appears (indicates quote was sent successfully)
    await page.reload();
    const shareInput = page.locator('input[readonly]').first();
    await expect(shareInput).toBeVisible({ timeout: 10000 });
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
    await expect(page.getByRole('heading', { name: 'Share Link Quote' })).toBeVisible({
      timeout: 10000,
    });

    await sendQuote(page);

    // Reload to see share link card
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Share Link Quote' })).toBeVisible({
      timeout: 10000,
    });

    // Look for share link input (readonly)
    const shareInput = page.locator('input[readonly]').first();
    await expect(shareInput).toBeVisible({ timeout: 10000 });

    // Verify it contains the share URL pattern
    const shareUrl = await shareInput.inputValue();
    expect(shareUrl).toMatch(/\/q\/[A-Za-z0-9_-]+/);
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

    // Navigate to detail
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: 'No Edit Quote' })).toBeVisible({
      timeout: 10000,
    });

    // Verify edit button is visible before sending
    const editButton = page.getByRole('link', { name: /edit/i });
    await expect(editButton).toBeVisible({ timeout: 5000 });

    // Send the quote
    await sendQuote(page);

    // Reload to see updated state
    await page.reload();
    await expect(page.getByRole('heading', { name: 'No Edit Quote' })).toBeVisible({
      timeout: 10000,
    });

    // Verify edit button is no longer visible
    await expect(page.getByRole('link', { name: /^edit$/i })).not.toBeVisible({ timeout: 5000 });
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
    await expect(page.getByRole('heading', { name: 'Locked Quote' })).toBeVisible({
      timeout: 10000,
    });

    await sendQuote(page);

    // Try to navigate directly to edit page
    await page.goto(`/quotes/${quoteId}/edit`);

    // Should either redirect away or show an error message
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
