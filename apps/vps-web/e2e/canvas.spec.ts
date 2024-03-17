import { test, expect } from '@playwright/test';

test('runs qicksort flow', async ({ page }) => {
  await page.goto('/');

  expect(await page.isVisible('#canvas'));
  page.on('dialog', (dialog) => dialog.accept());
  await page.selectOption('[name="example-flows"]', 'quicksort-flow.json');
  expect(
    await page.isVisible(
      '[data-node-id="dea7a8ed-f5e3-496e-9ff9-e16d927b05b9"]'
    )
  );
  const locator = page.locator(
    '[data-node-id="dea7a8ed-f5e3-496e-9ff9-e16d927b05b9"]'
  );
  await expect(locator).toHaveText('Input', { timeout: 2000000 });
  await page.click('[name="run-flow"]');
  await expect(locator).not.toHaveText('Input', { timeout: 2000000 });
});
