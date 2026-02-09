import { expect, test } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /professional quotes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /try demo/i }).first()).toBeVisible();
});

test('landing page has feature sections', async ({ page }) => {
  await page.goto('/');
  // Check core features are visible (using heading role for specificity)
  await expect(page.getByRole('heading', { name: 'Quote Builder' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Shareable Links' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stripe Payments' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dark Mode' })).toBeVisible();
});
