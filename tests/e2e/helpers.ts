/**
 * E2E test helpers for Playwright tests
 *
 * Provides utilities for common operations like demo login,
 * waiting for data, and navigating authenticated flows.
 */

import { type Page, expect } from '@playwright/test';

/**
 * Performs demo login by clicking the Try Demo button on the landing page.
 * Waits for redirect to dashboard and verifies demo banner is visible.
 */
export async function loginAsDemo(page: Page): Promise<void> {
  // Start from landing page
  await page.goto('/');

  // Click the first "Try Demo" button (there may be multiple)
  await page
    .getByRole('button', { name: /try demo/i })
    .first()
    .click();

  // Wait for redirect to dashboard (may take a moment for auth)
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });

  // Verify we're logged in by checking for dashboard elements
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
}

/**
 * Waits for demo data to be loaded after login.
 * Checks for the presence of demo quotes in the list.
 */
export async function waitForDemoData(page: Page): Promise<void> {
  // Demo data includes pre-seeded quotes
  // Wait for the quote list to have items
  await expect(page.locator('[data-testid="quote-list"]').or(page.getByText(/quote/i))).toBeVisible(
    { timeout: 10000 },
  );
}

/**
 * Creates a new quote with the given details.
 * Returns the quote ID from the URL after creation.
 */
export async function createQuote(
  page: Page,
  options: {
    title: string;
    clientName: string;
    clientEmail?: string;
    notes?: string;
  },
): Promise<string> {
  // Navigate to new quote page
  await page.goto('/quotes/new');

  // Fill in required fields
  await page.getByLabel(/title/i).fill(options.title);
  await page.getByLabel(/client name/i).fill(options.clientName);

  if (options.clientEmail) {
    await page.getByLabel(/client email/i).fill(options.clientEmail);
  }

  if (options.notes) {
    await page.getByLabel(/notes/i).fill(options.notes);
  }

  // Submit the form
  await page.getByRole('button', { name: /create quote|save/i }).click();

  // Wait for redirect to edit page
  await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

  // Extract quote ID from URL
  const url = page.url();
  const match = url.match(/\/quotes\/([^/]+)\/edit/);
  if (!match) {
    throw new Error(`Could not extract quote ID from URL: ${url}`);
  }

  return match[1];
}

/**
 * Adds a line item to the current quote being edited.
 */
export async function addLineItem(
  page: Page,
  options: {
    description: string;
    rate: string;
    quantity?: string;
    pricingType?: 'fixed' | 'hourly' | 'per_unit';
  },
): Promise<void> {
  // Click add item button
  await page.getByRole('button', { name: /add item|add line item/i }).click();

  // Wait for the form/dialog to appear
  await page.waitForTimeout(500);

  // Fill in the line item details
  const descriptionInput = page.getByLabel(/description/i).last();
  await descriptionInput.fill(options.description);

  const rateInput = page.getByLabel(/rate|price/i).last();
  await rateInput.fill(options.rate);

  if (options.quantity) {
    const quantityInput = page.getByLabel(/quantity/i).last();
    await quantityInput.fill(options.quantity);
  }

  if (options.pricingType) {
    const pricingSelect = page.getByLabel(/pricing type|type/i).last();
    await pricingSelect.selectOption(options.pricingType);
  }

  // Save the line item (may be auto-saved or require button click)
  const saveButton = page.getByRole('button', { name: /save|add|confirm/i }).last();
  if (await saveButton.isVisible()) {
    await saveButton.click();
  }
}

/**
 * Navigates to a specific quote's detail page.
 */
