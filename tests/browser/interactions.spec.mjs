import { test, expect } from './fixtures.mjs';
import projects from '../../src/content/projects.json' with { type: 'json' };
import { OrthographicCamera, Vector3 } from 'three';

test('city Studio uses shared projects, building taps and accessible panel links', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  const studio = page.locator('[data-city-destination="studio"]');
  await studio.focus();
  await expect(page.locator('#city-label')).toHaveText('Studio');
  const anchor = await page.locator('#city-label').boundingBox();
  expect(anchor).not.toBeNull();
  const x = anchor.x + anchor.width / 2;
  const y = anchor.y + anchor.height + 12;
  if (testInfo.project.name === 'phone') {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
  const panel = page.locator('#city-panel-studio');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading')).toBeFocused();
  await expect(studio).toHaveAttribute('aria-pressed', 'true');
  const links = panel.getByRole('link');
  await expect(links).toHaveCount(5);
  for (const [i, project] of projects.entries()) {
    await expect(links.nth(i)).toHaveText(project.name);
    await expect(links.nth(i)).toHaveAttribute('href', `/work/${project.slug}`);
    await expect(panel.locator('li').nth(i)).toContainText(
      project.indexSummary ?? project.summary,
    );
  }
  await page.keyboard.press('Tab');
  await expect(links.first()).toBeFocused();
  await page.locator('#city-back').click();
  await expect(panel).toBeHidden();
  await expect(studio).toBeFocused();
  await studio.press('Enter');
  await expect(panel.getByRole('heading')).toBeFocused();
  await links.first().click();
  await expect(page).toHaveURL('/work/recon-desk');
});

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

test('city modal contains focus, supports keyboard controls and restores the preview', async ({
  page,
}) => {
  await page.goto('/');
  const canvas = page.locator('#hero-city');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const still = await canvas.screenshot();
  const trigger = page.getByRole('button', {
    name: 'Explore the city',
    exact: true,
  });
  await trigger.hover();
  expect((await canvas.screenshot()).equals(still)).toBe(true);
  await trigger.focus();
  const scroll = await page.evaluate(() => window.scrollY);
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Explore the city' });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  await close.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Reset view' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expect(page.locator('.city-stage canvas')).toHaveCount(0);
  await expect(page.locator('.city-stage .city-poster')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/city-is-open/);
  await canvas.focus();
  const overview = await canvas.screenshot();
  const zoom = await page.locator('#city-zoom').textContent();
  await canvas.press('ArrowLeft');
  expect((await canvas.screenshot()).equals(overview)).toBe(false);
  await canvas.press('+');
  await expect(page.locator('#city-zoom')).not.toHaveText(zoom);
  await expect(page.locator('#city-hint')).toBeHidden();
  await canvas.press('Home');
  await expect(page.locator('#city-zoom')).toHaveText(zoom);
  await canvas.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/city-is-open/);
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  // Compare the scene without the keyboard focus ring that restoration adds to the trigger.
  await trigger.evaluate((button) => button.blur());
  expect((await canvas.screenshot()).equals(still)).toBe(true);
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
  await expect(page.locator('.city-stage .city-poster')).toBeVisible();
  await expect(page.locator('#hero-city')).not.toHaveAttribute(
    'data-ready',
    'true',
  );
  await page
    .getByRole('button', { name: 'Explore the city', exact: true })
    .click();
  await expect(page.locator('#city-dialog-stage .city-poster')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('#city-hint')).toContainText('3D unavailable');
  await page.locator('[data-city-destination="studio"]').click();
  await expect(page.locator('#city-panel-studio')).toBeVisible();
  await expect(page.locator('#city-panel-studio a')).toHaveCount(5);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(page.locator('#city-panels')).toBeHidden();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#city-dialog')).toBeHidden();
  await page.getByRole('link', { name: 'Explore my work' }).click();
  await expect(page).toHaveURL('/#work');
});

