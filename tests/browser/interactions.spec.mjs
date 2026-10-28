import { test, expect } from './fixtures.mjs';

for (const route of ['/', '/work/operations']) {
  test(`${route} header search filters locally and restores keyboard focus`, async ({
    page,
  }) => {
    await page.goto(route);
    const search = page.locator('.site-search:visible');
    const trigger = search.locator('summary');
    await trigger.click();
    const input = search.getByRole('searchbox');
    await expect(input).toBeFocused();
    await input.fill('  REACT   offline  ');
    const results = search.locator('.search-results li:visible');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('Internal Operations Platform');
    await input.fill('no-such-project');
    await expect(results).toHaveCount(0);
    await expect(search.locator('.search-empty')).toBeVisible();
    await input.fill('');
    await expect(results).toHaveCount(5);
    await input.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(input).toBeHidden();
    await trigger.click();
    await input.fill('telephony');
    await search.getByRole('link', { name: /Sales CRM/ }).click();
    await expect(page).toHaveURL('/work/sales-crm');
  });
}

test('compact project index keeps complete narratives on detail pages', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.project-card')).toHaveCount(5);
  await expect(page.locator('#amount')).toHaveCount(0);
  const project = page.locator('#operations');
  await expect(project.locator('.project-summary')).toContainText(
    'offline survey',
  );
  await project.getByRole('link', { name: 'Project details' }).click();
  await expect(page.locator('.ownership-note')).toContainText(
    'both frontend and backend',
  );
  await expect(page.locator('.evidence-gallery')).toBeVisible();
});

