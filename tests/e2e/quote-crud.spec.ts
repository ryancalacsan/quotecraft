import { expect, test } from '@playwright/test';

test.describe('Quote CRUD Operations', () => {
  test.setTimeout(90000);

  // Auth state is loaded from storage, just navigate to dashboard
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('create new quote', async ({ page }) => {
    // Navigate to new quote page
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    // Fill in required fields
    await page.getByLabel(/title/i).fill('E2E Test Quote');
    await page.getByLabel(/client name/i).fill('E2E Test Client');

    // Submit the form
    await page.getByRole('button', { name: /create quote|save/i }).click();

    // Wait for redirect to edit page
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Verify we're on the edit page (heading says "Edit Quote", not the quote title)
    await expect(page.getByRole('heading', { name: 'Edit Quote' })).toBeVisible({ timeout: 5000 });
  });

  test('add line item to quote', async ({ page }) => {
    // Set wider viewport to ensure desktop layout is used (xl breakpoint is 1280px)
    await page.setViewportSize({ width: 1400, height: 900 });

    // Navigate to new quote
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    // Create the quote first
    await page.getByLabel(/title/i).fill('Quote with Line Items');
    await page.getByLabel(/client name/i).fill('Line Item Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Now add a line item - button may say "Add Item" or "Add Your First Item"
    const addButton = page.getByRole('button', { name: /add.*item/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for line item input to appear (web-first assertion auto-retries)
    const descriptionInput = page.getByPlaceholder('Description').first();
    await expect(descriptionInput).toBeVisible({ timeout: 10000 });
    await descriptionInput.fill('Development Work');

    const rateInput = page.getByPlaceholder('Rate').first();
    await expect(rateInput).toBeVisible({ timeout: 5000 });
    await rateInput.fill('150');

    // Verify the description input has the expected value
    await expect(descriptionInput).toHaveValue('Development Work', { timeout: 5000 });
  });

  test('edit quote metadata', async ({ page }) => {
    // Create a quote first
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Original Title');
    await page.getByLabel(/client name/i).fill('Original Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Now edit the title (fill() clears the input automatically)
    const titleInput = page.getByLabel(/title/i);
    await titleInput.fill('Updated Title');

    // Save changes
    const saveButton = page.getByRole('button', { name: /save|update/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();

    // Wait for save to complete before reloading
    await page.waitForLoadState('networkidle');

    // Reload and verify the title was updated
    await page.reload();
    await expect(page.getByLabel(/title/i)).toHaveValue('Updated Title', { timeout: 10000 });
  });

  test('delete quote from dashboard', async ({ page }) => {
    // Create a quote to delete
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    const quoteTitle = `Quote to Delete ${Date.now()}`;
    await page.getByLabel(/title/i).fill(quoteTitle);
    await page.getByLabel(/client name/i).fill('Delete Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Go back to dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

    // Find the quote and verify it's visible
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 5000 });

    // Click the dropdown trigger (aria-label is "Actions for {title}")
    const dropdownTrigger = page.getByRole('button', {
      name: new RegExp(`actions for ${quoteTitle}`, 'i'),
    });
    await expect(dropdownTrigger).toBeVisible({ timeout: 5000 });
    await dropdownTrigger.click();

    // Wait for dropdown menu to appear
    const deleteMenuItem = page.getByRole('menuitem', { name: /delete/i });
    await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
    await deleteMenuItem.click();

    // Verify the quote is no longer visible (web-first assertion auto-retries)
    await expect(page.getByText(quoteTitle)).not.toBeVisible({ timeout: 10000 });
  });

  test('duplicate quote from dashboard', async ({ page }) => {
    // Create a quote to duplicate with unique title
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    const quoteTitle = `Quote to Duplicate ${Date.now()}`;
    await page.getByLabel(/title/i).fill(quoteTitle);
    await page.getByLabel(/client name/i).fill('Duplicate Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Go back to dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

    // Find the quote and verify it's visible
    await expect(page.getByText(quoteTitle)).toBeVisible({ timeout: 5000 });

    // Click the dropdown trigger (aria-label is "Actions for {title}")
    const dropdownTrigger = page.getByRole('button', {
      name: new RegExp(`actions for ${quoteTitle}`, 'i'),
    });
    await expect(dropdownTrigger).toBeVisible({ timeout: 5000 });
    await dropdownTrigger.click();

    // Wait for dropdown menu to appear and click duplicate
    const duplicateMenuItem = page.getByRole('menuitem', { name: /duplicate/i });
    await expect(duplicateMenuItem).toBeVisible({ timeout: 5000 });
    await duplicateMenuItem.click();

    // Verify the duplicated quote appears (with Copy suffix) - web-first assertion auto-retries
    await expect(page.getByText(`${quoteTitle} (Copy)`)).toBeVisible({ timeout: 10000 });
  });

  test('view quote list on dashboard', async ({ page }) => {
    // Dashboard should already be loaded from beforeEach
    // Verify quote list is visible
    const quoteSection = page
      .getByRole('heading', { name: /recent quotes|quotes/i })
      .or(page.locator('[data-testid="quote-list"]'));

    await expect(quoteSection).toBeVisible({ timeout: 5000 });
  });

  test('navigate to quote from dashboard', async ({ page }) => {
    // Create a quote first
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Navigable Quote');
    await page.getByLabel(/client name/i).fill('Nav Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Go back to dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });

    // Find and click on the quote
    const quoteLink = page.getByText('Navigable Quote');
    await expect(quoteLink).toBeVisible({ timeout: 5000 });
    await quoteLink.click();

    // Should navigate to quote detail or edit page
    await page.waitForURL(/\/quotes\/[^/]+/, { timeout: 10000 });
  });

  test('real-time pricing updates when adding line items', async ({ page }) => {
    // Set wider viewport to ensure desktop layout is used
    await page.setViewportSize({ width: 1400, height: 900 });

    // Create a quote
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Pricing Test Quote');
    await page.getByLabel(/client name/i).fill('Pricing Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Add a line item - button may say "Add Item" or "Add Your First Item"
    const addButton = page.getByRole('button', { name: /add.*item/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for line item input to appear (web-first assertion auto-retries)
    const descriptionInput = page.getByPlaceholder('Description').first();
    await expect(descriptionInput).toBeVisible({ timeout: 10000 });
    await descriptionInput.fill('Test Service');

    const rateInput = page.getByPlaceholder('Rate').first();
    await expect(rateInput).toBeVisible({ timeout: 5000 });
    await rateInput.fill('100');

    const qtyInput = page.getByPlaceholder('Qty').first();
    await expect(qtyInput).toBeVisible({ timeout: 5000 });
    await qtyInput.fill('2');

    // Verify total shows $200 (100 * 2) - web-first assertion auto-retries
    // Use .first() since $200 appears in multiple places (line item total, subtotal, grand total)
    await expect(page.getByText(/\$200/).first()).toBeVisible({ timeout: 10000 });
  });
});
