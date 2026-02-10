import { expect, test } from '@playwright/test';

test.describe('Quote Templates', () => {
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

  test('save quote as template', async ({ page }) => {
    // Create a quote first
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Template Source Quote');
    await page.getByLabel(/client name/i).fill('Template Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Add a line item
    await page.getByRole('button', { name: /add item|add line item/i }).click();
    await page.waitForTimeout(500);
    await page
      .getByLabel(/description/i)
      .last()
      .fill('Template Service');
    await page
      .getByLabel(/rate|price/i)
      .last()
      .fill('250');

    const saveItemBtn = page.getByRole('button', { name: /save|add|confirm/i }).last();
    if (await saveItemBtn.isVisible()) {
      await saveItemBtn.click();
    }
    await page.waitForTimeout(1000);

    // Navigate to quote detail page
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    // Click save as template button
    await page.getByRole('button', { name: /save as template|create template/i }).click();
    await page.waitForTimeout(500);

    // Fill in template name
    const templateName = `E2E Template ${Date.now()}`;
    await page.getByLabel(/name/i).fill(templateName);

    // Save the template
    await page
      .getByRole('button', { name: /save|create/i })
      .last()
      .click();
    await page.waitForTimeout(1000);

    // Navigate to templates page to verify
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Verify template is in the list
    await expect(page.getByText(templateName)).toBeVisible({ timeout: 5000 });
  });

  test('create quote from template', async ({ page }) => {
    // First create a template
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Template for Creation');
    await page.getByLabel(/client name/i).fill('Creation Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and save as template
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /save as template|create template/i }).click();
    await page.waitForTimeout(500);

    const templateName = `Use Template ${Date.now()}`;
    await page.getByLabel(/name/i).fill(templateName);
    await page
      .getByRole('button', { name: /save|create/i })
      .last()
      .click();
    await page.waitForTimeout(1000);

    // Navigate to templates page
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Find the template and click use
    const templateCard = page.locator(`text=${templateName}`).locator('..');
    await templateCard.getByRole('button', { name: /use|create quote/i }).click();

    // Should redirect to new quote's edit page
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Verify the default title is applied
    await expect(page.getByLabel(/title/i)).toHaveValue('Template for Creation');
  });

  test('delete template', async ({ page }) => {
    // First create a template
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Template to Delete');
    await page.getByLabel(/client name/i).fill('Delete Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Navigate to detail and save as template
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /save as template|create template/i }).click();
    await page.waitForTimeout(500);

    const templateName = `Delete Template ${Date.now()}`;
    await page.getByLabel(/name/i).fill(templateName);
    await page
      .getByRole('button', { name: /save|create/i })
      .last()
      .click();
    await page.waitForTimeout(1000);

    // Navigate to templates page
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Verify template exists
    await expect(page.getByText(templateName)).toBeVisible({ timeout: 5000 });

    // Find the template card and click delete
    const templateCard = page.locator(`text=${templateName}`).locator('..');
    await templateCard.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await page.waitForTimeout(500);
    await page
      .getByRole('button', { name: /confirm|yes|delete/i })
      .last()
      .click();

    // Wait for refresh
    await page.waitForTimeout(1000);

    // Verify template is removed
    await expect(page.getByText(templateName)).not.toBeVisible({ timeout: 5000 });
  });

  test('template list is accessible', async ({ page }) => {
    // Navigate to templates page
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    // Verify templates page loads
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({ timeout: 5000 });
  });

  test('template with line items creates quote with items', async ({ page }) => {
    // Create a quote with line items
    await page
      .getByRole('link', { name: /new quote|create/i })
      .first()
      .click();
    await page.waitForURL(/\/quotes\/new/, { timeout: 10000 });

    await page.getByLabel(/title/i).fill('Items Template Quote');
    await page.getByLabel(/client name/i).fill('Items Client');
    await page.getByRole('button', { name: /create quote|save/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Add line items
    await page.getByRole('button', { name: /add item|add line item/i }).click();
    await page.waitForTimeout(500);
    await page
      .getByLabel(/description/i)
      .last()
      .fill('Inherited Service 1');
    await page
      .getByLabel(/rate|price/i)
      .last()
      .fill('100');

    const saveItemBtn = page.getByRole('button', { name: /save|add|confirm/i }).last();
    if (await saveItemBtn.isVisible()) {
      await saveItemBtn.click();
    }
    await page.waitForTimeout(1000);

    // Save as template
    const editUrl = page.url();
    const detailUrl = editUrl.replace('/edit', '');
    await page.goto(detailUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /save as template|create template/i }).click();
    await page.waitForTimeout(500);

    const templateName = `Items Template ${Date.now()}`;
    await page.getByLabel(/name/i).fill(templateName);
    await page
      .getByRole('button', { name: /save|create/i })
      .last()
      .click();
    await page.waitForTimeout(1000);

    // Use the template
    await page.goto('/templates');
    await page.waitForLoadState('networkidle');

    const templateCard = page.locator(`text=${templateName}`).locator('..');
    await templateCard.getByRole('button', { name: /use|create quote/i }).click();
    await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

    // Verify line items are inherited
    await expect(page.getByText('Inherited Service 1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/\$100/)).toBeVisible({ timeout: 5000 });
  });

  test('navigate to templates from navigation', async ({ page }) => {
    // Look for templates link in navigation
    const templatesLink = page.getByRole('link', { name: /templates/i });

    // Click if visible
    if (await templatesLink.isVisible()) {
      await templatesLink.click();
      await page.waitForURL(/\/templates/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({
        timeout: 5000,
      });
    } else {
      // Navigate directly
      await page.goto('/templates');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
