import { test, expect, sceneOnly } from './fixtures.mjs';
import raw from '../../src/content/levels.json' with { type: 'json' };
import { parseLevel } from '../../src/play/model.ts';
import { solve } from '../../src/play/solve.ts';
import {
  frameTable,
  mirrorRects,
  tableCamera,
} from '../../src/play/three/projection.ts';

const enter = async (page) => {
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').click();
  await expect(page.locator('#arcade-panel .ricochet-modes')).toBeVisible();
};
const view = (page) => page.locator('#arcade-stage .ricochet-view');
const mirror = (page) =>
  page.locator(
    '#arcade-stage [data-board-mirror]:visible, #arcade-stage [data-table-mirror]:visible',
  );
const fire = (page) =>
  page
    .locator('#arcade-panel')
    .getByRole('button', { name: 'Fire', exact: true });
const result = (page) => page.locator('#arcade-result');
const ready = async (page) => {
  await expect(view(page)).not.toHaveAttribute('data-table-status', 'loading');
  if ((await view(page).getAttribute('data-presentation')) === '3d')
    await expect(view(page).locator('canvas')).toHaveAttribute(
      'data-ready',
      'true',
    );
};
const surfaceRoute = /\/assets\/surface-[^/]+\.js$/;

test('Arcade phone Fire stays pinned without expanding the sheet, including the 6 by 8 board', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await enter(page);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 });
    for (const lesson of [1, 3, 5]) {
      await page
        .getByRole('button', { name: new RegExp(`^Lesson ${lesson},`) })
        .click();
      await expect(page.locator('#city-sheet-handle')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      for (const button of await page
        .locator('#arcade-panel .ricochet-controls button')
        .all())
        await expect(button).toBeInViewport({ ratio: 1 });
      await page
        .locator('#city-panel-arcade')
        .evaluate((element) => (element.scrollTop = element.scrollHeight));
      const scroller = await page.locator('#city-panel-arcade').boundingBox();
      const controls = await page
        .locator('#arcade-panel .ricochet-controls')
        .boundingBox();
      expect(scroller.y).toBeGreaterThanOrEqual(
        controls.y + controls.height + 8,
      );
      await expect(fire(page)).toBeInViewport({ ratio: 1 });
      expect(
        await fire(page).evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return element.contains(
            document.elementFromPoint(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2,
            ),
          );
        }),
      ).toBe(true);
      await fire(page).click();
      await expect(result(page)).not.toContainText(
        'Turn the mirrors, then fire.',
      );
    }
    await page.getByRole('button', { name: 'Random', exact: true }).click();
    await page.getByRole('button', { name: 'Hard', exact: true }).click();
    await expect(fire(page)).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(fire(page)).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Learn', exact: true }).click();
  }
});

test('Arcade short landscape controls scroll independently and navigation stays pinned', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enter(page);
  for (const width of [700, 900]) {
    await page.setViewportSize({ width, height: 420 });
    await page.getByRole('button', { name: 'Learn', exact: true }).click();
    await page.getByRole('button', { name: /^Lesson 1,/ }).click();
    const section = page.locator('#city-panel-arcade');
    expect(
      await section.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(true);
    for (const control of await page
      .locator('#arcade-panel button, #arcade-result')
      .all()) {
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeInViewport({ ratio: 1 });
      expect(
        await control.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return element.contains(
            document.elementFromPoint(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2,
            ),
          );
        }),
      ).toBe(true);
      await expect(page.locator('#city-back')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('#arcade-full')).toBeInViewport({ ratio: 1 });
    }
    await page.getByRole('button', { name: 'Random', exact: true }).click();
    await page.getByRole('button', { name: 'Hard', exact: true }).click();
    await page
      .getByRole('button', { name: 'New puzzle', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: 'New puzzle', exact: true }),
    ).toBeInViewport({ ratio: 0.99 });
    await page.getByRole('button', { name: 'New puzzle', exact: true }).click();
  }
});