test('city does not keep drawing unchanged or offscreen scenery', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.addInitScript(() => {
    window.cityDraws = 0;
    for (const method of ['drawArrays', 'drawElements']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        if (this.canvas.id === 'hero-city') window.cityDraws++;
        return Reflect.apply(original, this, args);
      };
    }
  });
  await page.goto('/');
  const canvas = page.locator('#hero-city');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  const draws = await page.evaluate(() => window.cityDraws);
  expect(draws).toBeGreaterThan(0);
  await page.clock.runFor(700);
  expect(await page.evaluate(() => window.cityDraws)).toBe(draws);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.clock.runFor(700);
  expect(await page.evaluate(() => window.cityDraws)).toBe(draws);
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await page
    .getByRole('button', { name: 'Explore the city', exact: true })
    .click();
  await page.clock.runFor(500);
  const modalDraws = await page.evaluate(() => window.cityDraws);
  await page.clock.runFor(700);
  expect(await page.evaluate(() => window.cityDraws)).toBe(modalDraws);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('city gestures rotate and zoom within limits; reset and Close remain available', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const trigger = page.getByRole('button', {
    name: 'Explore the city',
    exact: true,
  });
  // The entire preview is the hit target, not only its visible caption.
  await trigger.click({ position: { x: 60, y: 80 } });
  const canvas = page.locator('#city-dialog-stage canvas');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const first = await canvas.screenshot();
  if (testInfo.project.name === 'phone') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: x - 50, y, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + 50, y, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    expect((await canvas.screenshot()).equals(first)).toBe(false);
    const zoom = await page.locator('#city-zoom').textContent();
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x - 30, y, id: 1 },
        { x: x + 30, y, id: 2 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x - 70, y, id: 1 },
        { x: x + 70, y, id: 2 },
      ],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect(page.locator('#city-zoom')).not.toHaveText(zoom);
    await cdp.detach();
  } else {
    await page.mouse.move(x - 100, y);
    await page.mouse.down();
    await page.mouse.move(x + 100, y, { steps: 8 });
    await page.mouse.up();
    expect((await canvas.screenshot()).equals(first)).toBe(false);
    const zoom = await page.locator('#city-zoom').textContent();
    await page.mouse.wheel(0, -300);
    await expect(page.locator('#city-zoom')).not.toHaveText(zoom);
  }
  await expect(page.locator('#city-hint')).toBeHidden();
  await expect(page.locator('#city-panels')).toBeHidden();
  for (const name of ['Zoom in', 'Zoom out']) {
    const button = page.getByRole('button', { name, exact: true });
    for (let i = 0; i < 12 && (await button.isEnabled()); i++)
      await button.click();
    await expect(button).toBeDisabled();
    await expect(page.locator('#city-zoom')).toHaveText(
      name === 'Zoom in' ? '220%' : '100%',
    );
  }
  await page.getByRole('button', { name: 'Reset view' }).click();
  expect((await canvas.screenshot()).equals(first)).toBe(true);
  if (testInfo.project.name === 'phone') {
    await page.setViewportSize({ width: 812, height: 375 });
    await expect
      .poll(() =>
        page.locator('#city-dialog').evaluate((element) => ({
          width: element.clientWidth,
          height: element.clientHeight,
        })),
      )
      .toEqual({ width: 812, height: 375 });
    await expect(
      page.getByRole('button', { name: 'Close', exact: true }),
    ).toBeInViewport();
  }
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#city-dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const [id, title, content] of [
  ['journey', 'Journey', 'Green Fortune Technologies'],
  ['arcade', 'Arcade', 'Reflect a beam off mirrors'],
  ['contact', 'Say hello', 'Delhi, India'],
]) {
  test(`city ${id} button, keyboard and building select the same destination`, async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    await page.locator('#city-open').click();
    const button = page.locator(`[data-city-destination="${id}"]`);
    const panel = page.locator(`#city-panel-${id}`);
    await button.click();
    await expect(page.locator('#city-dialog')).toHaveAttribute(
      'data-phase',
      'active',
    );
    await expect(panel).toContainText(content);
    await expect(
      panel.getByRole('heading', { name: title, exact: true }),
    ).toBeFocused();
    const text = await panel.textContent();
    await page.locator('#city-back').click();
    await expect(button).toBeFocused();
    await button.press('Space');
    await expect(page.locator('#city-dialog')).toHaveAttribute(
      'data-phase',
      'active',
    );
    await expect(panel).toHaveText(text);
    await page.locator('#city-back').click();
    await page.locator('#hero-city').screenshot();
    const label = page.locator('#city-label');
    await expect(label).toHaveText(title);
    await expect(label).toBeVisible();
    const bounds = await label.boundingBox();
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height + 12;
    if (testInfo.project.name === 'phone') await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await expect(page.locator('#city-dialog')).toHaveAttribute(
      'data-phase',
      'active',
    );
    await expect(panel).toBeVisible();
    await expect(panel).toHaveText(text);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    if (id === 'arcade') {
      await page
        .locator('#hero-city')
        .dispatchEvent('keydown', { key: 'Home' });
      await expect(panel).toBeVisible();
      await page.locator('#city-back').click();
    } else {
      await page.locator('#hero-city').focus();
      await page.keyboard.press('Home');
    }
    await expect(page.locator('#city-panels')).toBeHidden();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await button.click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#city-dialog')).toBeHidden();
    await page.locator('#city-open').click();
    await expect(page.locator('#city-dialog')).toHaveAttribute(
      'data-destination',
      'overview',
    );
    await expect(page.locator('#city-panels')).toBeHidden();
  });
}

