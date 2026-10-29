import { test, expect } from './fixtures.mjs';
import { OrthographicCamera, Vector3 } from 'three';

const enter = async (page) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
};
const mirror = (page) =>
  page.locator('[data-board-mirror]:visible, [data-arcade-mirror]:visible');
const fire = (page) => page.locator('[data-arcade-action="fire"]');

test('Arcade plays the shared lesson, retains room state but never campaign progress', async ({
  page,
}) => {
  await enter(page);
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  await expect(mirror(page)).toHaveCount(1);
  await expect(page.locator('#city-heading-arcade')).toBeFocused();
  if (await page.locator('#arcade-flat').isVisible()) {
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-board-fire]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(mirror(page)).toBeFocused();
  }
  await expect(page.locator('.city-controls')).toBeHidden();
  await fire(page).click();
  await expect(page.locator('#arcade-result')).toContainText(
    'Blocked by a wall',
  );
  await mirror(page).press('Enter');
  await fire(page).click();
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await page.locator('#city-destination-contact').click();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(saved);
  await page.locator('[data-arcade-action="reset"]').click();
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
  await expect(page.locator('[data-arcade-action="reset"]')).toBeDisabled();
  await mirror(page).click();
  await page.keyboard.press('Escape');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
});

test('Arcade and room switching restore the exact nondefault city view', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  const canvas = page.locator('#hero-city');
  await canvas.press('ArrowLeft');
  await canvas.press('ArrowUp');
  await canvas.press('+');
  await canvas.evaluate((element) => element.blur());
  const zoom = await page.locator('#city-zoom').textContent();
  const before = await canvas.screenshot();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await page.locator('#city-destination-journey').click();
  await page.locator('#city-destination-contact').click();
  await page.locator('#city-back').click();
  await page
    .locator('#city-destination-contact')
    .evaluate((element) => element.blur());
  await expect(page.locator('#city-zoom')).toHaveText(zoom);
  expect((await canvas.screenshot()).equals(before)).toBe(true);
  const originalSize = page.viewportSize();
  await page.setViewportSize({ width: 1024, height: 768 });
  const resized = await canvas.screenshot();
  await page.setViewportSize(originalSize);
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.locator('#city-back').click();
  await page
    .locator('#city-destination-arcade')
    .evaluate((element) => element.blur());
  expect((await canvas.screenshot()).equals(resized)).toBe(true);
});

test('Arcade projected mirror tap solves the table without orbit controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-presentation',
    '3d',
  );
  const canvas = page.locator('#hero-city');
  const bounds = await canvas.boundingBox();
  const aspect = bounds.width / bounds.height;
  const half = Math.max(4.1, 5.2 / aspect);
  const camera = new OrthographicCamera(
    -half * aspect,
    half * aspect,
    half,
    -half,
    0.1,
    60,
  );
  camera.position.set(3.2, 10, 7);
  camera.lookAt(0, 0.5, 0);
  camera.updateMatrixWorld();
  const p = new Vector3(0.5, 0.76, -1).project(camera);
  await page.mouse.click(
    bounds.x + ((p.x + 1) * bounds.width) / 2,
    bounds.y + ((1 - p.y) * bounds.height) / 2,
  );
  await expect(mirror(page)).toHaveAttribute('aria-label', /backward/);
  await fire(page).click();
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await canvas.dispatchEvent('keydown', { key: 'Home' });
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
});

test('Arcade releases GPU allocations after warm-up and rests between actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.arcadeGpu = { Buffer: 0, Texture: 0, draws: 0 };
    for (const kind of ['Buffer', 'Texture']) {
      for (const prefix of ['create', 'delete']) {
        const name = prefix + kind;
        const original = WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name] = function (...args) {
          const result = Reflect.apply(original, this, args);
          if (
            this.canvas.id === 'hero-city' &&
            (prefix === 'create' ? result : args[0])
          )
            window.arcadeGpu[kind] += prefix === 'create' ? 1 : -1;
          return result;
        };
      }
    }
    for (const name of ['drawArrays', 'drawElements']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        if (this.canvas.id === 'hero-city') window.arcadeGpu.draws++;
        return Reflect.apply(original, this, args);
      };
    }
  });
  await enter(page);
  const canvas = page.locator('#hero-city');
  const cycle = async () => {
    await page.locator('#city-destination-arcade').click();
    await expect(page.locator('#city-dialog')).toHaveAttribute(
      'data-phase',
      'active',
    );
    await mirror(page).click();
    await fire(page).click();
    await canvas.screenshot();
    await page.locator('#city-back').click();
    await canvas.screenshot();
  };
  await cycle();
  await cycle();
  const allocation = () =>
    page.evaluate(() => ({
      Buffer: window.arcadeGpu.Buffer,
      Texture: window.arcadeGpu.Texture,
    }));
  const warm = await allocation();
  for (let i = 0; i < 4; i++) {
    await cycle();
    expect(await allocation()).toEqual(warm);
  }
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await canvas.screenshot();
  await page.clock.install();
  const draws = await page.evaluate(() => window.arcadeGpu.draws);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.arcadeGpu.draws)).toBe(draws);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await mirror(page).dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(50);
  await page.evaluate(() => document.body.classList.add('motion-paused'));
  await page.clock.runFor(200);
  const settled = await page.evaluate(() => window.arcadeGpu.draws);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => window.arcadeGpu.draws)).toBe(settled);
});