test('Arcade stage cards clear the bars and panel, and lesson 1 fits desktop and tablet', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await enter(page);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(
      (value) => (document.documentElement.dataset.theme = value),
      theme,
    );
    for (const [width, height] of [
      [320, 812],
      [375, 812],
      [768, 1024],
      [1024, 768],
      [1440, 900],
      [900, 420],
    ]) {
      await page.setViewportSize({ width, height });
      await expect
        .poll(async () => {
          const stage = await page.locator('#arcade-stage').boundingBox();
          const others = await Promise.all(
            ['.city-dialog-header', '.city-dialog-footer', '#city-panels'].map(
              (selector) => page.locator(selector).boundingBox(),
            ),
          );
          return others.every(
            (rect) =>
              !rect ||
              stage.x + stage.width <= rect.x + 1 ||
              rect.x + rect.width <= stage.x + 1 ||
              stage.y + stage.height <= rect.y + 1 ||
              rect.y + rect.height <= stage.y + 1,
          );
        })
        .toBe(true);
      if (width === 1024 || width === 1440)
        await expect(view(page)).toHaveAttribute('data-presentation', '3d', {
          timeout: 15_000,
        });
      await expect(page.locator('#city-back')).toBeInViewport({ ratio: 1 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
    }
  }
});

test('Arcade loading never covers the playable fallback or loading note', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release;
  await page.route(surfaceRoute, async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-table-status', 'loading');
  await expect(view(page).getByRole('status')).toContainText(
    'Opening the 3D table',
  );
  await expect(view(page).getByRole('status')).toBeInViewport({ ratio: 1 });
  const target = mirror(page);
  await expect(target).toBeInViewport({ ratio: 1 });
  const toggle = await view(page)
    .locator('.ricochet-presentation')
    .boundingBox();
  const board = await view(page).locator('.ricochet-board').boundingBox();
  expect(toggle.y + toggle.height).toBeLessThanOrEqual(board.y + 1);
  const bounds = await target.boundingBox();
  expect(
    await page.evaluate(
      ({ x, y, width, height }) =>
        !!document
          .elementFromPoint(x + width / 2, y + height / 2)
          ?.closest('[data-board-mirror]'),
      bounds,
    ),
  ).toBe(true);
  await target.click();
  await fire(page).click();
  await expect(result(page)).toContainText('Hit the target');
  await expect.poll(() => typeof release).toBe('function');
  const loaded = page.waitForResponse(surfaceRoute);
  release();
  await loaded;
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await expect(result(page)).toContainText('Hit the target');
});

test('Arcade shares full-game progress with /play in both directions without changing the URL', async ({
  page,
  context,
}) => {
  await enter(page);
  const url = page.url();
  await expect(page.locator('#city-heading-arcade')).toBeFocused();
  await expect(page.locator('.city-controls')).toBeHidden();
  await expect(page.locator('#hero-city')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.locator('#hero-city')).toHaveAttribute('tabindex', '-1');
  await ready(page);
  await fire(page).click();
  await expect(result(page)).toContainText('Blocked by a wall');
  await mirror(page).press('Enter');
  await fire(page).click();
  await expect(result(page)).toContainText('Hit the target');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('ricochet-solved')),
    ),
  ).toContain('first-bounce');
  await page.getByRole('button', { name: 'Next lesson' }).click();
  await expect(page.locator('#city-heading-arcade')).toHaveText('Two turns');
  await expect(page.locator('#city-heading-arcade')).toBeFocused();
  expect(page.url()).toBe(url);
  const full = await context.newPage();
  try {
    await full.goto('/play');
    await expect(
      full.getByRole('button', { name: /^Lesson 1,/ }),
    ).toHaveAccessibleName(/solved/);
    await full.getByRole('button', { name: /^Lesson 2,/ }).click();
    const level = parseLevel(raw[1]);
    const solved = solve(level);
    for (const [key, slant] of Object.entries(solved.mirrors)) {
      if (slant === level.mirrors[key]) continue;
      await full
        .locator(
          `[data-table-mirror="${key}"]:visible, [data-board-mirror="${key}"]:visible`,
        )
        .click();
    }
    await full.getByRole('button', { name: 'Fire', exact: true }).click();
    await expect(full.getByRole('status')).toContainText('Hit the target');
    await page.keyboard.press('Escape');
    await page.locator('#city-open').click();
    await page.locator('#city-destination-arcade').click();
    await expect(
      page.getByRole('button', { name: /^Lesson 2,/ }),
    ).toHaveAccessibleName(/solved/);
    await expect(result(page)).toContainText('Turn the mirrors, then fire.');
    expect(page.url()).toBe(url);
  } finally {
    await full.close();
  }
});

