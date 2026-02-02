import { expect, test } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /professional quotes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /try demo/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up free/i }).first()).toBeVisible();
});

test('landing page has feature sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Quote Builder')).toBeVisible();
  await expect(page.getByText('Shareable Links')).toBeVisible();
  await expect(page.getByText('Stripe Payments')).toBeVisible();
});