test('Arcade latest selection wins and closing cancels an unfinished load', async ({
  page,
}) => {
  let release;
  await page.route(/\/assets\/arcade-[^/]+\.js$/, async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'loading',
  );
  await expect.poll(() => typeof release).toBe('function');
  await page.locator('#city-destination-contact').click();
  release();
  await expect(page.locator('#city-panel-contact')).toBeVisible();
  await expect(page.locator('#arcade-flat')).toBeHidden();
  await page.locator('#city-destination-arcade').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#city-dialog')).toBeHidden();
  await expect(page.locator('.city-stage canvas')).toHaveCount(1);
  await page.locator('#city-open').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-destination',
    'overview',
  );
});

test('Arcade failed import keeps a playable board and explicit retry', async ({
  page,
}) => {
  await page.route(/\/assets\/arcade-[^/]+\.js$/, (route) => route.abort());
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'error',
  );
  await expect(page.locator('#arcade-retry')).toBeVisible();
  await mirror(page).click();
  await fire(page).click();
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await page.locator('#arcade-retry').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'error',
  );
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await page.unroute(/\/assets\/arcade-[^/]+\.js$/);
  await page.locator('#arcade-retry').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await page.locator('#city-back').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-destination',
    'overview',
  );
});

test('Arcade works when WebGL is unavailable from the start', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' ? null : getContext.call(this, type, ...args);
    };
  });
  await enter(page);
  await expect(page.locator('#arcade-flat')).toBeVisible();
  await expect(mirror(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await mirror(page).press('Enter');
  await fire(page).press('Enter');
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await page.locator('[data-arcade-action="reset"]').click();
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
  await page.locator('#city-back').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-destination',
    'overview',
  );
});

test('Closing Arcade before its module arrives cannot activate a hidden scene', async ({
  page,
}) => {
  let release;
  await page.route(/\/assets\/arcade-[^/]+\.js$/, async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').click();
  await expect.poll(() => typeof release).toBe('function');
  await page.keyboard.press('Escape');
  const loaded = page.waitForResponse(/\/assets\/arcade-[^/]+\.js$/);
  release();
  await loaded;
  await page.locator('#hero-city').screenshot();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'closed',
  );
  await expect(page.locator('.city-stage canvas')).toHaveCount(1);
  await page.locator('#city-open').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-destination',
    'overview',
  );
});

test('Arcade flat targets fit narrow and short layouts and survive graphics recovery', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await enter(page);
  await expect(page.locator('#arcade-flat')).toBeVisible();
  const target = await mirror(page).boundingBox();
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.height).toBeGreaterThanOrEqual(44);
  await mirror(page).focus();
  await mirror(page).press('Enter');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(mirror(page)).toBeFocused();
  await expect(mirror(page)).toHaveAttribute('aria-label', /backward/);
  const canvas = page.locator('#hero-city');
  await canvas.evaluate((element) => {
    window.arcadeGraphics = element
      .getContext('webgl2')
      .getExtension('WEBGL_lose_context');
    window.arcadeGraphics.loseContext();
  });
  await expect(page.locator('#arcade-flat')).toBeVisible();
  await expect(mirror(page)).toBeFocused();
  await fire(page).click();
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await page.evaluate(() => window.arcadeGraphics.restoreContext());
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-phase',
    'active',
  );
  await expect(page.locator('#arcade-result')).toContainText('Hit the target');
  await page.setViewportSize({ width: 812, height: 375 });
  await expect(page.locator('#arcade-flat')).toBeVisible();
  const small = await mirror(page).boundingBox();
  expect(small.width).toBeGreaterThanOrEqual(44);
  expect(small.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#city-close')).toBeInViewport();
  await expect(page.locator('#city-back')).toBeInViewport();
  await expect(page.locator('#arcade-full')).toBeInViewport();
});
