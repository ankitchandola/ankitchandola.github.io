import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import Board from './Board';
import { describe, place } from './board-path';
import {
  Zap,
  Undo2,
  RotateCcw,
  Check,
  Repeat,
  Ban,
  LogOut,
  ArrowRight,
  ArrowUpRight,
  Link2,
  CalendarDays,
  Shuffle,
  type LucideIcon,
} from 'lucide-react';
import raw from '../content/levels.json' with { type: 'json' };
import {
  parseLevel,
  createReducer,
  initialState,
  canUndo,
  canReset,
  allSolved,
  trace,
  isPresetName,
} from './model.ts';
import type {
  GameAction,
  GameState,
  Level,
  PresetName,
  SavedMode,
  Shot,
} from './model.ts';
import { loadSolved, saveSolved, loadPrefs, savePrefs } from './progress.ts';
import type { Preferences } from './progress.ts';
import {
  PRESETS,
  generatePuzzle,
  dailySeed,
  encodeLevel,
  decodeLevel,
} from './generate.ts';
import { randomSeed } from './random.ts';
import './play.css';
const levels = raw.map(parseLevel);
const reducer = createReducer(levels);
const browserStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
const PRESET_LABELS: Record<PresetName, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
const MODES: readonly (readonly [SavedMode, string])[] = [
  ['campaign', 'Learn'],
  ['random', 'Random'],
  ['daily', 'Today'],
];
const SEED = /^[0-9A-Z]{1,12}$/;
type LoadAction = Extract<GameAction, { type: 'load' }>;
type OpenAction = Extract<GameAction, { type: 'load' | 'select' | 'next' }>;
interface UIState {
  prefs: Preferences;
  notice: string;
  shareUrl: string;
}
type UIPatch = Partial<UIState> | ((current: UIState) => Partial<UIState>);
const displayDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase();

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
// replaceState keeps reload and back sensible without adding routes for every puzzle.
function replaceQuery(query: string): void {
  window.history.replaceState(null, '', window.location.pathname + query);
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

function Result({
  shot,
  mode,
  solvedAll,
  onNext,
  onNew,
  onRandom,
  onToday,
}: Pick<GameState, 'shot' | 'mode'> & {
  solvedAll: boolean;
  onNext: () => void;
  onNew: () => void;
  onRandom: () => void;
  onToday: () => void;
}) {
  if (!shot)
    return <p className="ricochet-result">Turn the mirrors, then fire.</p>;
  const { x, y } = shot.end;
  const outcomes: Record<Shot['outcome'], readonly [LucideIcon, string]> = {
    hit: [Check, `Hit the target in ${shot.path.length} cells.`],
    blocked: [Ban, `Blocked by a wall at ${place(x, y)}.`],
    escaped: [LogOut, 'The beam left the grid.'],
    loop: [Repeat, 'Loop: the beam would bounce forever.'],
  };
  const [Icon, text] = outcomes[shot.outcome];
  let after: ReactNode = null;
  if (shot.outcome === 'hit' && mode !== 'campaign')
    after = (
      <button type="button" className="solid-button" onClick={onNew}>
        New puzzle
        <Shuffle size={22} />
      </button>
    );
  else if (shot.outcome === 'hit')
    after = solvedAll ? (
      <div className="ricochet-done">
        <p>You’ve learned the rules. Now try a puzzle you haven’t seen.</p>
        <div className="ricochet-done-actions">
          <button type="button" className="solid-button" onClick={onRandom}>
            Random puzzle
            <Shuffle size={22} />
          </button>
          <button type="button" className="ricochet-button" onClick={onToday}>
            <CalendarDays size={22} />
            Today’s puzzle
          </button>
        </div>
        <a href="/#work">
          Back to the work
          <ArrowUpRight size={18} />
        </a>
      </div>
    ) : (
      <button type="button" className="solid-button" onClick={onNext}>
        Next lesson
        <ArrowRight size={22} />
      </button>
    );
  return (
    <div className={'ricochet-result is-' + shot.outcome}>
      <p>
        <Icon size={24} aria-hidden="true" />
        <span>{text}</span>
      </p>
      {after}
    </div>
  );
}

function Heading({
  state,
  solvedToday,
  headingRef,
}: {
  state: GameState;
  solvedToday: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const { mode, level, preset, seed } = state;
  const kicker = {
    campaign: `LESSON ${state.levelIndex + 1} OF ${levels.length}`,
    random: `RANDOM · ${preset ? PRESET_LABELS[preset].toUpperCase() : undefined} · SEED ${seed}`,
    daily: `PUZZLE OF THE DAY · ${seed && displayDate(seed)}`,
    shared: `SHARED PUZZLE${preset ? ` · ${PRESET_LABELS[preset].toUpperCase()}` : ''}`,
  }[mode];
  return (
    <div className="ricochet-level-heading">
      <span className="kicker">{kicker}</span>
      <h2 ref={headingRef} tabIndex={-1}>
        {mode === 'campaign'
          ? level.title
          : mode === 'shared'
            ? 'Shared puzzle'
            : 'Generated puzzle'}
      </h2>
      <p>{level.hint}</p>
      {mode === 'daily' && solvedToday && (
        <p className="ricochet-solved-today">
          <Check size={20} aria-hidden="true" />
          Solved today
        </p>
      )}
    </div>
  );
}

function ShareFallback({ url }: { url: string }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.select(), [url]);
  return (
    <label className="ricochet-share">
      Copy this link
      <input
        ref={input}
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
      />
    </label>
  );
}

export default function Ricochet() {
  const [state, dispatch] = useReducer(reducer, levels, initialState);
  const [shotCount, setShotCount] = useState(0);
  const [ui, setUi] = useReducer(
    (current: UIState, patch: UIPatch): UIState => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }),
    { prefs: {}, notice: '', shareUrl: '' },
  );
  const { prefs, notice, shareUrl } = ui;
  const heading = useRef<HTMLHeadingElement>(null),
    focusHeading = useRef(false);
  const { level, mode } = state;
  const solvedCount = levels.filter((l) => state.solved.includes(l.id)).length;

  useEffect(() => {
    const storage = browserStorage();
    const ids = loadSolved(
      storage,
      levels.map((l) => l.id),
    );
    if (ids.length) dispatch({ type: 'loaded', ids });
    const saved = loadPrefs(storage);
    const action = startingAction(window.location.search, saved);
    setUi({
      prefs: saved,
      notice:
        action && 'invalidLink' in action
          ? "That puzzle link isn't valid."
          : '',
    });
    if (action && 'type' in action) {
      dispatch(action);
      replaceQuery(queryFor(action));
    } else if (window.location.search) replaceQuery('');
  }, []);
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus();
  }, [level]);

  const remember = (patch: Preferences) => {
    savePrefs(browserStorage(), patch);
    setUi((current) => ({ prefs: { ...current.prefs, ...patch } }));
  };
  const open = (action: OpenAction | null) => {
    if (!action) {
      setUi({
        notice: "Couldn't build a puzzle just now. Try again.",
        shareUrl: '',
      });
      return;
    }
    setUi({ notice: '', shareUrl: '' });
    focusHeading.current = true;
    dispatch(action);
    replaceQuery(queryFor(action));
  };
  const act = (action: GameAction) => {
    setUi({ notice: '', shareUrl: '' });
    dispatch(action);
  };
  const chooseMode = (next: SavedMode) => {
    if (next === 'campaign') open({ type: 'select', index: state.levelIndex });
    if (next === 'random') open(randomPuzzle(prefs.preset ?? 'medium'));
    if (next === 'daily') open(dailyPuzzle());
    remember({ mode: next });
  };
  const chooseDifficulty = (preset: PresetName) => {
    open(randomPuzzle(preset));
    remember({ mode: 'random', preset });
  };
  const newPuzzle = () => {
    open(
      randomPuzzle(
        mode === 'daily'
          ? 'medium'
          : (state.preset ?? prefs.preset ?? 'medium'),
      ),
    );
    remember({ mode: 'random' });
  };
  const fire = () => {
    act({ type: 'fire' });
    setShotCount((n) => n + 1);
    if (trace(level, state.mirrors).outcome !== 'hit') return;
    if (mode === 'campaign' && !state.solved.includes(level.id))
      saveSolved(browserStorage(), [level.id]);
    if (mode === 'daily' && state.seed) remember({ dailySolved: state.seed });
  };
  const copyLink = async () => {
    const url =
      window.location.origin +
      window.location.pathname +
      shareQuery(level, state.preset);
    try {
      await navigator.clipboard.writeText(url);
      setUi({ notice: 'Link copied.', shareUrl: '' });
    } catch {
      setUi({ notice: '', shareUrl: url });
    }
  };

  return (
    <section className="case-page shell ricochet">
      <div className="case-page-heading">
        <span className="kicker">SIDE PROJECT / PUZZLE</span>
        <h1>Ricochet</h1>
        <p>Turn the mirrors so the beam bounces into the target.</p>
      </div>
      <noscript>
        <p className="ricochet-noscript">
          The puzzle needs JavaScript. Lesson 1 is shown below as a preview.
        </p>
      </noscript>
      <div className="ricochet-layout">
        <div className="ricochet-stage">
          <div className="ricochet-modes" role="group" aria-label="Puzzle type">
            {MODES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => chooseMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <Heading
            state={state}
            solvedToday={mode === 'daily' && prefs.dailySolved === state.seed}
            headingRef={heading}
          />
          <p className="sr-only">{describe(level)}</p>
          <Board
            level={level}
            mirrors={state.mirrors}
            shot={state.shot}
            shotCount={shotCount}
            onRotate={(key) => act({ type: 'rotate', key })}
            onFire={fire}
          />
        </div>
        <div className="ricochet-panel">
          <div className="ricochet-controls">
            <button type="button" className="solid-button" onClick={fire}>
              <Zap size={22} />
              Fire
            </button>
            <button
              type="button"
              className="ricochet-button"
              onClick={() => act({ type: 'undo' })}
              disabled={!canUndo(state)}
            >
              <Undo2 size={22} />
              Undo
            </button>
            <button
              type="button"
              className="ricochet-button"
              onClick={() => act({ type: 'reset' })}
              disabled={!canReset(state)}
            >
              <RotateCcw size={22} />
              Reset
            </button>
            {mode !== 'campaign' && (
              <button
                type="button"
                className="ricochet-button"
                onClick={() => {
                  void copyLink();
                }}
              >
                <Link2 size={22} />
                Copy link
              </button>
            )}
          </div>
          {shareUrl && <ShareFallback url={shareUrl} />}
          <div role="status" aria-live="polite" aria-atomic="true">
            {notice && <p className="ricochet-notice">{notice}</p>}
            <Result
              shot={state.shot}
              mode={mode}
              solvedAll={allSolved(levels, state.solved)}
              onNext={() => open({ type: 'next' })}
              onNew={newPuzzle}
              onRandom={() => chooseMode('random')}
              onToday={() => chooseMode('daily')}
            />
          </div>
          {mode === 'campaign' && (
            <div className="ricochet-levels">
              <span className="kicker" aria-hidden="true">
                LESSONS · {solvedCount} OF {levels.length} SOLVED
              </span>
              <div role="group" aria-label="Choose a lesson">
                {levels.map((l, i) => {
                  const solved = state.solved.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={solved ? 'is-solved' : undefined}
                      aria-pressed={i === state.levelIndex}
                      aria-label={`Lesson ${i + 1}, ${l.title}${solved ? ', solved' : ''}`}
                      onClick={() => open({ type: 'select', index: i })}
                    >
                      {i + 1}
                      {solved && (
                        <span
                          className="ricochet-solved-badge"
                          aria-hidden="true"
                        >
                          <Check size={13} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {mode === 'random' && (
            <div className="ricochet-levels">
              <span className="kicker" aria-hidden="true">
                DIFFICULTY
              </span>
              <div role="group" aria-label="Choose a difficulty">
                {Object.keys(PRESET_LABELS)
                  .filter(isPresetName)
                  .map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={state.preset === value}
                      onClick={() => chooseDifficulty(value)}
                    >
                      {PRESET_LABELS[value]}
                    </button>
                  ))}
                <button
                  type="button"
                  className="ricochet-new"
                  onClick={newPuzzle}
                >
                  <Shuffle size={18} aria-hidden="true" />
                  New puzzle
                </button>
              </div>
            </div>
          )}
          <div className="ricochet-guide">
            <h2>How to play</h2>
            <ol>
              <li>Tap a mirror to turn it a quarter turn.</li>
              <li>
                Press Fire, or tap the beam’s starting arrow, to send the beam.
              </li>
              <li>
                Reach the target. Walls stop the beam, edges let it escape, and
                some layouts send it round in circles.
              </li>
              <li>
                Undo takes back your last turn. Reset starts the puzzle again.
              </li>
              <li>
                Random builds a fresh puzzle at the difficulty you choose. Today
                is the same puzzle for everyone, changing at midnight UTC.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
