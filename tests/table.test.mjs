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
} from '../src/play/three/projection.ts';

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

test('Ricochet table keeps the first lesson framing the Arcade was tuned on', () => {
  const [lesson] = campaign;
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 600, height: 900 },
  ]) {
    const camera = framed(lesson, size);
    const aspect = size.width / size.height;
    assert.ok(Math.abs(camera.top - Math.max(4.1, 5.2 / aspect)) < 1e-9);
    assert.ok(Math.abs(camera.right - camera.top * aspect) < 1e-9);
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
