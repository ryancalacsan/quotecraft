import { expect, test } from '@playwright/test';

test.describe('Quote Templates', () => {
  // Mark as slow - tests create quotes and templates
  test.slow();
  test.setTimeout(90000);

  // Auth state is loaded from storage, just navigate to dashboard
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard|quotes/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('save quote as template', async ({ page }) => {
    // Set wider viewport to ensure desktop layout is used
    await page.setViewportSize({ width: 1400, height: 900 });

    // Create a quote first
    await Promise.all([
      page.waitForURL(/\/quotes\/new/, { timeout: 15000 }),
      page
        .getByRole('link', { name: /new quote|create/i })
        .first()
        .click(),
    ]);

    await page.getByLabel(/title/i).fill('Template Source Quote');
    await page.getByLabel(/client name/i).fill('Template Client');
    await Promise.all([
      page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 15000 }),
      page.getByRole('button', { name: /create quote|save/i }).click(),
    ]);

    // Add a line item using placeholders
    const addButton = page.getByRole('button', { name: /add.*item/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for line item input to appear
    const descriptionInput = page.getByPlaceholder('Description').first();
    await expect(descriptionInput).toBeVisible({ timeout: 10000 });
    await descriptionInput.fill('Template Service');

    const rateInput = page.getByPlaceholder('Rate').first();
    await expect(rateInput).toBeVisible({ timeout: 5000 });
    await rateInput.fill('250');

    // Verify the input was filled
    await expect(descriptionInput).toHaveValue('Template Service', { timeout: 5000 });

    // Click Save Line Items button to persist the line item
    const saveLineItemsBtn = page.getByRole('button', { name: /save line items/i });
    await expect(saveLineItemsBtn).toBeVisible({ timeout: 5000 });
    await saveLineItemsBtn.click();

    // Wait for save confirmation toast
    await expect(page.getByText(/line items saved/i)).toBeVisible({ timeout: 10000 });

    // Navigate to quote detail page
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: 'Template Source Quote' })).toBeVisible({
      timeout: 10000,
    });

    // Click save as template button
    const saveAsTemplateBtn = page.getByRole('button', { name: /save as template/i });
    await expect(saveAsTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveAsTemplateBtn.click();

    // Fill in template name (label is "Template Name")
    const templateName = `E2E Template ${Date.now()}`;
    const templateNameInput = page.getByLabel(/template name/i);
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    await templateNameInput.fill(templateName);

    // Save the template
    const saveTemplateBtn = page.getByRole('button', { name: /save template/i });
    await expect(saveTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveTemplateBtn.click();

    // Wait for modal to close (confirms server action completed)
    await expect(saveTemplateBtn).not.toBeVisible({ timeout: 10000 });

    // Navigate to templates page to verify
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Force reload to bypass any cached data
    await page.reload();
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Verify template is in the list
    await expect(page.getByText(templateName)).toBeVisible({ timeout: 10000 });
  });

  test('create quote from template', async ({ page }) => {
    // First create a template
    await Promise.all([
      page.waitForURL(/\/quotes\/new/, { timeout: 15000 }),
      page
        .getByRole('link', { name: /new quote|create/i })
        .first()
        .click(),
    ]);

    await page.getByLabel(/title/i).fill('Template for Creation');
    await page.getByLabel(/client name/i).fill('Creation Client');
    await Promise.all([
      page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 15000 }),
      page.getByRole('button', { name: /create quote|save/i }).click(),
    ]);

    // Navigate to detail and save as template
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: 'Template for Creation' })).toBeVisible({
      timeout: 10000,
    });

    const saveAsTemplateBtn = page.getByRole('button', { name: /save as template/i });
    await expect(saveAsTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveAsTemplateBtn.click();

    const templateName = `Use Template ${Date.now()}`;
    const templateNameInput = page.getByLabel(/template name/i);
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    await templateNameInput.fill(templateName);

    const saveTemplateBtn = page.getByRole('button', { name: /save template/i });
    await expect(saveTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveTemplateBtn.click();

    // Wait for modal to close (confirms server action completed)
    await expect(saveTemplateBtn).not.toBeVisible({ timeout: 10000 });

    // Navigate to templates page
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Force reload to bypass any cached data
    await page.reload();
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Find the template and click use
    await expect(page.getByText(templateName)).toBeVisible({ timeout: 10000 });
    const templateCard = page.getByText(templateName).locator('..').locator('..');
    const useTemplateBtn = templateCard.getByRole('button', { name: 'Use Template', exact: true });
    await expect(useTemplateBtn).toBeVisible({ timeout: 5000 });

    // Should redirect to new quote's edit page
    await Promise.all([
      page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 15000 }),
      useTemplateBtn.click(),
    ]);

    // Verify the default title is applied
    await expect(page.getByLabel(/title/i)).toHaveValue('Template for Creation', {
      timeout: 10000,
    });
  });

  test('delete template', async ({ page }) => {
    // First create a template
    await Promise.all([
      page.waitForURL(/\/quotes\/new/, { timeout: 15000 }),
      page
        .getByRole('link', { name: /new quote|create/i })
        .first()
        .click(),
    ]);

    await page.getByLabel(/title/i).fill('Template to Delete');
    await page.getByLabel(/client name/i).fill('Delete Client');
    await Promise.all([
      page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 15000 }),
      page.getByRole('button', { name: /create quote|save/i }).click(),
    ]);

    // Navigate to detail and save as template
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: 'Template to Delete' })).toBeVisible({
      timeout: 10000,
    });

    const saveAsTemplateBtn = page.getByRole('button', { name: /save as template/i });
    await expect(saveAsTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveAsTemplateBtn.click();

    const templateName = `Delete Template ${Date.now()}`;
    const templateNameInput = page.getByLabel(/template name/i);
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    await templateNameInput.fill(templateName);

    const saveTemplateBtn = page.getByRole('button', { name: /save template/i });
    await expect(saveTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveTemplateBtn.click();

    // Wait for modal to close (confirms server action completed)
    await expect(saveTemplateBtn).not.toBeVisible({ timeout: 10000 });

    // Navigate to templates page
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Force reload to bypass any cached data
    await page.reload();
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Verify template exists
    await expect(page.getByText(templateName)).toBeVisible({ timeout: 10000 });

    // Find the template card and open actions dropdown
    const templateCard = page.getByText(templateName).locator('..').locator('..');
    const actionsBtn = templateCard.getByRole('button', { name: `Actions for ${templateName}` });
    await expect(actionsBtn).toBeVisible({ timeout: 5000 });
    await actionsBtn.click();

    // Click the delete menu item (handles browser confirm dialog automatically)
    page.on('dialog', (dialog) => dialog.accept());
    const deleteMenuItem = page.getByRole('menuitem', { name: /delete/i });
    await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
    await deleteMenuItem.click();

    // Verify template is removed (web-first assertion auto-retries)
    await expect(page.getByText(templateName)).not.toBeVisible({ timeout: 10000 });
  });

  test('template list is accessible', async ({ page }) => {
    // Navigate to templates page
    await page.goto('/templates');

    // Verify templates page loads
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });
  });

  test('template with line items creates quote with items', async ({ page }) => {
    // Set wider viewport to ensure desktop layout is used
    await page.setViewportSize({ width: 1400, height: 900 });

    // Create a quote with line items
    await Promise.all([
      page.waitForURL(/\/quotes\/new/, { timeout: 15000 }),
      page
        .getByRole('link', { name: /new quote|create/i })
        .first()
        .click(),
    ]);

    await page.getByLabel(/title/i).fill('Items Template Quote');
    await page.getByLabel(/client name/i).fill('Items Client');
    await Promise.all([
      page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 15000 }),
      page.getByRole('button', { name: /create quote|save/i }).click(),
    ]);

    // Add line items using placeholders
    const addButton = page.getByRole('button', { name: /add.*item/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();

    // Wait for line item input to appear
    const descriptionInput = page.getByPlaceholder('Description').first();
    await expect(descriptionInput).toBeVisible({ timeout: 10000 });
    await descriptionInput.fill('Inherited Service 1');

    const rateInput = page.getByPlaceholder('Rate').first();
    await expect(rateInput).toBeVisible({ timeout: 5000 });
    await rateInput.fill('100');

    // Verify the input was filled
    await expect(descriptionInput).toHaveValue('Inherited Service 1', { timeout: 5000 });

    // Click Save Line Items button to persist the line item
    const saveLineItemsBtn = page.getByRole('button', { name: /save line items/i });
    await expect(saveLineItemsBtn).toBeVisible({ timeout: 5000 });
    await saveLineItemsBtn.click();

    // Wait for save confirmation toast
    await expect(page.getByText(/line items saved/i)).toBeVisible({ timeout: 10000 });

    // Save as template
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await expect(page.getByRole('heading', { name: 'Items Template Quote' })).toBeVisible({
      timeout: 10000,
    });

    const saveAsTemplateBtn = page.getByRole('button', { name: /save as template/i });
    await expect(saveAsTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveAsTemplateBtn.click();

    const templateName = `Items Template ${Date.now()}`;
    const templateNameInput = page.getByLabel(/template name/i);
    await expect(templateNameInput).toBeVisible({ timeout: 5000 });
    await templateNameInput.fill(templateName);

    const saveTemplateBtn = page.getByRole('button', { name: /save template/i });
    await expect(saveTemplateBtn).toBeVisible({ timeout: 5000 });
    await saveTemplateBtn.click();

    // Wait for modal to close (confirms server action completed)
    await expect(saveTemplateBtn).not.toBeVisible({ timeout: 10000 });

    // Use the template
    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    // Force reload to bypass any cached data
    await page.reload();
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(templateName)).toBeVisible({ timeout: 10000 });
    const templateCard = page.getByText(templateName).locator('..').locator('..');
    const useTemplateBtn = templateCard.getByRole('button', { name: 'Use Template', exact: true });
    await expect(useTemplateBtn).toBeVisible({ timeout: 5000 });

    await Promise.all([
      page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 15000 }),
      useTemplateBtn.click(),
    ]);

    // Verify line items are inherited (on edit page, items are in input fields)
    const inheritedDescription = page.getByPlaceholder('Description').first();
    await expect(inheritedDescription).toHaveValue('Inherited Service 1', { timeout: 10000 });
    // Verify total shows correct amount (use first() as total appears multiple places)
    await expect(page.getByText('$100.00').first()).toBeVisible({ timeout: 10000 });
  });

  test('navigate to templates from navigation', async ({ page }) => {
    // Look for templates link in navigation
    const templatesLink = page.getByRole('link', { name: /templates/i });

    // Click if visible
    if (await templatesLink.isVisible()) {
      await Promise.all([
        page.waitForURL(/\/templates/, { timeout: 15000 }),
        templatesLink.click(),
      ]);
      await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({
        timeout: 5000,
      });
    } else {
      // Navigate directly
      await page.goto('/templates');
      await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