test('3D hero renders still under reduced motion and respects pause', async ({
  page,
}) => {
  await page.goto('/');
  const canvas = page.locator('#hero-world');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toHaveAttribute('data-view', 'overview');
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
  await page.getByRole('button', { name: 'CRM', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-selected', 'sales-crm');
  await expect(canvas).toHaveAttribute('data-view', 'sales-crm');
  await expect(page.locator('#landmark-sales-crm')).toBeVisible();
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
  await page.getByRole('button', { name: 'Back to overview' }).click();
  await expect(canvas).toHaveAttribute('data-view', 'overview');
  await expect(page.locator('[data-world-overview]')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Clicking without scrolling the hero out of view isolates the global pause preference.
  await page.locator('#motion').evaluate((button) => button.click());
  await page.getByRole('button', { name: 'Operations', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
  await page.reload();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toHaveAttribute('data-motion', 'paused');
});

test('unavailable WebGL keeps static hero artwork and navigation usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' ? null : getContext.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('.world-poster')).toBeVisible();
  await expect(page.locator('#hero-world')).not.toHaveAttribute(
    'data-ready',
    'true',
  );
  await page.getByRole('link', { name: 'Explore my work' }).click();
  await expect(page).toHaveURL('/#work');
});

test('building selection replaces the city with distinct project models', async ({
  page,
}) => {
  await page.goto('/');
  const canvas = page.locator('#hero-world');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const overview = await canvas.screenshot();
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await canvas.click({
    position: { x: bounds.width * 0.27, y: bounds.height * 0.52 },
  });
  await expect(canvas).toHaveAttribute('data-view', 'recon-desk');
  const models = [];
  for (const slug of [
    'recon-desk',
    'operations',
    'sales-crm',
    'visualization',
    'website-cms',
  ]) {
    await page.locator(`[data-landmark="${slug}"]`).click();
    await expect(canvas).toHaveAttribute('data-view', slug);
    const image = await canvas.screenshot();
    expect(image.equals(overview)).toBe(false);
    for (const previous of models) expect(image.equals(previous)).toBe(false);
    models.push(image);
  }
  await page.getByRole('button', { name: 'Back to overview' }).click();
  await expect(canvas).toHaveAttribute('data-view', 'overview');
});

test('generated routes and custom 404 never use an SPA fallback', async ({
  page,
  request,
}) => {
  for (const route of ['/work/recon-desk', '/lite/', '/play/']) {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<main');
  }
  for (const route of [
    '/not-a-page/',
    '/work/not-generated/',
    '/assets/missing.js',
  ]) {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('A small detour.');
  }
  const response = await page.goto('/not-a-page/');
  expect(response.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A small detour.',
  );
  await page.getByRole('link', { name: 'Return to the work' }).click();
  await expect(page).toHaveURL('/');
});

for (const route of ['/work/recon-desk']) {
  for (const variant of ['refined', 'original']) {
    test(`${route} gallery: ${variant}, keyboard selection and complete image`, async ({
      page,
    }) => {
      await page.goto(
        route + (variant === 'original' ? '?gallery=original' : ''),
      );
      await expect(page.locator('html')).toHaveAttribute(
        'data-gallery',
        variant,
      );
      const gallery = page.locator('.evidence-gallery').first();
      const buttons = gallery.locator('.gallery-options button');
      await buttons.first().focus();
      await buttons.first().press('Tab');
      await expect(buttons.nth(1)).toBeFocused();
      await buttons.nth(1).press('Space');
      await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'false');
      await expect(gallery.locator('figure').first()).toBeHidden();
      const panel = gallery.locator('figure').nth(1);
      await expect(panel).toBeVisible();
      const image = panel.locator('img');
      await expect
        .poll(() =>
          image.evaluate((img) => img.complete && img.naturalWidth > 0),
        )
        .toBe(true);
      expect(
        await image.evaluate((img) => {
          const { width, height } = img.getBoundingClientRect();
          return Math.abs(
            width / height - img.naturalWidth / img.naturalHeight,
          );
        }),
      ).toBeLessThan(0.01);
      await expect(
        panel.getByRole('link', { name: /Open full screenshot/ }),
      ).toHaveAttribute('href', /recon-desk-reconcile-suggestions\.png$/);
    });
  }
}

test('comparison scenarios, inclusive tolerance, invalid input and reset', async ({
  page,
}) => {
  await page.goto('/work/recon-desk#comparison-demo');
  const amount = page.getByLabel('New amount for SKU 002');
  const tolerance = page.getByLabel('Allow a difference up to');
  await expect(page.locator('#comparison-result-title')).toHaveText(
    '1 changed record',
  );
  await page.getByRole('button', { name: 'Rows shuffled' }).click();
  await expect(page.locator('#comparison-result-title')).toHaveText(
    'Same records. Zero changes.',
  );
  await expect(amount).toBeDisabled();
  await expect(tolerance).toBeDisabled();
  await expect(page.locator('#after-rows tr').first()).toContainText('003');
  await page.getByRole('button', { name: 'A duplicate key' }).click();
  await expect(page.locator('#after-rows .row-problem')).toHaveCount(2);
  await expect(page.locator('#comparison-result-title')).toContainText(
    'ambiguous key',
  );
  await page.getByRole('button', { name: 'A price changed' }).click();
  await amount.fill('950.01');
  await tolerance.focus();
  await tolerance.press('End');
  await expect(page.locator('#tolerance-value')).toHaveText('₹100');
  await expect(page.locator('#comparison-result-title')).toHaveText(
    '1 changed record',
  );
  await amount.fill('950');
  await expect(page.locator('#comparison-result-title')).toHaveText(
    'Within your rules. All clear.',
  );
  const lastValid = await page.locator('#after-rows').innerText();
  await amount.fill('');
  await expect(amount).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#input-error')).toContainText('Enter an amount');
  await expect
    .poll(() => page.locator('#after-rows').innerText())
    .toBe(lastValid);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(amount).toHaveValue('920');
  await expect(amount).toHaveAttribute('aria-invalid', 'false');
  await expect(tolerance).toHaveValue('0');
  await expect(page.locator('#comparison-result-title')).toHaveText(
    '1 changed record',
  );
  await expect(page.locator('#before-rows')).toContainText('850.00');
});

test('theme preference survives reload and navigation between editions', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.theme-toggle:visible').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/work/recon-desk');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.theme-toggle:visible').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('ankit-theme')))
    .toBe('light');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('puzzle fire, mirror keyboard control, undo, reset and saved progress', async ({
  page,
}) => {
  await page.goto('/play');
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const reset = page.getByRole('button', { name: 'Reset', exact: true });
  const mirror = page.getByRole('button', { name: /^Mirror,/ });
  await expect(undo).toBeDisabled();
  await expect(reset).toBeDisabled();
  await page.getByRole('button', { name: /^Fire the beam from/ }).click();
  await expect(page.getByRole('status')).toContainText('Blocked by a wall');
  await expect(reset).toBeEnabled();
  await expect(undo).toBeDisabled();
  await reset.click();
  await expect(page.locator('.rc-beam')).toHaveCount(0);
  await mirror.focus();
  await mirror.press('Space');
  await expect(mirror).toHaveAccessibleName(/backward/);
  await undo.click();
  await expect(mirror).toHaveAccessibleName(/forward/);
  await expect(undo).toBeDisabled();
  await mirror.click();
  await page.getByRole('button', { name: 'Fire', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Hit the target');
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('ricochet-solved'))),
    )
    .toEqual(['first-bounce']);
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await expect(page.locator('.ricochet-level-heading h2')).toHaveText(
    'Two turns',
  );
  await expect(page.locator('.ricochet-level-heading h2')).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Lesson 1, First bounce, solved' }),
  ).toBeVisible();
});