test('city destinations preserve career order, contact sources and native navigation', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('[data-city-destination="contact"]').click();
  const contact = page.locator('#city-panel-contact');
  for (const name of ['GitHub', 'LinkedIn', 'View résumé']) {
    const link = contact.getByRole('link', { name });
    await expect(link).toHaveAttribute('target', '_blank');
    const source =
      name === 'View résumé'
        ? '.hero-actions a[target="_blank"]'
        : `#contact a[href*="${name.toLowerCase()}.com"]`;
    await expect(link).toHaveAttribute(
      'href',
      await page.locator(source).getAttribute('href'),
    );
  }
  await expect(
    contact.getByRole('link', { name: 'Email Ankit' }),
  ).toHaveAttribute(
    'href',
    await page.locator('#contact .email').getAttribute('href'),
  );
  await page.locator('[data-city-destination="journey"]').click();
  const journey = page.locator('#city-panel-journey');
  await expect(journey.locator('h4')).toHaveText([
    'Nethues',
    'Hippo Homes by Dalmia',
    'Green Fortune Technologies',
  ]);
  await expect(journey.locator('.city-dates')).toHaveText([
    '2021 — 2024',
    '2024 — 2025',
    '2025 — PRESENT · Current',
  ]);
  await journey.getByRole('link', { name: 'Read experience' }).click();
  await expect(page.locator('#city-dialog')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/city-is-open/);
  await expect(page).toHaveURL('/#experience');
  await expect(page.locator('#experience h2')).toBeFocused();
  await expect(page.locator('#experience h2')).toBeInViewport();
  await page.locator('#city-open').click();
  await page.locator('[data-city-destination="arcade"]').click();
  await page
    .locator('#city-dialog')
    .getByRole('link', { name: 'Play full Ricochet', exact: true })
    .click();
  await expect(page).toHaveURL('/play');
  for (const project of projects)
    expect((await request.get(`/work/${project.slug}`)).status()).toBe(200);
});

