import raw from '../content/levels.json' with { type: 'json' };
import {
  allSolved,
  createReducer,
  initialState,
  isPresetName,
  parseLevel,
  trace,
} from './model.ts';
import type {
  GameAction,
  GameState,
  Level,
  PresetName,
  SavedMode,
} from './model.ts';
import {
  loadPrefs,
  loadSolved,
  savePrefs,
  saveSolved,
  type Preferences,
  type StorageLike,
} from './progress.ts';
import {
  PRESETS,
  decodeLevel,
  dailySeed,
  encodeLevel,
  generatePuzzle,
} from './generate.ts';
import { randomSeed } from './random.ts';

export const levels = raw.map(parseLevel);
const reducer = createReducer(levels);
const SEED = /^[0-9A-Z]{1,12}$/;
type LoadAction = Extract<GameAction, { type: 'load' }>;
type OpenAction = Extract<GameAction, { type: 'load' | 'select' | 'next' }>;

export interface GameSnapshot {
  readonly state: GameState;
  readonly prefs: Preferences;
  readonly notice: string;
  readonly shareUrl: string;
  /** Increments on every shot so a repeated identical shot still replays. */
  readonly shotCount: number;
  /** Increments when a newly opened puzzle should move focus to its heading. */
  readonly focusRequest: number;
  /** Whether the last change came from an action that should animate. */
  readonly animate: boolean;
}
export interface GameOptions {
  /** The full page reads and rewrites the address; the city must not touch the homepage URL. */
  urls: boolean;
}
export type RicochetGame = ReturnType<typeof createGame>;

const browserStorage = (): StorageLike | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

function randomPuzzle(
  preset: PresetName,
  seed = randomSeed(),
): LoadAction | null {
  const level = generatePuzzle(seed, PRESETS[preset]);
  return level && { type: 'load', mode: 'random', level, preset, seed };
}
function dailyPuzzle(now = new Date()): LoadAction | null {
  const level = generatePuzzle(dailySeed(now), PRESETS.medium);
  const date = now.toISOString().slice(0, 10);
  return (
    level && {
      type: 'load',
      mode: 'daily',
      level,
      preset: 'medium',
      seed: date,
    }
  );
}
const shareQuery = (level: Level, preset: PresetName | null | undefined) =>
  `?l=${encodeLevel(level)}${preset ? `&d=${preset}` : ''}`;
function queryFor(action: OpenAction): string {
  if (action.type !== 'load') return '';
  const { mode, level, preset, seed } = action;
  if (mode === 'random') return `?seed=${seed}&d=${preset}`;
  if (mode === 'daily') return '?mode=today';
  if (mode === 'shared') return shareQuery(level, preset);
  return '';
}
// URL parameters win over saved preferences: opening a link means wanting that puzzle.
function startingAction(
  search: string,
  prefs: Preferences,
): LoadAction | { invalidLink: true } | null {
  const params = new URLSearchParams(search);
  const difficulty = params.get('d');
  const preset = isPresetName(difficulty) ? difficulty : null;
  if (params.has('l')) {
    const level = decodeLevel(params.get('l'));
    return level
      ? { type: 'load', mode: 'shared', level, preset }
      : { invalidLink: true };
  }
  const seed = params.get('seed')?.toUpperCase();
  if (seed && SEED.test(seed)) return randomPuzzle(preset ?? 'medium', seed);
  if (params.get('mode') === 'today') return dailyPuzzle();
  if (prefs.mode === 'random') return randomPuzzle(prefs.preset ?? 'medium');
  if (prefs.mode === 'daily') return dailyPuzzle();
  return null;
}