test('generated links hydrate, clipboard fallback shares, and mode preferences persist', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: () =>
          Promise.reject(new Error('Clipboard blocked for test')),
      },
      configurable: true,
    });
  });
  await page.goto('/play?seed=ABC123&d=easy');
  await expect(page.locator('.ricochet-level-heading')).toContainText(
    'RANDOM · EASY · SEED ABC123',
  );
  await page.getByRole('button', { name: 'Copy link' }).click();
  const share = page.getByLabel('Copy this link');
  await expect(share).toBeVisible();
  const url = await share.inputValue();
  expect(new URL(url).searchParams.has('l')).toBe(true);
  await page.goto(url);
  await expect(page.locator('.ricochet-level-heading h2')).toHaveText(
    'Shared puzzle',
  );
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page).toHaveURL(/mode=today/);
  await expect(page.locator('.ricochet-level-heading')).toContainText(
    'PUZZLE OF THE DAY',
  );
  await page.goto('/play');
  await expect(
    page.getByRole('button', { name: 'Today', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('generated links ignore unsupported difficulty names', async ({
  page,
}) => {
  for (const difficulty of ['unknown', 'constructor', 'toString']) {
    await page.goto(`/play?seed=ABC123&d=${difficulty}`);
    await expect(page.locator('.ricochet-level-heading')).toContainText(
      'RANDOM · MEDIUM · SEED ABC123',
    );
    await expect(page).toHaveURL(/seed=ABC123&d=medium$/);
    await expect(
      page.getByRole('button', { name: 'Medium', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
});

test('header navigation and phone menu close on Escape, outside click and selection', async ({
  page,
}, testInfo) => {
  await page.goto('/work/recon-desk');
  if (testInfo.project.name === 'phone') {
    const menu = page.locator('.mobile-navigation');
    const summary = menu.locator('summary');
    await summary.click();
    await expect(menu).toHaveAttribute('open', '');
    await summary.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await summary.click();
    await page.getByRole('heading', { level: 1 }).click();
    await expect(menu).not.toHaveAttribute('open', '');
    await summary.click();
    await menu.getByRole('link', { name: 'Say hello' }).click();
    await expect(menu).not.toHaveAttribute('open', '');
  } else {
    await page
      .locator('.desktop-navigation')
      .getByRole('link', { name: 'Say hello' })
      .click();
  }
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
  await page
    .locator('.project-nav')
    .getByRole('link', { name: /Next/ })
    .click();
  await expect(page).toHaveURL(/\/work\/operations\/?$/);
  await page.getByRole('link', { name: 'Back to selected work' }).click();
  await expect(page).toHaveURL('/#work');
});
