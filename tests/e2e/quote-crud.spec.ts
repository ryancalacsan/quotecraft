import { expect, test } from '@playwright/test';

test.describe('Quote CRUD Operations', () => {
  // Increase timeout for tests involving auth
  test.setTimeout(90000);

  // Login as demo user before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: /try demo/i })
      .first()
      .click();
    await page.waitForURL(/\/dashboard/, { timeout: 45000 });
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 15000,
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

    // Verify we're on the edit page
    await expect(page.getByText('E2E Test Quote')).toBeVisible({ timeout: 5000 });
  });

  test('add line item to quote', async ({ page }) => {
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

    // Now add a line item
    await page.getByRole('button', { name: /add item|add line item/i }).click();

    // Wait for form to appear
    await page.waitForTimeout(500);

    // Fill in line item details - look for the last instance of each field
    const descriptionInput = page.getByLabel(/description/i).last();
    await descriptionInput.fill('Development Work');

    const rateInput = page.getByLabel(/rate|price/i).last();
    await rateInput.fill('150');

    // Save the line item if there's a save button
    const saveButton = page.getByRole('button', { name: /save|add|confirm/i }).last();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify line item appears in the list
    await expect(page.getByText('Development Work')).toBeVisible({ timeout: 5000 });
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
    await page.getByLabel(/title/i).fill('Updated Title');

    // Save changes
    await page
      .getByRole('button', { name: /save|update/i })
      .first()
      .click();

    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Verify the title was updated (may need to reload)
    await page.reload();
    await expect(page.getByLabel(/title/i)).toHaveValue('Updated Title');
  });

  test('delete quote', async ({ page }) => {
    // Create a quote to delete
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Quote to Delete');
    await page.getByLabel(/client name/i).fill('Delete Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to quote detail page (from edit URL, remove /edit)
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();

    // Wait for confirmation dialog
    await page.waitForTimeout(500);

    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
    await confirmButton.click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('duplicate quote', async ({ page }) => {
    // Create a quote to duplicate
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Quote to Duplicate');
    await page.getByLabel(/client name/i).fill('Duplicate Test Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to quote detail page
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    // Click duplicate button
    await page.getByRole('button', { name: /duplicate|copy/i }).click();

    // Should redirect to new quote's edit page
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Verify the title has (Copy) suffix
    await expect(page.getByLabel(/title/i)).toHaveValue('Quote to Duplicate (Copy)');
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
    await page.waitForLoadState('networkidle');

    // Find and click on the quote
    await page.getByText('Navigable Quote').click();

    // Should navigate to quote detail or edit page
    await page.waitForURL(/\/quotes\/[^/]+/, { timeout: 10000 });
  });

  test('real-time pricing updates when adding line items', async ({ page }) => {
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

    // Add a line item with specific rate
    await page.getByRole('button', { name: /add item|add line item/i }).click();
    await page.waitForTimeout(500);

    await page
      .getByLabel(/description/i)
      .last()
      .fill('Test Service');
    await page
      .getByLabel(/rate|price/i)
      .last()
      .fill('100');
    await page
      .getByLabel(/quantity/i)
      .last()
      .fill('2');

    // Look for a save button and click if visible
    const saveButton = page.getByRole('button', { name: /save|add|confirm/i }).last();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }

    // Wait for pricing to update
    await page.waitForTimeout(1000);

    // Verify total shows $200 (100 * 2)
    await expect(page.getByText(/\$200/)).toBeVisible({ timeout: 5000 });
  });
});
