import { test, expect } from '@playwright/test';

test('has canvas element', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  expect(await page.isVisible('#canvas'));
});