export function createGame({ urls }: GameOptions) {
  const listeners = new Set<() => void>();
  const initial: GameSnapshot = {
    state: initialState(levels),
    prefs: {},
    notice: '',
    shareUrl: '',
    shotCount: 0,
    focusRequest: 0,
    animate: false,
  };
  let snapshot = initial;
  let started = false;
  const set = (patch: Partial<GameSnapshot>) => {
    snapshot = { ...snapshot, animate: false, ...patch };
    listeners.forEach((listener) => listener());
  };
  // replaceState keeps reload and back sensible without adding routes for every puzzle.
  const replaceQuery = (query: string) => {
    if (urls)
      window.history.replaceState(null, '', window.location.pathname + query);
  };
  const remember = (patch: Preferences) => {
    savePrefs(browserStorage(), patch);
    return { ...snapshot.prefs, ...patch };
  };
  const open = (action: OpenAction | null, prefs = snapshot.prefs) => {
    if (!action) {
      set({
        prefs,
        notice: "Couldn't build a puzzle just now. Try again.",
        shareUrl: '',
      });
      return;
    }
    const state = reducer(snapshot.state, action);
    set({
      state,
      prefs,
      notice: '',
      shareUrl: '',
      focusRequest:
        snapshot.focusRequest + (state.level === snapshot.state.level ? 0 : 1),
    });
    replaceQuery(queryFor(action));
  };
  const act = (action: GameAction, animate = false) =>
    set({
      state: reducer(snapshot.state, action),
      notice: '',
      shareUrl: '',
      animate,
    });

  const game = {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    start: () => {
      if (started) return;
      started = true;
      const storage = browserStorage();
      const ids = loadSolved(
        storage,
        levels.map((l) => l.id),
      );
      let state = ids.length
        ? reducer(snapshot.state, { type: 'loaded', ids })
        : snapshot.state;
      const prefs = loadPrefs(storage);
      const action = urls
        ? startingAction(window.location.search, prefs)
        : startingAction('', prefs);
      if (action && 'type' in action) {
        state = reducer(state, action);
        replaceQuery(queryFor(action));
      } else if (urls && window.location.search) replaceQuery('');
      set({
        state,
        prefs,
        notice:
          action && 'invalidLink' in action
            ? "That puzzle link isn't valid."
            : '',
      });
    },
    rotate: (key: string, animate = true) => {
      act({ type: 'rotate', key }, animate);
    },
    undo: () => act({ type: 'undo' }),
    reset: () => act({ type: 'reset' }),
    fire: (animate = true) => {
      const { state } = snapshot;
      const hit = trace(state.level, state.mirrors).outcome === 'hit';
      let prefs = snapshot.prefs;
      if (
        hit &&
        state.mode === 'campaign' &&
        !state.solved.includes(state.level.id)
      )
        saveSolved(browserStorage(), [state.level.id]);
      if (hit && state.mode === 'daily' && state.seed)
        prefs = remember({ dailySolved: state.seed });
      set({
        state: reducer(state, { type: 'fire' }),
        prefs,
        notice: '',
        shareUrl: '',
        shotCount: snapshot.shotCount + 1,
        animate,
      });
    },
    select: (index: number) => open({ type: 'select', index }),
    next: () => open({ type: 'next' }),
    chooseMode: (next: SavedMode) => {
      const prefs = remember({ mode: next });
      if (next === 'campaign')
        open({ type: 'select', index: snapshot.state.levelIndex }, prefs);
      if (next === 'random')
        open(randomPuzzle(snapshot.prefs.preset ?? 'medium'), prefs);
      if (next === 'daily') open(dailyPuzzle(), prefs);
    },
    chooseDifficulty: (preset: PresetName) => {
      open(randomPuzzle(preset), remember({ mode: 'random', preset }));
    },
    newPuzzle: () => {
      const { state, prefs } = snapshot;
      open(
        randomPuzzle(
          state.mode === 'daily'
            ? 'medium'
            : (state.preset ?? prefs.preset ?? 'medium'),
        ),
        remember({ mode: 'random' }),
      );
    },
    copyLink: async () => {
      const { level, preset } = snapshot.state;
      const url =
        window.location.origin +
        window.location.pathname +
        shareQuery(level, preset);
      try {
        await navigator.clipboard.writeText(url);
        set({ notice: 'Link copied.', shareUrl: '' });
      } catch {
        set({ notice: '', shareUrl: url });
      }
    },
    remember: (patch: Preferences) => {
      set({ prefs: remember(patch) });
    },
  };
  return game;
}

export const solvedAll = (state: GameState) => allSolved(levels, state.solved);
