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

const MARGIN = 1.1;

/** View-space bounds of the table, its legs and the sign arch behind it. */
function bounds(camera: OrthographicCamera, level: Level) {
  camera.updateMatrixWorld();
  const box = {
    left: Infinity,
    right: -Infinity,
    bottom: Infinity,
    top: -Infinity,
  };
  for (const side of [-1, 1])
    for (const z of [-(level.h / 2 + 0.5), (level.h + 1.4) / 2])
      for (const height of [-0.55, 2.15]) {
        const p = new Vector3(
          (side * (level.w + 1.3)) / 2,
          height,
          z,
        ).applyMatrix4(camera.matrixWorldInverse);
        box.left = Math.min(box.left, p.x);
        box.right = Math.max(box.right, p.x);
        box.bottom = Math.min(box.bottom, p.y);
        box.top = Math.max(box.top, p.y);
      }
  return box;
}

export function frameTable(
  camera: OrthographicCamera,
  level: Level,
  { width, height }: Size,
): void {
  const aspect = width / height;
  const box = bounds(camera, level);
  const half = Math.max(
    ((box.top - box.bottom) / 2) * MARGIN,
    ((box.right - box.left) / 2 / aspect) * MARGIN,
  );
  const x = (box.left + box.right) / 2,
    y = (box.top + box.bottom) / 2;
  camera.left = x - half * aspect;
  camera.right = x + half * aspect;
  camera.top = y + half;
  camera.bottom = y - half;
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

export function cellRect(
  camera: OrthographicCamera,
  level: Level,
  size: Size,
  x: number,
  y: number,
): CellRect {
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
  return {
    x: left,
    y: top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  };
}

export function mirrorRects(
  camera: OrthographicCamera,
  level: Level,
  size: Size,
): Map<string, CellRect> {
  const rects = new Map<string, CellRect>();
  for (const key of Object.keys(level.mirrors)) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    rects.set(key, cellRect(camera, level, size, x, y));
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
