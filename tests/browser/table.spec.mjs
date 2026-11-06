import { test, expect } from './fixtures.mjs';
import raw from '../../src/content/levels.json' with { type: 'json' };
import { parseLevel, trace } from '../../src/play/model.ts';
import { generatePuzzle, PRESETS } from '../../src/play/generate.ts';
import { solve } from '../../src/play/solve.ts';
import {
  cellQuad,
  cellPoint,
  cellSpan,
  frameTable,
  tableCamera,
  toScreen,
} from '../../src/play/three/projection.ts';
import { Vector2, Vector3 } from 'three';

const paneTop = (level, key, slant) => {
  const [x, y] = key.split(',').map(Number);
  return new Vector3(0, 0.19, 0.041)
    .applyAxisAngle(
      new Vector3(0, 1, 0),
      slant.includes('forward') ? Math.PI / 4 : -Math.PI / 4,
    )
    .add(cellPoint(level, x + 0.5, y + 0.5, 1.06));
};
const emitterTop = (level) =>
  new Vector3(0.13, 0.39, 0.02)
    .applyAxisAngle(
      new Vector3(0, 1, 0),
      { E: 0, N: Math.PI / 2, W: Math.PI, S: -Math.PI / 2 }[level.source.dir],
    )
    .add(cellPoint(level, level.source.x + 0.5, level.source.y + 0.5, 0.69));

test('/play cold loads and resizes retain lesson 1 in 3D at desktop heights', async ({
  page,
}) => {
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme });
    for (const height of [768, 900, 1000]) {
      await page.setViewportSize({ width: 1440, height });
      await page.goto('/play');
      await page.evaluate(() => document.fonts.ready);
      const view = page.locator('.ricochet-view');
      await expect(view).toHaveAttribute('data-presentation', '3d', {
        timeout: 15_000,
      });
      const canvas = view.locator('canvas');
      await expect(canvas).toHaveAttribute('data-ready', 'true');
      if (height === 900) {
        expect(await page.evaluate(() => scrollY)).toBe(0);
        await expect(canvas).toBeInViewport({ ratio: 1 });
      }
      await page.setViewportSize({ width: 1280, height });
      await expect(view).toHaveAttribute('data-presentation', '3d');
      await expect
        .poll(async () => {
          const bounds = await canvas.boundingBox();
          const size = { width: bounds.width, height: bounds.height };
          const level = parseLevel(raw[0]);
          const camera = tableCamera();
          frameTable(camera, level, size);
          return cellSpan(camera, level, size);
        })
        .toBeGreaterThanOrEqual(44);
    }
  }
});