test('Arcade Random hard, New puzzle and Today work without share controls', async ({
  page,
}) => {
  await enter(page);
  const url = page.url();
  await page.getByRole('button', { name: 'Random', exact: true }).click();
  await page.getByRole('button', { name: 'Hard', exact: true }).click();
  await expect(page.locator('#arcade-panel .kicker').first()).toContainText(
    'RANDOM · HARD',
  );
  const puzzle = await page
    .locator('#arcade-panel .kicker')
    .first()
    .textContent();
  await page.getByRole('button', { name: 'New puzzle', exact: true }).click();
  await expect(page.locator('#arcade-panel .kicker').first()).not.toHaveText(
    puzzle,
  );
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.locator('#arcade-panel .kicker')).toContainText(
    'PUZZLE OF THE DAY',
  );
  await expect(page.getByRole('button', { name: 'Copy link' })).toHaveCount(0);
  await expect(page.locator('#arcade-full')).toHaveAttribute('href', '/play');
  expect(page.url()).toBe(url);
});

test('Arcade keeps mirrors and shot across destination switches and restores exact city pose', async ({
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
  const before = await canvas.screenshot(sceneOnly);
  await page.locator('#city-destination-arcade').click();
  await ready(page);
  await mirror(page).click();
  await fire(page).click();
  await expect(result(page)).toContainText('Hit the target');
  await page.locator('#city-destination-studio').click();
  await page.locator('#city-destination-arcade').click();
  await expect(result(page)).toContainText('Hit the target');
  await expect(mirror(page)).toHaveAttribute('aria-label', /backward/);
  await page.locator('#city-destination-journey').click();
  await page.locator('#city-destination-contact').click();
  await page.locator('#city-back').click();
  await page
    .locator('#city-destination-contact')
    .evaluate((element) => element.blur());
  await expect(page.locator('#city-zoom')).toHaveText(zoom);
  expect((await canvas.screenshot(sceneOnly)).equals(before)).toBe(true);
  const original = page.viewportSize();
  await page.setViewportSize({ width: 1024, height: 768 });
  const resized = await canvas.screenshot(sceneOnly);
  await page.setViewportSize(original);
  await page.locator('#city-destination-arcade').click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.locator('#city-back').click();
  await page
    .locator('#city-destination-arcade')
    .evaluate((element) => element.blur());
  expect((await canvas.screenshot(sceneOnly)).equals(resized)).toBe(true);
});

test('Arcade 3D overlays align with projected cells and accept click and Enter', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await ready(page);
  const canvas = view(page).locator('canvas');
  const bounds = await canvas.boundingBox();
  const level = parseLevel(raw[0]);
  const size = { width: bounds.width, height: bounds.height };
  const camera = tableCamera();
  frameTable(camera, level, size);
  const [rect] = mirrorRects(camera, level, size).values();
  const target = await mirror(page).boundingBox();
  expect(target.width).toBeGreaterThanOrEqual(44);
  expect(target.height).toBeGreaterThanOrEqual(44);
  expect(target.x).toBeCloseTo(bounds.x + rect.x, 0);
  expect(target.y).toBeCloseTo(bounds.y + rect.y, 0);
  await page.mouse.click(
    bounds.x + rect.x + rect.width / 2,
    bounds.y + rect.y + rect.height / 2,
  );
  await expect(mirror(page)).toHaveAttribute('aria-label', /backward/);
  await mirror(page).press('Enter');
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
  await mirror(page).press('Enter');
  await fire(page).click();
  await expect(result(page)).toContainText('Hit the target');
  await page.locator('#hero-city').dispatchEvent('keydown', { key: 'Home' });
  await expect(result(page)).toContainText('Hit the target');
});

test('Arcade uses one visible keyboard sequence with 44px targets in narrow and short layouts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-presentation', 'flat');
  await expect(page.getByRole('group', { name: 'Board view' })).toHaveCount(0);
  await mirror(page).focus();
  await mirror(page).press('Enter');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(view(page)).toHaveAttribute('data-table-status', 'ready', {
    timeout: 15_000,
  });
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await expect(mirror(page)).toBeFocused();
  await expect(mirror(page)).toHaveAttribute('aria-label', /backward/);
  await page.setViewportSize({ width: 900, height: 420 });
  await expect(view(page)).toHaveAttribute('data-presentation', 'flat');
  await expect(mirror(page)).toBeFocused();
  await expect(page.getByRole('group', { name: 'Board view' })).toHaveCount(0);
  const bounds = await mirror(page).boundingBox();
  expect(Math.min(bounds.width, bounds.height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#city-close')).toBeInViewport();
  await expect(page.locator('#city-back')).toBeInViewport();
  await expect(page.locator('#arcade-full')).toBeInViewport();
});

