import AxeBuilder from '@axe-core/playwright';
import projects from '../../src/content/projects.json' with { type: 'json' };
import { test, expect } from './fixtures.mjs';

test('keyboard skip link, visible focus and disclosure navigation', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  expect(
    await skip.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== 'none'
      );
    }),
  ).toBe(true);
  await skip.press('Enter');
  await expect(page).toHaveURL('/#main');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Explore my work' }),
  ).toBeFocused();
  const decision = page.locator('.decision').first();
  await decision.locator('summary').focus();
  await decision.locator('summary').press('Enter');
  await expect(decision).toHaveAttribute('open', '');
  await expect(
    decision.getByRole('heading', { name: 'Implementation' }),
  ).toBeVisible();
  await decision.locator('summary').press('Enter');
  await expect(decision).not.toHaveAttribute('open', '');
});

test('reduced motion stops ambient motion and puzzle animation', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#motion')).toBeDisabled();
  await expect(page.locator('body')).toHaveClass(/motion-paused/);
  await page.clock.fastForward(4000);
  await expect(page.locator('.code-name')).toContainText('<ankit chandola>');
  await page.goto('/play');
  await page.getByRole('button', { name: 'Fire', exact: true }).click();
  await expect(page.locator('.rc-beam')).toBeVisible();
  expect(
    await page
      .locator('.rc-beam')
      .evaluate((beam) => getComputedStyle(beam).animationDuration),
  ).toBe('0s');
  expect(
    await page
      .locator('.rc-mirror')
      .evaluate((mirror) => getComputedStyle(mirror).transitionDuration),
  ).toBe('0s');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('homepage keeps project evidence and navigation readable', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Ankit Chandola',
    );
    for (const project of projects) {
      await expect(
        page.getByRole('heading', { name: project.name, exact: true }),
      ).toBeVisible();
      await expect(
        page
          .locator(`#${project.home?.anchor ?? project.slug}`)
          .getByRole('link', { name: 'Project details' }),
      ).toBeVisible();
    }
    await expect(page.locator('.city-stage .city-poster')).toBeVisible();
    await page.locator('a[href="/lite"]').first().click();
    await expect(page).toHaveURL(/\/lite\/?$/);
  });
  test('lite has no scripts and native phone navigation still works', async ({
    page,
  }, testInfo) => {
    const response = await page.goto('/lite');
    expect(await response.text()).not.toMatch(/<script\b/i);
    await expect(page.locator('script')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Full-stack developer',
    );
    await expect(page.locator('.history-list')).toContainText(
      'Green Fortune Technologies',
    );
    const project = page.locator('.lite-projects > a').first();
    await project.focus();
    await expect(project.locator('p')).toBeVisible();
    if (testInfo.project.name === 'phone') {
      const menu = page.locator('.mobile-navigation');
      await menu.locator('summary').click();
      await expect(
        menu.getByRole('link', { name: 'Work', exact: true }),
      ).toBeVisible();
    }
    await project.click();
    await expect(page).toHaveURL(/\/work\/recon-desk\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Recon Desk',
    );
  });
  test('Recon keeps sample tables and notes readable without JavaScript', async ({
    page,
  }) => {
    await page.goto('/work/recon-desk#comparison-demo');
    await expect(page.locator('.noscript-note')).toBeVisible();
    await expect(page.locator('#comparison-result-title')).toHaveText(
      '1 changed record',
    );
    await page.locator('.comparison-notes summary').click();
    await expect(
      page.locator('.comparison-notes section').first(),
    ).toBeVisible();
    const directory = page.locator('.site-search:visible');
    await directory.locator('summary').click();
    await expect(directory.getByRole('searchbox')).toBeHidden();
    await directory.getByRole('link', { name: /Internal Operations/ }).click();
    await expect(page).toHaveURL('/work/operations');
  });
});

for (const theme of ['light', 'dark']) {
  test(`City dialog accessibility: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Explore the city', exact: true })
      .click();
    const results = await new AxeBuilder({ page })
      .include('#city-dialog')
      .analyze();
    expect(results.violations).toEqual([]);
    for (const id of ['studio', 'journey', 'arcade', 'contact']) {
      await page.locator(`[data-city-destination="${id}"]`).click();
      const selected = await new AxeBuilder({ page })
        .include('#city-dialog')
        .analyze();
      expect(selected.violations).toEqual([]);
    }
  });
  for (const route of ['/', '/work/recon-desk', '/lite', '/play']) {
    test(`WCAG axe: ${route} ${theme}, including expanded controls`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(route);
      if (route === '/') {
        for (const selector of ['.decision']) {
          await page.locator(selector).first().locator('summary').focus();
          await page
            .locator(selector)
            .first()
            .locator('summary')
            .press('Enter');
        }
      }
      if (route === '/play')
        await page.getByRole('button', { name: 'Fire', exact: true }).click();
      if (testInfo.project.name === 'phone')
        await page.locator('.mobile-navigation summary').click();
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    });
  }
}
