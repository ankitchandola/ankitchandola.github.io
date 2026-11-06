import { test, expect } from './fixtures.mjs';

for (const theme of ['light', 'dark']) {
  test(`unhit flat target keeps a contrasting ring and dot: ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.addInitScript(() =>
      localStorage.setItem(
        'ricochet-prefs',
        JSON.stringify({ v: 1, presentation: 'flat' }),
      ),
    );
    await page.goto('/play');
    const contrast = await page.locator('.rc-target').evaluate((element) => {
      const [disc, dot] = element.querySelectorAll('circle');
      const discStyle = getComputedStyle(disc);
      const luminance = (color) =>
        color
          .match(/\d+/g)
          .slice(0, 3)
          .map(Number)
          .map((channel) => channel / 255)
          .map((channel) =>
            channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4,
          )
          .reduce(
            (sum, channel, index) =>
              sum + channel * [0.2126, 0.7152, 0.0722][index],
            0,
          );
      return [discStyle.stroke, getComputedStyle(dot).fill].map((color) => {
        const values = [luminance(color), luminance(discStyle.fill)].sort(
          (a, b) => a - b,
        );
        return (values[1] + 0.05) / (values[0] + 0.05);
      });
    });
    for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(3);
  });

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