test('Arcade import failure keeps flat gameplay and Retry 3D recovers the same state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route(surfaceRoute, (route) => route.abort());
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-table-status', 'error');
  await expect(view(page).getByRole('status')).toContainText('could not open');
  await mirror(page).click();
  await fire(page).click();
  await expect(result(page)).toContainText('Hit the target');
  await page.unroute(surfaceRoute);
  await page.getByRole('button', { name: 'Retry 3D', exact: true }).click();
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await expect(result(page)).toContainText('Hit the target');
});

test('Arcade portrait phone sheet leaves every tall-board cell visible and expands without resetting', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await enter(page);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 });
    for (const index of [3, 4, 5]) {
      await page
        .getByRole('button', { name: new RegExp(`^Lesson ${index},`) })
        .click();
      await expect(view(page)).toHaveAttribute('data-presentation', 'flat');
      await expect
        .poll(async () => {
          const stage = await page
            .locator('#arcade-stage .ricochet-surface')
            .boundingBox();
          const board = await page
            .locator('#arcade-stage .ricochet-board')
            .boundingBox();
          return (
            !!stage &&
            !!board &&
            board.y >= stage.y - 1 &&
            board.y + board.height <= stage.y + stage.height + 1 &&
            board.x >= stage.x - 1 &&
            board.x + board.width <= stage.x + stage.width + 1
          );
        })
        .toBe(true);
      for (const target of await page
        .locator(
          '#arcade-stage [data-board-mirror], #arcade-stage [data-board-fire]',
        )
        .all()) {
        await expect(target).toBeInViewport({ ratio: 1 });
        const bounds = await target.boundingBox();
        expect(Math.min(bounds.width, bounds.height)).toBeGreaterThanOrEqual(
          44,
        );
      }
    }
    const name = await mirror(page).first().getAttribute('aria-label');
    await page
      .getByRole('button', { name: 'Expand panel', exact: true })
      .click();
    await expect(view(page)).toBeHidden();
    await expect(page.locator('#arcade-full')).toBeInViewport();
    await page
      .getByRole('button', { name: 'Collapse panel', exact: true })
      .click();
    await expect(view(page)).toBeVisible();
    await expect(mirror(page).first()).toHaveAttribute('aria-label', name);
  }
});

test('Arcade no-WebGL fallback remains playable and its controls reset and undo', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2'
        ? null
        : Reflect.apply(original, this, [type, ...args]);
    };
  });
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-presentation', 'flat');
  await mirror(page).press('Enter');
  await page
    .locator('#arcade-panel')
    .getByRole('button', { name: 'Undo', exact: true })
    .click();
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
  await mirror(page).press('Enter');
  await fire(page).press('Enter');
  await expect(result(page)).toContainText('Hit the target');
  await page
    .locator('#arcade-panel')
    .getByRole('button', { name: 'Reset', exact: true })
    .click();
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
});

test('Arcade stale surface loads cannot activate after switching away or closing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  let release;
  await page.route(surfaceRoute, async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-table-status', 'loading');
  await expect.poll(() => typeof release).toBe('function');
  await mirror(page).click();
  await page.locator('#city-destination-studio').click();
  await page.keyboard.press('Escape');
  const loaded = page.waitForResponse(surfaceRoute);
  release();
  await loaded;
  await expect(view(page)).toHaveCount(0);
  await expect(page.locator('#arcade-stage canvas[data-ready]')).toHaveCount(0);
  await expect(page.locator('#city-dialog')).toBeHidden();
  await page.locator('#city-open').click();
  await expect(page.locator('#city-dialog')).toHaveAttribute(
    'data-destination',
    'overview',
  );
  await page.locator('#city-destination-arcade').click();
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await expect(mirror(page)).toHaveAttribute('aria-label', /forward/);
});

