import { expect, test } from '@playwright/test';

/**
 * Smoke test for the E2E harness itself: the dev server boots, the app is
 * reachable at baseURL, and the root route renders. Replace with real route
 * coverage as pages land; e2e/ mirrors routes.
 */
test('home page responds and renders', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});
