import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Board from './Board';
import { place, pointing } from './board-path';
import type { RicochetGame } from './game.ts';
import { useGame } from './GameParts';
import { mayFitTable } from './table-fit.ts';
import type { TableLayout, TableSurface } from './three/surface.ts';

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'unavailable';
interface Size {
  width: number;
  height: number;
}

const motionAllowed = () =>
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !document.body.classList.contains('motion-paused');
const box = ({
  x,
  y,
  width,
  height,
}: TableLayout['source']): CSSProperties => ({
  left: x,
  top: y,
  width,
  height,
});

/**
 * Shows the puzzle as the 3D table when there is room and WebGL, otherwise the
 * flat board. `fill` sizes the table to its container (the city); without it
 * the table takes a landscape share of the column (the full page).
 */
export default function BoardView({
  game,
  active = true,
  fill = false,
}: {
  game: RicochetGame;
  active?: boolean;
  fill?: boolean;
}) {
  const { state, prefs, shotCount, animate } = useGame(game);
  const { level, mirrors, shot } = state;
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const surface = useRef<TableSurface | null>(null);
  const shown = useRef<Pick<typeof state, 'level' | 'mirrors' | 'shot'>>(state);
  const loading = useRef(false);
  const mounted = useRef(false);
  const focusedKey = useRef<string | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [layout, setLayout] = useState<TableLayout | null>(null);
  const [attempt, setAttempt] = useState(0);
  const wants3d = prefs.presentation !== 'flat';
  const room = size !== null && mayFitTable(size.width, size.height);
  const show3d = wants3d && room && status === 'ready' && !!layout?.fits;

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth;
      const height = fill
        ? element.clientHeight
        : Math.round(Math.min(width * 0.82, window.innerHeight * 0.75));
      setSize((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [fill]);

  useEffect(() => {
    if (!wants3d || !room || !active || status !== 'idle') return;
    if (loading.current || surface.current) return;
    loading.current = true;
    setStatus('loading');
    import('./three/surface.ts')
      .then(({ createTableSurface }) => {
        const element = canvas.current;
        if (!mounted.current || !element) return;
        const { state: now } = game.getSnapshot();
        const created = createTableSurface(
          element,
          now.level,
          now.mirrors,
          () => {
            surface.current?.dispose();
            surface.current = null;
            setLayout(null);
            setStatus('error');
          },
        );
        if (!created) {
          setStatus('unavailable');
          return;
        }
        surface.current = created;
        if (now.shot) created.sync(now.mirrors, now.shot, false);
        shown.current = now;
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!mounted.current) return;
        console.warn(
          'Ricochet 3D table unavailable. Using the flat board.',
          error,
        );
        setStatus('error');
      })
      .finally(() => {
        loading.current = false;
      });
  }, [wants3d, room, active, status, game]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      surface.current?.dispose();
      surface.current = null;
    };
  }, []);

  useEffect(() => {
    if (status === 'ready' && size)
      setLayout(surface.current?.resize(size.width, size.height) ?? null);
  }, [status, size]);

  useEffect(() => {
    const current = surface.current;
    if (!current || status !== 'ready') return;
    const last = shown.current;
    if (last.level !== level) setLayout(current.setLevel(level, mirrors, shot));
    else if (last.mirrors !== mirrors || last.shot !== shot)
      current.sync(mirrors, shot, animate && motionAllowed());
    shown.current = { level, mirrors, shot };
  }, [level, mirrors, shot, animate, status]);

  useEffect(() => {
    surface.current?.setActive(active && show3d);
  }, [active, show3d, status]);

  useLayoutEffect(() => {
    const key = focusedKey.current;
    const root = wrapper.current;
    if (!key || !root || root.contains(document.activeElement)) return;
    root
      .querySelector<HTMLButtonElement>(
        `[data-${show3d ? 'table' : 'board'}-mirror="${key}"]`,
      )
      ?.focus({ preventScroll: true });
  }, [show3d]);

  // A lost or failed context cannot be reused, so retry draws on a fresh canvas.
  const retry = () => {
    setAttempt((n) => n + 1);
    setStatus('idle');
  };
  const note =
    wants3d && room && (status === 'error' || status === 'unavailable')
      ? status === 'error'
        ? 'The 3D table could not open. The flat board works the same.'
        : '3D is unavailable here. The flat board works the same.'
      : wants3d && status === 'ready' && layout && !layout.fits
        ? 'Not enough room for the 3D table. Showing the flat board.'
        : '';
  const tableStyle: CSSProperties | undefined =
    size && !fill ? { height: size.height } : undefined;

  return (
    <div
      ref={wrapper}
      className={fill ? 'ricochet-view is-fill' : 'ricochet-view'}
      data-presentation={show3d ? '3d' : 'flat'}
      data-table-status={status}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement;
        focusedKey.current =
          target.dataset.tableMirror ?? target.dataset.boardMirror ?? null;
      }}
    >
      {room && (
        <div
          className="ricochet-presentation"
          role="group"
          aria-label="Board view"
        >
          <button
            type="button"
            aria-pressed={wants3d}
            onClick={() => game.remember({ presentation: '3d' })}
          >
            3D table
          </button>
          <button
            type="button"
            aria-pressed={!wants3d}
            onClick={() => game.remember({ presentation: 'flat' })}
          >
            Flat board
          </button>
        </div>
      )}
      <div className="ricochet-table" style={tableStyle} hidden={!show3d}>
        <canvas key={attempt} ref={canvas} aria-hidden="true" />
        {show3d && layout && (
          <div className="ricochet-table-targets">
            <button
              type="button"
              className="ricochet-table-source"
              data-table-fire
              style={box(layout.source)}
              onClick={(event) => game.fire(event.detail > 0)}
              aria-label={`Fire the beam from ${place(level.source.x, level.source.y)}, pointing ${pointing[level.source.dir]}`}
            />
            {[...layout.mirrors].map(([key, rect]) => {
              const [x = 0, y = 0] = key.split(',').map(Number);
              return (
                <button
                  key={key}
                  type="button"
                  className="ricochet-table-mirror"
                  data-table-mirror={key}
                  style={box(rect)}
                  onClick={(event) => game.rotate(key, event.detail > 0)}
                  aria-label={`Mirror, ${place(x, y)}, slanted ${mirrors[key] === '/' ? 'forward' : 'backward'}`}
                />
              );
            })}
          </div>
        )}
      </div>
      {!show3d && (
        <Board
          level={level}
          mirrors={mirrors}
          shot={shot}
          shotCount={shotCount}
          onRotate={(key) => game.rotate(key)}
          onFire={() => game.fire()}
        />
      )}
      {note && (
        <p className="ricochet-table-note">
          {note}
          {status === 'error' && (
            <button type="button" className="ricochet-button" onClick={retry}>
              Retry 3D
            </button>
          )}
        </p>
      )}
    </div>
  );
}
