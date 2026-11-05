import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/play/game.ts';
import { PREFS_KEY, STORAGE_KEY } from '../src/play/progress.ts';

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};
// The city game passes urls: false, so it must never reach window.history.
const withWindow = (localStorage, run) => {
  globalThis.window = { localStorage };
  try {
    run();
  } finally {
    delete globalThis.window;
  }
};

test('Ricochet games share lesson progress and preferences through storage', () => {
  const storage = memoryStorage();
  withWindow(storage, () => {
    const city = createGame({ urls: false });
    city.start();
    assert.equal(city.getSnapshot().state.levelIndex, 0);
    city.rotate('3,1');
    city.fire();
    const shot = city.getSnapshot();
    assert.equal(shot.state.shot.outcome, 'hit');
    assert.equal(shot.shotCount, 1);
    assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), [
      'first-bounce',
    ]);
    city.next();
    assert.equal(city.getSnapshot().state.levelIndex, 1);
    assert.equal(city.getSnapshot().focusRequest, 1);
    city.chooseDifficulty('hard');
    assert.equal(city.getSnapshot().state.mode, 'random');
    assert.equal(city.getSnapshot().state.preset, 'hard');

    const page = createGame({ urls: false });
    page.start();
    const opened = page.getSnapshot();
    assert.ok(opened.state.solved.includes('first-bounce'));
    assert.equal(opened.state.mode, 'random');
    assert.equal(opened.state.preset, 'hard');
    assert.equal(JSON.parse(storage.getItem(PREFS_KEY)).preset, 'hard');
  });
});

test('Ricochet game start is idempotent and notifies subscribers', () => {
  withWindow(memoryStorage(), () => {
    const game = createGame({ urls: false });
    let calls = 0;
    const stop = game.subscribe(() => calls++);
    game.start();
    game.start();
    assert.equal(calls, 1);
    game.undo();
    assert.equal(calls, 2);
    stop();
    game.reset();
    assert.equal(calls, 2);
    assert.equal(game.getServerSnapshot().state.levelIndex, 0);
  });
});
