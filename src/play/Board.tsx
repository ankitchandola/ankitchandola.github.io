import type { CSSProperties } from 'react';
import { DIRS, type GameState } from './model.ts';
import {
  SOURCE_TIP,
  TARGET_RADIUS,
  beamPoints,
  toPath,
  place,
  pointing,
} from './board-path.ts';
interface BoardStyle extends CSSProperties {
  '--cols'?: number;
  '--rows'?: number;
  '--draw'?: string;
}
export default function Board({
  level,
  mirrors,
  shot,
  shotCount,
  onRotate,
  onFire,
}: Pick<GameState, 'level' | 'mirrors' | 'shot'> & {
  shotCount: number;
  onRotate?: (key: string) => void;
  onFire?: () => void;
}) {
  const cells = level.rows.flatMap((row, y) =>
    [...row].map((c, x) => ({ c, x, y })),
  );
  const points = shot && beamPoints(level, shot);
  const loop =
    shot?.outcome === 'loop' && points ? points.slice(shot.loopStart) : null;
  const mirrorCells = Object.entries(mirrors).map(([key, m]) => {
    const [x, y] = key.split(',').map(Number);
    if (x === undefined || y === undefined)
      throw new Error(`Invalid mirror key ${key}`);
    return { key, m, x, y };
  });
  const drawMs = points ? Math.min(600, points.length * 45) : 0;
  const boardStyle: BoardStyle = { '--cols': level.w, '--rows': level.h };
  const beamStyle: BoardStyle = { '--draw': drawMs + 'ms' };
  const { source, target } = level,
    [dx, dy] = DIRS[source.dir];
  return (
    <div className="ricochet-board" style={boardStyle}>
      <svg
        viewBox={`0 0 ${level.w} ${level.h}`}
        aria-hidden="true"
        focusable="false"
      >
        {cells.map(({ x, y }) => (
          <rect
            key={`g${x}-${y}`}
            className="rc-cell"
            x={x}
            y={y}
            width="1"
            height="1"
          />
        ))}
        {cells
          .filter(({ c }) => c === '#')
          .map(({ x, y }) => (
            <rect
              key={`w${x}-${y}`}
              className="rc-wall"
              x={x + 0.06}
              y={y + 0.06}
              width=".88"
              height=".88"
              rx=".08"
            />
          ))}
        <g
          className={shot?.outcome === 'hit' ? 'rc-target is-hit' : 'rc-target'}
        >
          <circle cx={target.x + 0.5} cy={target.y + 0.5} r={TARGET_RADIUS} />
          <circle cx={target.x + 0.5} cy={target.y + 0.5} r=".14" />
        </g>
        <g className="rc-source">
          <circle cx={source.x + 0.5} cy={source.y + 0.5} r=".3" />
          <path
            d={`M${source.x + 0.5 + dx * SOURCE_TIP} ${source.y + 0.5 + dy * SOURCE_TIP} L${source.x + 0.5 - dx * 0.1 + dy * 0.13} ${source.y + 0.5 - dy * 0.1 + dx * 0.13} L${source.x + 0.5 - dx * 0.1 - dy * 0.13} ${source.y + 0.5 - dy * 0.1 - dx * 0.13}Z`}
          />
        </g>
        {mirrorCells.map(({ key, m, x, y }) => {
          return (
            <g key={key} data-mirror-key={key}>
              <circle
                className="rc-mirror-ring"
                cx={x + 0.5}
                cy={y + 0.5}
                r=".4"
              />
              <line
                className={m === '/' ? 'rc-mirror' : 'rc-mirror is-back'}
                x1={x + 0.2}
                y1={y + 0.8}
                x2={x + 0.8}
                y2={y + 0.2}
              />
            </g>
          );
        })}
        {points && (
          <path
            key={'beam' + shotCount}
            className="rc-beam"
            d={toPath(points)}
            pathLength="1"
            style={beamStyle}
          />
        )}
        {loop && (
          <path
            key={'loop' + shotCount}
            className="rc-loop"
            d={toPath(loop)}
            style={beamStyle}
          />
        )}
      </svg>
      <div className="ricochet-cells">
        <button
          type="button"
          className="ricochet-source"
          data-board-fire
          style={{ gridColumn: source.x + 1, gridRow: source.y + 1 }}
          onClick={onFire}
          aria-label={`Fire the beam from ${place(source.x, source.y)}, pointing ${pointing[source.dir]}`}
        />
        {mirrorCells.map(({ key, m, x, y }) => {
          return (
            <button
              key={key}
              type="button"
              className="ricochet-mirror"
              data-board-mirror={key}
              style={{ gridColumn: x + 1, gridRow: y + 1 }}
              onClick={() => onRotate?.(key)}
              aria-label={`Mirror, ${place(x, y)}, slanted ${m === '/' ? 'forward' : 'backward'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