export async function goToQuote(page: Page, quoteId: string): Promise<void> {
  await page.goto(`/quotes/${quoteId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigates to a specific quote's edit page.
 */
export async function goToQuoteEdit(page: Page, quoteId: string): Promise<void> {
  await page.goto(`/quotes/${quoteId}/edit`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigates to a public quote view using share token.
 */
export async function goToPublicQuote(page: Page, shareToken: string): Promise<void> {
  await page.goto(`/q/${shareToken}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Gets the share token from a quote's detail page.
 */
export async function getShareToken(page: Page): Promise<string> {
  // Look for the share link or copy button
  const shareLink = page.locator('[data-testid="share-link"]').or(page.getByText(/\/q\//));

  const text = await shareLink.textContent();
  if (!text) {
    throw new Error('Could not find share token on page');
  }

  const match = text.match(/\/q\/([A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error(`Could not extract share token from: ${text}`);
  }

  return match[1];
}

/**
 * Deletes a quote from the detail page.
 */
export async function deleteQuote(page: Page): Promise<void> {
  // Click delete button
  await page.getByRole('button', { name: /delete/i }).click();

  // Wait for confirmation dialog
  await page.waitForTimeout(500);

  // Confirm deletion
  await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Duplicates a quote from the detail page.
 */
export async function duplicateQuote(page: Page): Promise<string> {
  // Click duplicate button
  await page.getByRole('button', { name: /duplicate|copy/i }).click();

  // Wait for redirect to new quote's edit page
  await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

  // Extract new quote ID
  const url = page.url();
  const match = url.match(/\/quotes\/([^/]+)\/edit/);
  if (!match) {
    throw new Error(`Could not extract quote ID from URL: ${url}`);
  }

  return match[1];
}

/**
 * Changes a quote's status (e.g., draft -> sent)
 */
export async function updateQuoteStatus(page: Page, status: string): Promise<void> {
  // Look for status button or dropdown
  await page.getByRole('button', { name: new RegExp(`mark as ${status}|${status}`, 'i') }).click();

  // Wait for page to update
  await page.waitForTimeout(1000);
}

/**
 * Accepts a quote from the public view.
 */
export async function acceptQuote(page: Page): Promise<void> {
  await page.getByRole('button', { name: /accept/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Declines a quote from the public view.
 */
export async function declineQuote(page: Page): Promise<void> {
  await page.getByRole('button', { name: /decline/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Creates a template from the current quote.
 */
export async function saveAsTemplate(
  page: Page,
  options: {
    name: string;
    description?: string;
  },
): Promise<void> {
  // Click save as template button
  await page.getByRole('button', { name: /save as template|create template/i }).click();

  // Fill in template details
  await page.getByLabel(/name/i).fill(options.name);

  if (options.description) {
    await page.getByLabel(/description/i).fill(options.description);
  }

  // Save
  await page
    .getByRole('button', { name: /save|create/i })
    .last()
    .click();

  // Wait for success
  await page.waitForTimeout(1000);
}

/**
 * Navigates to the templates list.
 */
export async function goToTemplates(page: Page): Promise<void> {
  await page.goto('/templates');
  await page.waitForLoadState('networkidle');
}

/**
 * Creates a quote from a template.
 */
export async function useTemplate(page: Page, templateName: string): Promise<string> {
  // Find the template and click use
  const templateCard = page.locator(`text=${templateName}`).locator('..');
  await templateCard.getByRole('button', { name: /use|create quote/i }).click();

  // Wait for redirect to new quote's edit page
  await page.waitForURL(/\/quotes\/[^/]+\/edit/, { timeout: 10000 });

  // Extract quote ID
  const url = page.url();
  const match = url.match(/\/quotes\/([^/]+)\/edit/);
  if (!match) {
    throw new Error(`Could not extract quote ID from URL: ${url}`);
  }

  return match[1];
}

/**
 * Deletes a template.
 */
export async function deleteTemplate(page: Page, templateName: string): Promise<void> {
  // Find the template card and click delete
  const templateCard = page.locator(`text=${templateName}`).locator('..');
  await templateCard.getByRole('button', { name: /delete/i }).click();

  // Confirm deletion
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

  // Wait for refresh
  await page.waitForTimeout(1000);
}

/**
 * Checks if an element contains specific text.
 */
export async function hasText(page: Page, text: string): Promise<boolean> {
  const element = page.getByText(text);
  return element.isVisible();
}

/**
 * Gets the value of a cookie by name.
 */
export async function getCookie(page: Page, name: string): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === name);
  return cookie?.value;
}
