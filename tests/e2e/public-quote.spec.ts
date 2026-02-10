import { expect, test } from '@playwright/test';

test.describe('Public Quote View', () => {
  // Increase timeout for quote setup
  test.setTimeout(60000);

  let shareToken: string;
  let quoteTitle: string;

  // Create a sent quote and get its share token before tests
  // Auth state is loaded from storage
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

    // Create a unique quote for each test
    quoteTitle = `Public Quote ${Date.now()}`;
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill(quoteTitle);
    await page.getByLabel(/client name/i).fill('Public View Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Add a line item for pricing
    await page.getByRole('button', { name: /add item|add line item/i }).click();
    await page.waitForTimeout(500);
    await page
      .getByLabel(/description/i)
      .last()
      .fill('Test Service');
    await page
      .getByLabel(/rate|price/i)
      .last()
      .fill('500');

    const saveItemBtn = page.getByRole('button', { name: /save|add|confirm/i }).last();
    if (await saveItemBtn.isVisible()) {
      await saveItemBtn.click();
    }
    await page.waitForTimeout(1000);

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /mark as sent|send/i }).click();
    await page.waitForTimeout(1000);

    // Extract share token from the page
    const shareText = await page.getByText(/\/q\//).textContent();
    const match = shareText?.match(/\/q\/([A-Za-z0-9_-]+)/);
    if (match) {
      shareToken = match[1];
    }
  });

  test('public quote view loads without authentication', async ({ page }) => {
    // Clear cookies to ensure we're not authenticated
    await page.context().clearCookies();

    // Navigate to public quote view
    await page.goto(`/q/${shareToken}`);
    await page.waitForLoadState('networkidle');

    // Verify quote details are visible
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Public View Client')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Service')).toBeVisible({ timeout: 5000 });
  });

  test('public quote shows pricing', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await page.waitForLoadState('networkidle');

    // Verify pricing is visible
    await expect(page.getByText(/\$500/)).toBeVisible({ timeout: 5000 });
  });

  test('accept quote changes status', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await page.waitForLoadState('networkidle');

    // Click accept button
    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForTimeout(1000);

    // Verify status changed
    await expect(page.getByText(/accepted/i)).toBeVisible({ timeout: 5000 });
  });

  test('decline quote changes status', async ({ page }) => {
    // Need to create a new quote for this test since the beforeEach one might be accepted
    // Auth state is loaded from storage
    await page.goto('/dashboard');

    // Create another quote
    const declineTitle = `Decline Quote ${Date.now()}`;
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill(declineTitle);
    await page.getByLabel(/client name/i).fill('Decline Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /mark as sent|send/i }).click();
    await page.waitForTimeout(1000);

    // Extract share token
    const shareText = await page.getByText(/\/q\//).textContent();
    const match = shareText?.match(/\/q\/([A-Za-z0-9_-]+)/);
    const declineToken = match?.[1];

    // Clear cookies and go to public view
    await page.context().clearCookies();
    await page.goto(`/q/${declineToken}`);
    await page.waitForLoadState('networkidle');

    // Click decline button
    await page.getByRole('button', { name: /decline/i }).click();
    await page.waitForTimeout(1000);

    // Verify status changed
    await expect(page.getByText(/declined/i)).toBeVisible({ timeout: 5000 });
  });

  test('accepted quote shows payment option', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await page.waitForLoadState('networkidle');

    // Accept the quote first
    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForTimeout(1000);

    // Verify pay button appears
    await expect(page.getByRole('button', { name: /pay/i })).toBeVisible({ timeout: 5000 });
  });

  test('actions hidden after quote is accepted', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await page.waitForLoadState('networkidle');

    // Accept the quote
    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForTimeout(1000);

    // Accept/Decline buttons should be hidden
    await expect(page.getByRole('button', { name: /^accept$/i })).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('button', { name: /^decline$/i })).not.toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Expired Quote', () => {
  test('expired quote shows warning', async ({ page }) => {
    // Auth state is loaded from storage
    await page.goto('/dashboard');

    // Create a quote with past valid until date
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Expired Quote');
    await page.getByLabel(/client name/i).fill('Expired Client');

    // Set valid until to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    await page.getByLabel(/valid until|expir/i).fill(dateStr);

    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /mark as sent|send/i }).click();
    await page.waitForTimeout(1000);

    // Extract share token
    const shareText = await page.getByText(/\/q\//).textContent();
    const match = shareText?.match(/\/q\/([A-Za-z0-9_-]+)/);
    const expiredToken = match?.[1];

    // Clear cookies and view public quote
    await page.context().clearCookies();
    await page.goto(`/q/${expiredToken}`);
    await page.waitForLoadState('networkidle');

    // Verify expiration warning is shown
    await expect(page.getByText(/expired/i)).toBeVisible({ timeout: 5000 });

    // Verify action buttons are hidden or disabled
    const acceptButton = page.getByRole('button', { name: /accept/i });
    const declineButton = page.getByRole('button', { name: /decline/i });

    // Either buttons don't exist or they're disabled
    const acceptVisible = await acceptButton.isVisible();
    const declineVisible = await declineButton.isVisible();

    if (acceptVisible || declineVisible) {
      // If visible, they should be disabled
      if (acceptVisible) {
        await expect(acceptButton).toBeDisabled();
      }
      if (declineVisible) {
        await expect(declineButton).toBeDisabled();
      }
    }
    // If not visible, that's also correct behavior
  });
});