test('Arcade context loss falls back with focus and shot intact, then retries on a fresh canvas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enter(page);
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await ready(page);
  await mirror(page).focus();
  await mirror(page).press('Enter');
  await view(page)
    .locator('canvas')
    .evaluate((element) => {
      element
        .getContext('webgl2')
        .getExtension('WEBGL_lose_context')
        .loseContext();
    });
  await expect(view(page)).toHaveAttribute('data-table-status', 'error');
  await expect(mirror(page)).toBeFocused();
  await fire(page).click();
  await expect(result(page)).toContainText('Hit the target');
  await page.getByRole('button', { name: 'Retry 3D', exact: true }).click();
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await expect(result(page)).toContainText('Hit the target');
});

test('Arcade Tab wraps through visible controls and Escape closes in one press', async ({
  page,
}) => {
  await enter(page);
  await page.locator('#city-back').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#city-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#city-back')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#city-dialog')).toBeHidden();
  await expect(page.locator('#city-open')).toBeFocused();
});

test('Arcade GPU allocations stabilize across sessions and only the active canvas draws', async ({
  page,
}) => {
  test.slow();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.arcadeGpu = {
      city: { Buffer: 0, Texture: 0, draws: 0 },
      arcade: { Buffer: 0, Texture: 0, draws: 0 },
    };
    const contexts = new WeakMap();
    const counters = (context) => {
      if (contexts.has(context)) return contexts.get(context);
      const canvas = context.canvas;
      const count =
        canvas.id === 'hero-city'
          ? window.arcadeGpu.city
          : canvas.closest('#arcade-stage')
            ? window.arcadeGpu.arcade
            : null;
      const tracked = { count, Buffer: 0, Texture: 0, lost: false };
      contexts.set(context, tracked);
      if (count)
        canvas.addEventListener('webglcontextlost', () => {
          if (tracked.lost) return;
          tracked.lost = true;
          count.Buffer -= tracked.Buffer;
          count.Texture -= tracked.Texture;
        });
      return tracked;
    };
    for (const kind of ['Buffer', 'Texture']) {
      for (const prefix of ['create', 'delete']) {
        const name = prefix + kind;
        const original = WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name] = function (...args) {
          const value = Reflect.apply(original, this, args);
          const tracked = counters(this);
          if (
            tracked.count &&
            !tracked.lost &&
            (prefix === 'create' ? value : args[0])
          ) {
            const delta = prefix === 'create' ? 1 : -1;
            tracked.count[kind] += delta;
            tracked[kind] += delta;
          }
          return value;
        };
      }
    }
    for (const name of ['drawArrays', 'drawElements']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        const tracked = counters(this);
        if (tracked.count && !tracked.lost) tracked.count.draws++;
        return Reflect.apply(original, this, args);
      };
    }
  });
  await page.goto('/');
  await page.locator('#city-open').click();
  await page.locator('#city-destination-arcade').hover();
  await page.locator('#hero-city').screenshot(sceneOnly);
  await page.locator('#city-destination-arcade').click();
  await expect(view(page)).toHaveAttribute('data-presentation', '3d');
  await ready(page);
  const allocation = () =>
    page.evaluate(() =>
      Object.fromEntries(
        Object.entries(window.arcadeGpu).map(([name, { Buffer, Texture }]) => [
          name,
          { Buffer, Texture },
        ]),
      ),
    );
  const warm = await allocation();
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Escape');
    await expect.poll(allocation).toEqual({
      city: warm.city,
      arcade: { Buffer: 0, Texture: 0 },
    });
    await page.locator('#city-open').click();
    await page.locator('#city-destination-arcade').click();
    await ready(page);
    await view(page).locator('canvas').screenshot();
    expect(await allocation()).toEqual(warm);
  }
  await page.clock.install();
  const draws = () =>
    page.evaluate(() => ({
      city: window.arcadeGpu.city.draws,
      arcade: window.arcadeGpu.arcade.draws,
    }));
  const idle = await draws();
  await page.clock.runFor(1000);
  expect(await draws()).toEqual(idle);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await mirror(page).dispatchEvent('click', { detail: 1 });
  await page.clock.runFor(50);
  expect((await draws()).city).toBe(idle.city);
  await page.evaluate(() => document.body.classList.add('motion-paused'));
  await page.clock.runFor(200);
  const settled = await draws();
  await page.clock.runFor(1000);
  expect(await draws()).toEqual(settled);
  await page.locator('#city-destination-studio').click();
  await page.clock.runFor(1000);
  expect((await draws()).arcade).toBe(settled.arcade);
});
