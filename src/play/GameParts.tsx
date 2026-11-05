import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactNode, RefObject } from 'react';
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
import { place } from './board-path';
import {
  canReset,
  canUndo,
  isPresetName,
  type GameState,
  type PresetName,
  type SavedMode,
  type Shot,
} from './model.ts';
import { levels, solvedAll, type RicochetGame } from './game.ts';

export const PRESET_LABELS: Record<PresetName, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
const MODES: readonly (readonly [SavedMode, string])[] = [
  ['campaign', 'Learn'],
  ['random', 'Random'],
  ['daily', 'Today'],
];
const displayDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase();

export function useGame(game: RicochetGame) {
  return useSyncExternalStore(
    game.subscribe,
    game.getSnapshot,
    game.getServerSnapshot,
  );
}

/** Focuses the puzzle heading whenever the controller opens a different puzzle. */
export function useHeadingFocus(game: RicochetGame) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { focusRequest } = useGame(game);
  const seen = useRef(focusRequest);
  useEffect(() => {
    if (seen.current === focusRequest) return;
    seen.current = focusRequest;
    heading.current?.focus();
  }, [focusRequest]);
  return heading;
}

export function Modes({ game }: { game: RicochetGame }) {
  const { state } = useGame(game);
  return (
    <div className="ricochet-modes" role="group" aria-label="Puzzle type">
      {MODES.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={state.mode === value}
          onClick={() => game.chooseMode(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Heading({
  game,
  headingRef,
  level: Level = 'h2',
}: {
  game: RicochetGame;
  headingRef: RefObject<HTMLHeadingElement | null>;
  level?: 'h2' | 'h3';
}) {
  const { state, prefs } = useGame(game);
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
      <Level ref={headingRef} tabIndex={-1}>
        {mode === 'campaign'
          ? level.title
          : mode === 'shared'
            ? 'Shared puzzle'
            : 'Generated puzzle'}
      </Level>
      <p>{level.hint}</p>
      {mode === 'daily' && prefs.dailySolved === seed && (
        <p className="ricochet-solved-today">
          <Check size={20} aria-hidden="true" />
          Solved today
        </p>
      )}
    </div>
  );
}

export function Controls({
  game,
  share = true,
}: {
  game: RicochetGame;
  share?: boolean;
}) {
  const { state } = useGame(game);
  return (
    <div className="ricochet-controls">
      <button
        type="button"
        className="solid-button"
        onClick={(event) => game.fire(event.detail > 0)}
      >
        <Zap size={22} />
        Fire
      </button>
      <button
        type="button"
        className="ricochet-button"
        onClick={game.undo}
        disabled={!canUndo(state)}
      >
        <Undo2 size={22} />
        Undo
      </button>
      <button
        type="button"
        className="ricochet-button"
        onClick={game.reset}
        disabled={!canReset(state)}
      >
        <RotateCcw size={22} />
        Reset
      </button>
      {share && state.mode !== 'campaign' && (
        <button
          type="button"
          className="ricochet-button"
          onClick={() => {
            void game.copyLink();
          }}
        >
          <Link2 size={22} />
          Copy link
        </button>
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

function Outcome({
  shot,
  mode,
  game,
  exit,
}: Pick<GameState, 'shot' | 'mode'> & {
  game: RicochetGame;
  exit: ReactNode;
}) {
  const { state } = useGame(game);
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
      <button type="button" className="solid-button" onClick={game.newPuzzle}>
        New puzzle
        <Shuffle size={22} />
      </button>
    );
  else if (shot.outcome === 'hit')
    after = solvedAll(state) ? (
      <div className="ricochet-done">
        <p>You’ve learned the rules. Now try a puzzle you haven’t seen.</p>
        <div className="ricochet-done-actions">
          <button
            type="button"
            className="solid-button"
            onClick={() => game.chooseMode('random')}
          >
            Random puzzle
            <Shuffle size={22} />
          </button>
          <button
            type="button"
            className="ricochet-button"
            onClick={() => game.chooseMode('daily')}
          >
            <CalendarDays size={22} />
            Today’s puzzle
          </button>
        </div>
        {exit}
      </div>
    ) : (
      <button type="button" className="solid-button" onClick={game.next}>
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

export function Status({
  game,
  id,
  exit = (
    <a href="/#work">
      Back to the work
      <ArrowUpRight size={18} />
    </a>
  ),
}: {
  game: RicochetGame;
  id?: string;
  exit?: ReactNode;
}) {
  const { state, notice, shareUrl } = useGame(game);
  return (
    <>
      {shareUrl && <ShareFallback url={shareUrl} />}
      <div id={id} role="status" aria-live="polite" aria-atomic="true">
        {notice && <p className="ricochet-notice">{notice}</p>}
        <Outcome shot={state.shot} mode={state.mode} game={game} exit={exit} />
      </div>
    </>
  );
}

export function Pickers({ game }: { game: RicochetGame }) {
  const { state } = useGame(game);
  const solvedCount = levels.filter((l) => state.solved.includes(l.id)).length;
  if (state.mode === 'campaign')
    return (
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
                onClick={() => game.select(i)}
              >
                {i + 1}
                {solved && (
                  <span className="ricochet-solved-badge" aria-hidden="true">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  if (state.mode === 'random')
    return (
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
                onClick={() => game.chooseDifficulty(value)}
              >
                {PRESET_LABELS[value]}
              </button>
            ))}
          <button
            type="button"
            className="ricochet-new"
            onClick={game.newPuzzle}
          >
            <Shuffle size={18} aria-hidden="true" />
            New puzzle
          </button>
        </div>
      </div>
    );
  return null;
}