for (const destination of ['play', 'arcade']) {
  test(`${destination} 3D and flat boards agree for every lesson and seeded difficulty`, async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(destination === 'play' ? '/play' : '/');
    if (destination === 'arcade') {
      await page.locator('#city-open').click();
      await page.locator('#city-destination-arcade').click();
    }
    const panel = page.locator(
      destination === 'play' ? '.ricochet-panel' : '#arcade-panel',
    );
    const view = page.locator(
      destination === 'play'
        ? '.ricochet-view'
        : '#arcade-stage .ricochet-view',
    );
    for (const presentation of ['3d', 'flat']) {
      for (const name of [
        'lesson-1',
        'lesson-2',
        'lesson-3',
        'lesson-4',
        'lesson-5',
        'easy',
        'medium',
        'hard',
        'today',
      ]) {
        let level;
        if (name.startsWith('lesson-')) {
          await page
            .getByRole('button', { name: 'Learn', exact: true })
            .click();
          const index = Number(name.at(-1)) - 1;
          await page
            .getByRole('button', { name: new RegExp(`^Lesson ${index + 1},`) })
            .click();
          level = parseLevel(raw[index]);
        } else if (name === 'today') {
          await page
            .getByRole('button', { name: 'Today', exact: true })
            .click();
          const date = await page.evaluate(() =>
            new Date().toISOString().slice(0, 10),
          );
          level = generatePuzzle(`daily:${date}`, PRESETS.medium);
        } else {
          await page
            .getByRole('button', { name: 'Random', exact: true })
            .click();
          await page
            .getByRole('button', { name: new RegExp(`^${name}$`, 'i') })
            .click();
          const heading = await page
            .locator('.ricochet-level-heading .kicker')
            .textContent();
          const seed = heading.match(/SEED ([0-9A-Z]+)/)[1];
          level = generatePuzzle(seed, PRESETS[name]);
        }
        await page
          .getByRole('button', {
            name: presentation === '3d' ? '3D table' : 'Flat board',
            exact: true,
          })
          .click();
        await expect(view).toHaveAttribute('data-presentation', presentation);
        if (presentation === '3d')
          await expect(view.locator('canvas')).toHaveAttribute(
            'data-ready',
            'true',
          );
        const shot = trace(level, level.mirrors);
        const outcome = {
          hit: 'Hit the target',
          blocked: 'Blocked by a wall',
          escaped: 'The beam left the grid',
          loop: 'Loop:',
        }[shot.outcome];
        await panel.getByRole('button', { name: 'Fire', exact: true }).click();
        await expect(panel.locator('[role="status"]')).toContainText(outcome);
        const solved = solve(level);
        for (const [key, slant] of Object.entries(solved.mirrors)) {
          if (slant === level.mirrors[key]) continue;
          await view
            .locator(
              `[data-${presentation === '3d' ? 'table' : 'board'}-mirror="${key}"]`,
            )
            .click();
        }
        await panel.getByRole('button', { name: 'Fire', exact: true }).click();
        await expect(panel.locator('[role="status"]')).toContainText(
          `Hit the target in ${trace(level, solved.mirrors).path.length} cells.`,
        );
        if (destination === 'arcade' && name === 'lesson-5')
          await expect(
            page.locator('#city-dialog a[href="/play"]'),
          ).toHaveCount(1);
      }
    }
  });

  test(`${destination} cell polygons match projection and reject the old rectangular corners`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(destination === 'play' ? '/play' : '/');
    if (destination === 'arcade') {
      await page.locator('#city-open').click();
      await page.locator('#city-destination-arcade').click();
    }
    const view = page.locator(
      destination === 'play'
        ? '.ricochet-view'
        : '#arcade-stage .ricochet-view',
    );
    await expect(view).toHaveAttribute('data-presentation', '3d', {
      timeout: 15_000,
    });
    await expect(view.locator('canvas')).toHaveAttribute('data-ready', 'true');
    const target = view.locator('[data-table-mirror]');
    await target.scrollIntoViewIfNeeded();
    const bounds = await target.boundingBox();
    const before = await target.getAttribute('aria-label');
    const outside = { x: bounds.x + 1, y: bounds.y + 1 };
    expect(
      await page.evaluate(
        ({ x, y }) =>
          !!document.elementFromPoint(x, y)?.closest('[data-table-mirror]'),
        outside,
      ),
    ).toBe(false);
    await page.mouse.click(outside.x, outside.y);
    await expect(target).toHaveAttribute('aria-label', before);
    await page.mouse.click(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    await expect(target).toHaveAttribute('aria-label', /backward/);
    await target.press('Enter');
    await expect(target).toHaveAttribute('aria-label', before);
    await expect(target.locator('svg')).toHaveCSS('opacity', '1');
    await page.getByRole('button', { name: /^Lesson 5,/ }).click();
    await expect(view).toHaveAttribute('data-presentation', '3d');
    const canvas = await view.locator('canvas').boundingBox();
    const size = { width: canvas.width, height: canvas.height };
    const level = parseLevel(raw[4]);
    const camera = tableCamera();
    frameTable(camera, level, size);
    for (const [key] of Object.entries(level.mirrors)) {
      const button = view.locator(`[data-table-mirror="${key}"]`);
      const rect = await button.boundingBox();
      const values = await button.evaluate((element) =>
        getComputedStyle(element)
          .clipPath.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)
          .map(Number),
      );
      const polygon = Array.from(
        { length: 4 },
        (_, index) =>
          new Vector2(
            rect.x - canvas.x + values[index * 2],
            rect.y - canvas.y + values[index * 2 + 1],
          ),
      );
      const [x, y] = key.split(',').map(Number);
      const expected = cellQuad(camera, level, size, x, y);
      for (let index = 0; index < 4; index++)
        expect(polygon[index].distanceTo(expected[index])).toBeLessThan(2);
      const u = polygon[1].clone().sub(polygon[0]);
      const v = polygon[3].clone().sub(polygon[0]);
      expect(
        Math.abs(u.cross(v)) / Math.max(u.length(), v.length()),
      ).toBeGreaterThanOrEqual(43.99);
    }
  });

  test.describe(`${destination} piece hover`, () => {
    test.use({ hasTouch: false, isMobile: false });
    test('hovering raised pieces outlines their own floor targets, not the cell behind', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(destination === 'play' ? '/play' : '/');
      if (destination === 'arcade') {
        await page.locator('#city-open').click();
        await page.locator('#city-destination-arcade').click();
      }
      const view = page.locator(
        destination === 'play'
          ? '.ricochet-view'
          : '#arcade-stage .ricochet-view',
      );
      await page.getByRole('button', { name: /^Lesson 5,/ }).click();
      await expect(view).toHaveAttribute('data-presentation', '3d');
      await expect(view.locator('canvas')).toHaveAttribute(
        'data-ready',
        'true',
      );
      await view.locator('canvas').scrollIntoViewIfNeeded();
      const bounds = await view.locator('canvas').boundingBox();
      const size = { width: bounds.width, height: bounds.height };
      const level = parseLevel(raw[4]);
      const camera = tableCamera();
      frameTable(camera, level, size);
      for (const key of Object.keys(level.mirrors)) {
        const button = view.locator(`[data-table-mirror="${key}"]`);
        for (let turn = 0; turn < 2; turn++) {
          await page.mouse.move(0, 0);
          const point = toScreen(
            camera,
            paneTop(level, key, await button.getAttribute('aria-label')),
            size,
          ).add(new Vector2(bounds.x, bounds.y));
          await page.mouse.move(point.x, point.y);
          await expect(button).toHaveAttribute('data-hovered', '');
          await expect(button.locator('svg')).toHaveCSS('opacity', '1');
          await expect(view.locator('[data-hovered]')).toHaveCount(1);
          await button.press('Enter');
        }
      }
      const sourcePoint = toScreen(camera, emitterTop(level), size).add(
        new Vector2(bounds.x, bounds.y),
      );
      await page.mouse.move(sourcePoint.x, sourcePoint.y);
      await expect(view.locator('[data-table-fire]')).toHaveAttribute(
        'data-hovered',
        '',
      );
      await expect(view.locator('[data-hovered]')).toHaveCount(1);
      await page.mouse.move(0, 0);
      await expect(view.locator('[data-hovered]')).toHaveCount(0);
      await page
        .getByRole('button', { name: 'Flat board', exact: true })
        .click();
      await expect(view.locator('[data-hovered]')).toHaveCount(0);
    });
  });

  test.describe(`${destination} visible mirror taps`, () => {
    test.use({ hasTouch: true });
    test('tapping the raised pane and emitter above their floor cells routes the correct action', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(destination === 'play' ? '/play' : '/');
      if (destination === 'arcade') {
        await page.locator('#city-open').click();
        await page.locator('#city-destination-arcade').click();
      }
      const view = page.locator(
        destination === 'play'
          ? '.ricochet-view'
          : '#arcade-stage .ricochet-view',
      );
      for (const index of [0, 4]) {
        await page
          .getByRole('button', { name: new RegExp(`^Lesson ${index + 1},`) })
          .click();
        await expect(view).toHaveAttribute('data-presentation', '3d');
        const canvas = view.locator('canvas');
        await expect(canvas).toHaveAttribute('data-ready', 'true');
        await canvas.scrollIntoViewIfNeeded();
        const bounds = await canvas.boundingBox();
        const size = { width: bounds.width, height: bounds.height };
        const level = parseLevel(raw[index]);
        const camera = tableCamera();
        frameTable(camera, level, size);
        for (const key of Object.keys(level.mirrors)) {
          const button = view.locator(`[data-table-mirror="${key}"]`);
          for (let turn = 0; turn < 2; turn++) {
            const before = await button.getAttribute('aria-label');
            const others = await view
              .locator(`[data-table-mirror]:not([data-table-mirror="${key}"])`)
              .evaluateAll((elements) =>
                elements.map((element) => element.getAttribute('aria-label')),
              );
            const point = paneTop(level, key, before);
            const tap = toScreen(camera, point, size).add(
              new Vector2(bounds.x, bounds.y),
            );
            expect(
              await page.evaluate(
                ({ x, y }) =>
                  document.elementFromPoint(x, y)?.closest('button')?.dataset
                    .tableMirror,
                { x: tap.x, y: tap.y },
              ),
            ).not.toBe(key);
            await page.touchscreen.tap(tap.x, tap.y);
            await expect(button).not.toHaveAttribute('aria-label', before);
            await expect(button).toBeFocused();
            expect(
              await view
                .locator(
                  `[data-table-mirror]:not([data-table-mirror="${key}"])`,
                )
                .evaluateAll((elements) =>
                  elements.map((element) => element.getAttribute('aria-label')),
                ),
            ).toEqual(others);
          }
        }
      }
      const level = parseLevel(raw[4]);
      const bounds = await view.locator('canvas').boundingBox();
      const size = { width: bounds.width, height: bounds.height };
      const camera = tableCamera();
      frameTable(camera, level, size);
      const point = toScreen(camera, emitterTop(level), size).add(
        new Vector2(bounds.x, bounds.y),
      );
      expect(
        await page.evaluate(
          ({ x, y }) =>
            !!document.elementFromPoint(x, y)?.closest('[data-table-fire]'),
          { x: point.x, y: point.y },
        ),
      ).toBe(false);
      await page.touchscreen.tap(point.x, point.y);
      await expect(view.locator('[data-table-fire]')).toBeFocused();
      const panel = page.locator(
        destination === 'play' ? '.ricochet-panel' : '#arcade-panel',
      );
      await expect(panel.locator('[role="status"]')).toContainText(
        /Hit the target|Blocked by a wall|The beam left the grid|Loop:/,
      );
      await expect(view.locator('[data-hovered]')).toHaveCount(0);
    });
  });
}

test('/play cancels an unfinished table upgrade when Flat board is chosen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  let release;
  const routePattern = /\/assets\/surface-[^/]+\.js$/;
  await page.route(routePattern, async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.goto('/play');
  const view = page.locator('.ricochet-view');
  await expect(view).toHaveAttribute('data-table-status', 'loading');
  await expect.poll(() => typeof release).toBe('function');
  await page.getByRole('button', { name: 'Flat board', exact: true }).click();
  const loaded = page.waitForResponse(routePattern);
  release();
  await loaded;
  await expect(view).toHaveAttribute('data-table-status', 'idle');
  await expect(view.locator('canvas[data-ready]')).toHaveCount(0);
  await expect(view).toHaveAttribute('data-presentation', 'flat');
  await view.locator('[data-board-mirror]').press('Enter');
  await page
    .locator('.ricochet-panel')
    .getByRole('button', { name: 'Fire', exact: true })
    .click();
  await expect(page.locator('.ricochet-panel [role="status"]')).toContainText(
    'Hit the target',
  );
});
