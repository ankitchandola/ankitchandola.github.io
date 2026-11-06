import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';
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

function CellTarget({
  rect,
  ...props
}: { rect: TableLayout['source'] } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const corners = rect.quad.map(({ x, y }) => [x - rect.x, y - rect.y]);
  const points = corners
    .map(
      ([x = 0, y = 0]) =>
        `${rect.width / 2 + (x - rect.width / 2) * 0.9},${rect.height / 2 + (y - rect.height / 2) * 0.9}`,
    )
    .join(' ');
  return (
    <button
      {...props}
      style={{
        ...box(rect),
        clipPath: `polygon(${corners.map(([x = 0, y = 0]) => `${x}px ${y}px`).join(', ')})`,
      }}
    >
      <svg viewBox={`0 0 ${rect.width} ${rect.height}`} aria-hidden="true">
        <polygon points={points} vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}

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
  const request = useRef(0);
  const mounted = useRef(false);
  const focusedKey = useRef<string | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [layout, setLayout] = useState<TableLayout | null>(null);
  const [attempt, setAttempt] = useState(0);
  const wants3d = prefs.presentation !== 'flat';
  const room = size !== null && mayFitTable(size.width, size.height);
  const show3d = wants3d && room && status === 'ready' && !!layout?.fits;
  const highlightFocus = () => {
    const focused = document.activeElement;
    surface.current?.highlight(
      focused instanceof HTMLElement && wrapper.current?.contains(focused)
        ? (focused.dataset.tableMirror ??
            (focused.hasAttribute('data-table-fire') ? 'source' : null))
        : null,
    );
  };

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
    mounted.current = true;
    return () => {
      mounted.current = false;
      surface.current?.dispose();
      surface.current = null;
    };
  }, []);

  useEffect(() => {
    if (!wants3d || !room || !active || surface.current) return;
    const generation = ++request.current;
    let pending = true;
    setStatus('loading');
    import('./three/surface.ts')
      .then(({ createTableSurface }) => {
        const element = canvas.current;
        if (!mounted.current || generation !== request.current || !element)
          return;
        pending = false;
        const { state: now } = game.getSnapshot();
        const created = createTableSurface(
          element,
          now.level,
          now.mirrors,
          () => {
            console.warn(
              'Ricochet 3D context lost. The flat board remains playable.',
            );
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
        if (!mounted.current || generation !== request.current) return;
        pending = false;
        console.warn(
          'Ricochet 3D table unavailable. Using the flat board.',
          error,
        );
        setStatus('error');
      });
    return () => {
      request.current = generation + 1;
      if (pending && mounted.current) setStatus('idle');
    };
  }, [wants3d, room, active, attempt, game]);

  useEffect(() => {
    if (status === 'ready' && size)
      setLayout(surface.current?.resize(size.width, size.height) ?? null);
  }, [status, size]);

  useEffect(() => {
    const current = surface.current;
    if (!current || status !== 'ready') return;
    const last = shown.current;
    if (last.level !== level)
      setLayout(
        current.setLevel(level, mirrors, shot, animate && motionAllowed()),
      );
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
    if (!active || !key || !root || root.contains(document.activeElement))
      return;
    root
      .querySelector<HTMLButtonElement>(
        key === 'source'
          ? `[data-${show3d ? 'table' : 'board'}-fire]`
          : `[data-${show3d ? 'table' : 'board'}-mirror="${key}"]`,
      )
      ?.focus({ preventScroll: true });
  }, [show3d, active]);

  // A lost or failed context cannot be reused, so retry draws on a fresh canvas.
  const retry = () => {
    focusedKey.current = null;
    wrapper.current?.focus({ preventScroll: true });
    setAttempt((n) => n + 1);
    setStatus('idle');
  };
  const note =
    wants3d && room && status === 'loading'
      ? 'Opening the 3D table. The flat board is ready to play.'
      : wants3d && room && (status === 'error' || status === 'unavailable')
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
      data-instant={String(!animate)}
      tabIndex={-1}
      aria-label="Ricochet board"
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement;
        focusedKey.current =
          target.dataset.tableMirror ??
          target.dataset.boardMirror ??
          (target.hasAttribute('data-table-fire') ||
          target.hasAttribute('data-board-fire')
            ? 'source'
            : null);
        surface.current?.highlight(focusedKey.current);
      }}
      onBlurCapture={() => surface.current?.highlight(null)}
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
      <div className="ricochet-surface">
        <div
          className="ricochet-table"
          style={tableStyle}
          hidden={!show3d}
          onClickCapture={(event) => {
            if (event.detail === 0 || !canvas.current) return;
            const bounds = canvas.current.getBoundingClientRect();
            const key = surface.current?.pickMirror(
              event.clientX - bounds.x,
              event.clientY - bounds.y,
            );
            if (!key) return;
            event.stopPropagation();
            wrapper.current
              ?.querySelector<HTMLButtonElement>(`[data-table-mirror="${key}"]`)
              ?.focus({ preventScroll: true });
            game.rotate(key, true);
          }}
        >
          <canvas key={attempt} ref={canvas} aria-hidden="true" />
          {show3d && layout && (
            <div className="ricochet-table-targets">
              <CellTarget
                type="button"
                className="ricochet-table-source"
                data-table-fire
                rect={layout.source}
                onPointerEnter={() => surface.current?.highlight('source')}
                onPointerLeave={highlightFocus}
                onClick={(event) => game.fire(event.detail > 0)}
                aria-label={`Fire the beam from ${place(level.source.x, level.source.y)}, pointing ${pointing[level.source.dir]}`}
              />
              {[...layout.mirrors].map(([key, rect]) => {
                const [x = 0, y = 0] = key.split(',').map(Number);
                return (
                  <CellTarget
                    key={key}
                    type="button"
                    className="ricochet-table-mirror"
                    data-table-mirror={key}
                    rect={rect}
                    onPointerEnter={() => surface.current?.highlight(key)}
                    onPointerLeave={highlightFocus}
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
            onRotate={(key, animate) => game.rotate(key, animate)}
            onFire={(animate) => game.fire(animate)}
          />
        )}
      </div>
      {note && (
        <p className="ricochet-table-note" role="status">
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
