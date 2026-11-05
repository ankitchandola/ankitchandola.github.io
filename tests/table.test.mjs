import test from 'node:test';
import assert from 'node:assert/strict';
import raw from '../src/content/levels.json' with { type: 'json' };
import { parseLevel } from '../src/play/model.ts';
import { generatePuzzle, PRESETS } from '../src/play/generate.ts';
import {
  cellAt,
  cellSpan,
  frameTable,
  mirrorRects,
  tableCamera,
  tableFits,
  toScreen,
} from '../src/play/three/projection.ts';
import { Vector3 } from 'three';
import { mayFitTable } from '../src/play/table-fit.ts';

const campaign = raw.map(parseLevel);
const generated = Object.entries(PRESETS).map(([name, preset]) =>
  generatePuzzle(`table-${name}`, preset),
);
const levels = [...campaign, ...generated];
const framed = (level, size) => {
  const camera = tableCamera();
  frameTable(camera, level, size);
  return camera;
};

test('Ricochet table frames the whole table, sign and legs with a margin', () => {
  for (const level of levels)
    for (const size of [
      { width: 1440, height: 1000 },
      { width: 600, height: 900 },
    ]) {
      const camera = framed(level, size);
      const corners = [];
      for (const x of [-1, 1])
        for (const z of [-(level.h / 2 + 0.5), (level.h + 1.4) / 2])
          for (const y of [-0.55, 2.15])
            corners.push(
              toScreen(
                camera,
                new Vector3((x * (level.w + 1.3)) / 2, y, z),
                size,
              ),
            );
      const xs = corners.map((c) => c.x),
        ys = corners.map((c) => c.y);
      const gap = Math.min(
        Math.min(...xs),
        size.width - Math.max(...xs),
        Math.min(...ys),
        size.height - Math.max(...ys),
      );
      assert.ok(gap > 0, `${level.id} ${size.width}`);
      assert.ok(
        Math.min(...ys) > 0.03 * size.height ||
          Math.min(...xs) > 0.03 * size.width,
        level.id,
      );
    }
});

test('Ricochet table measures every board and picks mirrors from their projected rectangles', () => {
  assert.ok(generated.every(Boolean));
  const desktop = { width: 1440, height: 1000 };
  for (const level of levels) {
    const camera = framed(level, desktop);
    assert.ok(tableFits(camera, level, desktop), level.id);
    const rects = mirrorRects(camera, level, desktop);
    assert.equal(rects.size, Object.keys(level.mirrors).length);
    for (const [key, rect] of rects) {
      assert.ok(rect.x >= 0 && rect.y >= 0, `${level.id} ${key}`);
      assert.ok(rect.x + rect.width <= desktop.width, `${level.id} ${key}`);
      assert.ok(rect.y + rect.height <= desktop.height, `${level.id} ${key}`);
      assert.ok(Math.min(rect.width, rect.height) >= 44, `${level.id} ${key}`);
      const centre = [rect.x + rect.width / 2, rect.y + rect.height / 2];
      assert.equal(cellAt(camera, level, desktop, ...centre), key);
    }
    assert.equal(cellAt(camera, level, desktop, 1, 1), null);
  }
});

test('Ricochet table reports when cells fall below touch size', () => {
  const phone = { width: 375, height: 500 };
  for (const level of levels) {
    const camera = framed(level, phone);
    assert.ok(cellSpan(camera, level, phone) < 44);
    assert.equal(tableFits(camera, level, phone), false);
  }
  const short = { width: 1440, height: 250 };
  assert.equal(
    tableFits(framed(campaign[0], short), campaign[0], short),
    false,
  );
});

test('the cheap fit bound never rejects a canvas where a preset board fits', () => {
  for (const level of levels)
    for (let width = 300; width <= 1600; width += 50)
      for (let height = 200; height <= 1200; height += 50) {
        const size = { width, height };
        if (tableFits(framed(level, size), level, size))
          assert.ok(
            mayFitTable(width, height),
            `${level.id} ${width}×${height}`,
          );
      }
});
