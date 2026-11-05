import { test, expect } from './fixtures.mjs';

for (const theme of ['light', 'dark']) {
  test(`puzzle board visual baseline: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript(() =>
      localStorage.setItem(
        'ricochet-prefs',
        JSON.stringify({ v: 1, presentation: 'flat' }),
      ),
    );
    await page.goto('/play');
    await page.evaluate(() => document.fonts.ready);
    await page
      .getByRole('button', { name: 'Mirror, row 2, column 4, slanted forward' })
      .click();
    await page.getByRole('button', { name: 'Fire', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Hit the target');
    await page.mouse.move(0, 0);
    await expect(page.locator('.ricochet-board')).toHaveScreenshot(
      `ricochet-${theme}.png`,
      {
        animations: 'disabled',
        maxDiffPixels: 20,
      },
    );
  });
}
