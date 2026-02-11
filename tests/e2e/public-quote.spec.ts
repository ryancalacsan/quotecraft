import { expect, test } from '@playwright/test';

test.describe('Public Quote View', () => {
  // Mark as slow - beforeEach creates and sends a quote for each test
  test.slow();
  test.setTimeout(90000);

  let shareToken: string;
  let quoteTitle: string;

  // Helper function to create and send a quote
  async function createAndSendQuote(
    page: import('@playwright/test').Page,
    title: string,
    clientName: string,
  ): Promise<string> {
    // Set wider viewport to ensure desktop layout is used
    await page.setViewportSize({ width: 1400, height: 900 });

    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill(title);
    await page.getByLabel(/client name/i).fill(clientName);
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Add a line item for pricing using placeholders
    const addButton = page.getByRole('button', { name: /add.*item/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for line item input to appear
    const descriptionInput = page.getByPlaceholder('Description').first();
    await expect(descriptionInput).toBeVisible({ timeout: 10000 });
    await descriptionInput.fill('Test Service');

    const rateInput = page.getByPlaceholder('Rate').first();
    await expect(rateInput).toBeVisible({ timeout: 5000 });
    await rateInput.fill('500');

    // Verify the input was filled
    await expect(descriptionInput).toHaveValue('Test Service', { timeout: 5000 });

    // Click Save Line Items button to persist the line item
    const saveLineItemsBtn = page.getByRole('button', { name: /save line items/i });
    await expect(saveLineItemsBtn).toBeVisible({ timeout: 5000 });
    await saveLineItemsBtn.click();

    // Wait for save confirmation toast
    await expect(page.getByText(/line items saved/i)).toBeVisible({ timeout: 10000 });

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10000 });

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

    // Wait for modal to close and network to settle before reload
    await expect(markAsSentBtn).not.toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.reload();
    await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10000 });

    const shareInput = page.locator('input[readonly]').first();
    await expect(shareInput).toBeVisible({ timeout: 10000 });
    const shareUrl = await shareInput.inputValue();
    const match = shareUrl.match(/\/q\/([A-Za-z0-9_-]+)/);
    return match?.[1] || '';
  }

  // Create a sent quote and get its share token before tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

    quoteTitle = `Public Quote ${Date.now()}`;
    shareToken = await createAndSendQuote(page, quoteTitle, 'Public View Client');
  });

  test('public quote view loads without authentication', async ({ page }) => {
    // Clear cookies to ensure we're not authenticated
    await page.context().clearCookies();

    // Navigate to public quote view
    await page.goto(`/q/${shareToken}`);

    // Verify quote details are visible
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Public View Client')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Service').first()).toBeVisible({ timeout: 5000 });
  });

  test('public quote shows pricing', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);

    // Verify pricing is visible
    await expect(page.getByText(/\$500/).first()).toBeVisible({ timeout: 10000 });
  });

  test('accept quote changes status', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 10000 });

    // Click accept button
    const acceptBtn = page.getByRole('button', { name: /accept/i });
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();

    // Verify status changed
    await expect(page.getByText(/accepted/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('decline quote changes status', async ({ page }) => {
    // Create a separate quote for decline test
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

    const declineTitle = `Decline Quote ${Date.now()}`;
    const declineToken = await createAndSendQuote(page, declineTitle, 'Decline Client');

    // Clear cookies and go to public view
    await page.context().clearCookies();
    await page.goto(`/q/${declineToken}`);
    await expect(page.getByText(declineTitle)).toBeVisible({ timeout: 10000 });

    // Click decline button
    const declineBtn = page.getByRole('button', { name: /decline/i });
    await expect(declineBtn).toBeVisible({ timeout: 5000 });
    await declineBtn.click();

    // Verify status changed
    await expect(page.getByText(/declined/i)).toBeVisible({ timeout: 10000 });
  });

  test('accepted quote shows payment option', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 10000 });

    // Accept the quote first
    const acceptBtn = page.getByRole('button', { name: /accept/i });
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();

    // Verify pay button appears
    await expect(page.getByRole('button', { name: /pay/i })).toBeVisible({ timeout: 10000 });
  });

  test('actions hidden after quote is accepted', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/q/${shareToken}`);
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 10000 });

    // Accept the quote
    const acceptBtn = page.getByRole('button', { name: /accept/i });
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();

    // Wait for status to change
    await expect(page.getByText(/accepted/i).first()).toBeVisible({ timeout: 10000 });

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
  // Mark as slow - test creates and sends an expired quote
  test.slow();
  test.setTimeout(90000);

  test('expired quote shows warning', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

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
    await page.getByLabel(/valid until/i).fill(dateStr);

    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and send
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: 'Expired Quote' })).toBeVisible({
      timeout: 10000,
    });

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

    // Wait for success toast confirming status update
    await expect(page.getByText(/quote marked as sent/i)).toBeVisible({ timeout: 10000 });

    // Reload to get the updated page with share link
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Expired Quote' })).toBeVisible({
      timeout: 10000,
    });

    // ShareLinkCard uses Input with readOnly prop
    const shareInput = page.locator('input[readonly]').first();
    await expect(shareInput).toBeVisible({ timeout: 10000 });
    const shareUrl = await shareInput.inputValue();
    const match = shareUrl.match(/\/q\/([A-Za-z0-9_-]+)/);
    const expiredToken = match?.[1];

    // Clear cookies and view public quote
    await page.context().clearCookies();
    await page.goto(`/q/${expiredToken}`);

    // Wait for page to load and verify quote title is visible
    await expect(page.getByRole('heading', { name: 'Expired Quote' })).toBeVisible({
      timeout: 10000,
    });

    // Verify expiration warning is shown
    await expect(page.getByText(/this quote expired/i)).toBeVisible({ timeout: 10000 });

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
