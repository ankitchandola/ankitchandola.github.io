import { DIRS, type Level, type Position, type Shot } from './model.ts';

export const SOURCE_TIP = 0.2;
export const TARGET_RADIUS = 0.34;
export type Point = readonly [x: number, y: number];
export const pointing = { N: 'up', E: 'right', S: 'down', W: 'left' };
export const place = (x: number, y: number) => `row ${y + 1}, column ${x + 1}`;

export function describe(level: Level): string {
  const { w, h, rows } = level;
  const cells = rows.flatMap((row, y) => [...row].map((c, x) => ({ c, x, y })));
  const edge = ({ x, y }: Position) =>
    x === 0 || y === 0 || x === w - 1 || y === h - 1;
  const walled = cells.filter(edge).every(({ c }) => c === '#');
  const walls = cells
    .filter((cell) => cell.c === '#' && !(walled && edge(cell)))
    .map((c) => place(c.x, c.y));
  const mirrors = Object.keys(level.mirrors).length;
  return `${w} columns by ${h} rows${walled ? ', surrounded by a wall' : ''}. The beam starts at ${place(level.source.x, level.source.y)}, pointing ${pointing[level.source.dir]}. The target is at ${place(level.target.x, level.target.y)}. ${mirrors} ${mirrors === 1 ? 'mirror' : 'mirrors'}. ${walls.length ? `Walls at ${walls.join('; ')}.` : walled ? 'No other walls.' : 'No walls.'}`;
}

// Paths stop at the arrow tip, target ring or blocking cell edge in both presentations.
export function beamPoints(level: Level, shot: Shot): Point[] {
  const centre = ({ x, y }: Position): Point => [x + 0.5, y + 0.5];
  const [dx, dy] = DIRS[level.source.dir];
  const tip: Point = [
    level.source.x + 0.5 + dx * SOURCE_TIP,
    level.source.y + 0.5 + dy * SOURCE_TIP,
  ];
  const points = [tip, ...shot.path.map(centre)];
  const { x, y, dir } = shot.end;
  const backFromCentre = (distance: number): Point => [
    x + 0.5 - DIRS[dir][0] * distance,
    y + 0.5 - DIRS[dir][1] * distance,
  ];
  if (shot.outcome === 'hit')
    points[points.length - 1] = backFromCentre(TARGET_RADIUS);
  if (shot.outcome === 'blocked')
    points[points.length - 1] = backFromCentre(0.5);
  if (shot.outcome === 'escaped') points.push(backFromCentre(0.5));
  if (shot.outcome === 'loop') points.push(centre(shot.end));
  return points;
}

export const toPath = (points: readonly Point[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
