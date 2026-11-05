import { OrthographicCamera, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Level } from '../model.ts';

export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Size {
  width: number;
  height: number;
}

export const SURFACE = 0.76;
export const MIN_TARGET = 44;
export const MIN_HEIGHT = 260;

export function tableCamera(): OrthographicCamera {
  const camera = new OrthographicCamera(-5, 5, 4, -4, 0.1, 60);
  camera.position.set(3.2, 10, 7);
  camera.lookAt(0, 0.5, 0);
  return camera;
}

export const cellPoint = (
  level: Level,
  x: number,
  y: number,
  height = SURFACE,
) => new Vector3(x - level.w / 2, height, y - level.h / 2);

function reach(camera: OrthographicCamera, w: number, h: number) {
  camera.updateMatrixWorld();
  let x = 0,
    y = 0;
  for (const side of [-1, 1])
    for (const z of [-(h / 2 + 0.5), (h + 1.4) / 2])
      for (const height of [-0.55, 2.15]) {
        const p = new Vector3((side * (w + 1.3)) / 2, height, z).applyMatrix4(
          camera.matrixWorldInverse,
        );
        x = Math.max(x, Math.abs(p.x));
        y = Math.max(y, Math.abs(p.y));
      }
  return { x, y };
}

export function frameTable(
  camera: OrthographicCamera,
  level: Level,
  { width, height }: Size,
): void {
  const aspect = width / height;
  // Framing was tuned on the 6×5 first lesson; other boards keep its margins.
  const lesson = reach(camera, 6, 5);
  const board = reach(camera, level.w, level.h);
  const half = Math.max(
    (4.1 * board.y) / lesson.y,
    (5.2 * board.x) / lesson.x / aspect,
  );
  camera.left = -half * aspect;
  camera.right = half * aspect;
  camera.top = half;
  camera.bottom = -half;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

export function toScreen(
  camera: OrthographicCamera,
  point: Vector3,
  { width, height }: Size,
): Vector2 {
  const p = point.clone().project(camera);
  return new Vector2(((p.x + 1) * width) / 2, ((1 - p.y) * height) / 2);
}

/** Shortest altitude of one projected cell, in CSS pixels; every cell matches under an orthographic camera. */
export function cellSpan(
  camera: OrthographicCamera,
  level: Level,
  size: Size,
): number {
  const a = toScreen(camera, cellPoint(level, 0, 0), size);
  const u = toScreen(camera, cellPoint(level, 1, 0), size).sub(a);
  const v = toScreen(camera, cellPoint(level, 0, 1), size).sub(a);
  return Math.abs(u.cross(v)) / Math.max(u.length(), v.length());
}

export const tableFits = (
  camera: OrthographicCamera,
  level: Level,
  size: Size,
): boolean =>
  cellSpan(camera, level, size) >= MIN_TARGET && size.height >= MIN_HEIGHT;

export function mirrorRects(
  camera: OrthographicCamera,
  level: Level,
  size: Size,
): Map<string, CellRect> {
  const rects = new Map<string, CellRect>();
  for (const key of Object.keys(level.mirrors)) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    const corners = [
      cellPoint(level, x, y),
      cellPoint(level, x + 1, y),
      cellPoint(level, x, y + 1),
      cellPoint(level, x + 1, y + 1),
    ].map((point) => toScreen(camera, point, size));
    const xs = corners.map((c) => c.x),
      ys = corners.map((c) => c.y);
    const left = Math.min(...xs),
      top = Math.min(...ys);
    rects.set(key, {
      x: left,
      y: top,
      width: Math.max(...xs) - left,
      height: Math.max(...ys) - top,
    });
  }
  return rects;
}

export function cellAt(
  camera: OrthographicCamera,
  level: Level,
  { width, height }: Size,
  x: number,
  y: number,
): string | null {
  const ray = new Raycaster();
  ray.setFromCamera(
    new Vector2((x / width) * 2 - 1, 1 - (y / height) * 2),
    camera,
  );
  const p = ray.ray.intersectPlane(
    new Plane(new Vector3(0, 1, 0), -SURFACE),
    new Vector3(),
  );
  if (!p) return null;
  const column = Math.floor(p.x + level.w / 2),
    row = Math.floor(p.z + level.h / 2);
  return column >= 0 && row >= 0 && column < level.w && row < level.h
    ? `${column},${row}`
    : null;
}
