import { test, expect } from '@playwright/test';

test('runs qicksort flow', async ({ page }) => {
  await page.goto('/');

  expect(await page.isVisible('#canvas'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.selectOption('[name="example-flows"]', 'quicksort-flow.json');
  const locator = page.locator(
    '[data-node-id="dea7a8ed-f5e3-496e-9ff9-e16d927b05b9"]'
  );
  expect(await locator.isVisible());
  await expect(locator).toHaveText('Input', { timeout: 2000000 });
  await page.click('[name="run-flow"]');
  await expect(locator).not.toHaveText('Input', { timeout: 2000000 });
});

test('runs counter flow', async ({ page }) => {
  await page.goto('/');

  expect(await page.isVisible('#canvas'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.selectOption('[name="example-flows"]', 'counter-flow.json');

  const locator = page.locator(
    '[data-node-id="054132af-4d2f-48ed-b239-f5129dd35288"]'
  );
  expect(await locator.isVisible());
  await page.click('[name="run-flow"]');
  await expect(locator).not.toHaveText('1 (global)', { timeout: 2000000 });
  await page.click('[name="run-flow"]');
  await expect(locator).not.toHaveText('2 (global)', { timeout: 2000000 });
});