test('city selected panels survive graphics loss and keep focus trapped through links', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('[data-city-destination="studio"]').click();
  const dialog = page.locator('#city-dialog');
  const canvas = page.locator('#hero-city');
  await canvas.focus();
  const supported = await canvas.evaluate((element) => {
    window.cityGraphics = element
      .getContext('webgl2')
      .getExtension('WEBGL_lose_context');
    window.cityGraphics?.loseContext();
    return Boolean(window.cityGraphics);
  });
  expect(supported).toBe(true);
  await expect(canvas).not.toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#city-panel-studio')).toBeVisible();
  await expect(page.locator('#city-close')).toBeFocused();
  await page.locator('[data-city-destination="contact"]').click();
  const links = page.locator('#city-panel-contact a');
  await page.keyboard.press('Tab');
  await expect(links.first()).toBeFocused();
  for (let i = 1; i < 4; i++) {
    await page.keyboard.press('Tab');
    await expect(links.nth(i)).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(page.locator('#city-back')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    dialog.getByRole('button', { name: 'Reset view' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#city-close')).toBeFocused();
  await page.evaluate(() => window.cityGraphics.restoreContext());
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#city-panel-contact')).toBeVisible();
  await expect(page.locator('#city-zoom')).toHaveText('170%');
  await expect(
    dialog.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeEnabled();
});

test('city scenery, reserved plots and occluded landmarks do not act as destinations', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  await expect(page.locator('[data-city-destination]')).toHaveCount(4);
  await expect(
    page
      .locator('#city-dialog')
      .getByRole('button', { name: /Future|progress/i }),
  ).toHaveCount(0);
  const canvas = page.locator('#hero-city');
  const rect = await canvas.boundingBox();
  const halfWidth = Math.max(8.7, (6.3 * rect.width) / rect.height);
  const camera = new OrthographicCamera(
    -halfWidth,
    halfWidth,
    (halfWidth * rect.height) / rect.width,
    (-halfWidth * rect.height) / rect.width,
    0.1,
    80,
  );
  camera.position.set(12, 15, 17);
  camera.lookAt(0, 1, 0);
  camera.zoom = rect.width > rect.height ? 1.12 : 1;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  for (const [x, y, z] of [
    [-3.45, 0.76, 2.2],
    [3.45, 2.05, -0.1],
    [1.4, 1.25, 2.1],
    [-2.65, 0.3, -2.35],
  ]) {
    const point = new Vector3(x, y, z).project(camera);
    const clientX = rect.x + ((point.x + 1) * rect.width) / 2;
    const clientY = rect.y + ((1 - point.y) * rect.height) / 2;
    await page.mouse.move(clientX, clientY);
    await page.mouse.click(clientX, clientY);
    await expect(page.locator('#city-dialog')).toHaveAttribute(
      'data-destination',
      'overview',
    );
    await expect(page.locator('#city-label')).toBeHidden();
  }
  await page.locator('[data-city-destination="studio"]').click();
  await canvas.click({ position: { x: 8, y: 8 } });
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-destination',
    'studio',
  );
});

test('city camera transitions interrupt, settle on pause and stop rendering', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.addInitScript(() => {
    window.cityDraws = 0;
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas.id === 'hero-city') window.cityDraws++;
      return Reflect.apply(draw, this, args);
    };
  });
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.clock.runFor(500);
  await page.clock.pauseAt('2026-01-01T00:01:00Z');
  await page
    .locator('[data-city-destination="studio"]')
    .dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(100);
  const intermediate = await page.locator('#city-zoom').textContent();
  expect(intermediate).not.toBe('155%');
  await page
    .locator('[data-city-destination="journey"]')
    .dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(50);
  await page
    .locator('[data-city-destination="contact"]')
    .dispatchEvent('click', { detail: 1 });
  await page.evaluate(() => document.body.classList.add('motion-paused'));
  await expect(page.locator('#city-zoom')).toHaveText('170%');
  await page.clock.runFor(500);
  const paused = await page.evaluate(() => window.cityDraws);
  await page.clock.runFor(800);
  expect(await page.evaluate(() => window.cityDraws)).toBe(paused);
  await page.evaluate(() => document.body.classList.remove('motion-paused'));
  await page
    .locator('[data-city-destination="journey"]')
    .dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(100);
  const bounds = await page.locator('#hero-city').boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 40,
    bounds.y + bounds.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();
  const interrupted = await page.locator('#city-zoom').textContent();
  await page.clock.runFor(800);
  await expect(page.locator('#city-zoom')).toHaveText(interrupted);
  expect(interrupted).not.toBe('135%');
  await page
    .locator('[data-city-destination="studio"]')
    .dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(50);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#city-zoom')).toHaveText('155%');
  await page.clock.runFor(500);
  const settled = await page.evaluate(() => window.cityDraws);
  await page.clock.runFor(800);
  expect(await page.evaluate(() => window.cityDraws)).toBe(settled);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page
    .locator('[data-city-destination="journey"]')
    .dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(50);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await page.evaluate(() => window.cityDraws);
  await page.clock.runFor(800);
  expect(await page.evaluate(() => window.cityDraws)).toBe(hidden);
  await expect(page.locator('#city-zoom')).toHaveText('135%');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(500);
  await page.keyboard.press('Escape');
  await expect(page.locator('.city-stage canvas')).toHaveCount(1);
  await page.clock.runFor(500);
  const closed = await page.evaluate(() => window.cityDraws);
  await page.clock.runFor(800);
  expect(await page.evaluate(() => window.cityDraws)).toBe(closed);
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
