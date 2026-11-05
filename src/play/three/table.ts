import {
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Line,
  LineDashedMaterial,
  BufferGeometry,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  type OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { beamPoints } from '../board-path.ts';
import type { Direction, Level, Mirrors, Shot } from '../model.ts';
import {
  cellAt,
  cellPoint,
  frameTable,
  mirrorRects,
  tableCamera,
  tableFits,
  type CellRect,
  type Size,
} from './projection.ts';

export type { CellRect };

export interface RicochetTable {
  scene: Scene;
  camera: OrthographicCamera;
  readonly level: Level;
  /** Frames the camera for a canvas size and reports whether every cell is a usable touch target. */
  resize(width: number, height: number): boolean;
  setLevel(level: Level, mirrors: Mirrors, animate?: boolean): void;
  sync(mirrors: Mirrors, shot: Shot | null, animate: boolean): void;
  update(time: number): boolean;
  settle(): void;
  pickMirror(x: number, y: number): string | null;
  mirrorRects(): Map<string, CellRect>;
  setColors(colors: TableColors): void;
  dispose(): void;
}

export interface TableColors {
  surface: string;
  wall: string;
  mirror: string;
  beam: string;
  sourceMark: string;
  target: string;
  targetRing: string;
}

const FACING: Record<Direction, number> = {
  E: 0,
  N: Math.PI / 2,
  W: Math.PI,
  S: -Math.PI / 2,
};

export function createRicochetTable(
  initial: Level,
  mirrorsNow: Mirrors,
): RicochetTable {
  const scene = new Scene();
  const camera = tableCamera();
  const light = new DirectionalLight(0xfff5e5, 3.5);
  light.position.set(-4, 10, 6);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.001;
  light.shadow.normalBias = 0.03;
  light.shadow.blurSamples = 4;
  light.shadow.radius = 4;
  scene.add(light, new HemisphereLight(0xfffaf0, 0x526d64, 2.2));
  const materials = {
    cream: new MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.8 }),
    teal: new MeshStandardMaterial({ color: 0x245e58, roughness: 0.72 }),
    dark: new MeshStandardMaterial({ color: 0x172f31, roughness: 0.8 }),
    apricot: new MeshStandardMaterial({ color: 0xf4c7a4, roughness: 0.7 }),
    mirror: new MeshStandardMaterial({
      color: 0x245e58,
      metalness: 0.5,
      roughness: 0.25,
    }),
    beam: new MeshStandardMaterial({
      color: 0xb94d1f,
      emissive: 0x702d0c,
      emissiveIntensity: 0.6,
    }),
    sourceMark: new MeshStandardMaterial({ color: 0xf5eedb }),
    targetRing: new MeshStandardMaterial({ color: 0x86532b }),
  };
  const loopMaterial = new LineDashedMaterial({
    color: 0xf5eedb,
    dashSize: 0.12,
    gapSize: 0.1,
    depthTest: false,
  });
  let loop: Line<BufferGeometry, LineDashedMaterial> | null = null;
  const box = new RoundedBoxGeometry(1, 1, 1, 2, 0.07);
  const cylinder = new CylinderGeometry(1, 1, 1, 24);
  const ring = new TorusGeometry(0.34, 0.06, 8, 32);
  const plane = new PlaneGeometry(1, 1);
  const shadowMaterial = new ShadowMaterial({ opacity: 0.18 });
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 128;
  const context = signCanvas.getContext('2d');
  if (!context) throw new Error('Ricochet sign canvas is unavailable.');
  const paintSign = (background: string, ink: string) => {
    context.fillStyle = background;
    context.fillRect(0, 0, 1024, 128);
    context.fillStyle = ink;
    context.font = '700 74px Label, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('RICOCHET', 512, 69);
  };
  paintSign('#245e58', '#f5eedb');
  const texture = new CanvasTexture(signCanvas);
  texture.colorSpace = SRGBColorSpace;
  const signMaterial = new MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
  });

  let level = initial;
  let board = new Group();
  const mirrors = new Map<string, Mesh>();
  let pieces: (Mesh | Group)[] = [];
  let target = new Mesh(ring, materials.targetRing);
  const beam = new Group();
  scene.add(board, beam);
  const cell = (x: number, y: number, height?: number) =>
    cellPoint(level, x, y, height);
  const block = (
    parent: Group,
    size: [number, number, number],
    at: [number, number, number],
    material = materials.cream,
  ) => {
    const mesh = new Mesh(box, material);
    mesh.scale.set(...size);
    mesh.position.set(...at);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const build = () => {
    scene.remove(board);
    board = new Group();
    mirrors.clear();
    pieces = [];
    const { w, h } = level;
    const ground = new Mesh(plane, shadowMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.scale.set(w + 4, h + 4, 1);
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    board.add(ground);
    block(board, [w + 1.3, 0.45, h + 1.4], [0, 0.25, 0], materials.teal);
    block(board, [w + 0.4, 0.12, h + 0.4], [0, 0.54, 0]);
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        block(
          board,
          [0.5, 0.75, 0.5],
          [x * (w / 2 - 0.2), -0.15, z * (h / 2 - 0.2)],
          materials.dark,
        );
    for (const [y, row] of level.rows.entries())
      for (const [x, char] of [...row].entries())
        if (char === '#') {
          const p = cell(x + 0.5, y + 0.5);
          pieces.push(
            block(board, [0.88, 0.24, 0.88], [p.x, 0.72, p.z], materials.dark),
          );
        }
    for (const key of Object.keys(level.mirrors)) {
      const [x, y] = key.split(',').map(Number);
      if (x === undefined || y === undefined)
        throw new Error('Invalid Ricochet mirror.');
      const p = cell(x + 0.5, y + 0.5);
      const base = new Mesh(cylinder, materials.apricot);
      base.scale.set(0.42, 0.08, 0.42);
      base.position.copy(p).setY(0.66);
      board.add(base);
      const mirror = block(
        board,
        [0.82, 0.22, 0.12],
        [p.x, p.y, p.z],
        materials.mirror,
      );
      mirrors.set(key, mirror);
      pieces.push(base, mirror);
    }
    target = new Mesh(ring, materials.targetRing);
    target.rotation.x = -Math.PI / 2;
    target.position.copy(
      cell(level.target.x + 0.5, level.target.y + 0.5, 0.65),
    );
    board.add(target);
    pieces.push(target);
    const source = new Mesh(cylinder, materials.teal);
    source.scale.set(0.3, 0.08, 0.3);
    source.position.copy(
      cell(level.source.x + 0.5, level.source.y + 0.5, 0.65),
    );
    board.add(source);
    pieces.push(source);
    const arrow = new Group();
    arrow.position.copy(source.position).setY(0.72);
    arrow.rotation.y = FACING[level.source.dir];
    block(arrow, [0.25, 0.06, 0.07], [0, 0, 0], materials.sourceMark);
    for (const side of [-1, 1])
      block(
        arrow,
        [0.13, 0.06, 0.05],
        [0.08, 0, side * 0.04],
        materials.sourceMark,
      ).rotation.y = (side * Math.PI) / 4;
    board.add(arrow);
    pieces.push(arrow);
    const back = -(h / 2 + 0.4);
    for (const x of [-1, 1])
      block(
        board,
        [0.12, 1.3, 0.12],
        [x * (w / 2 + 0.2), 1.15, back],
        materials.teal,
      );
    block(board, [w + 0.6, 0.68, 0.18], [0, 1.8, back], materials.teal);
    const sign = new Mesh(plane, signMaterial);
    sign.scale.set(Math.min(5.1, w - 0.9), 0.63, 1);
    sign.position.set(0, 1.8, back + 0.11);
    board.add(sign);
    const reach = Math.max(w + 1.3, h + 1.4) / 2 + 1;
    Object.assign(light.shadow.camera, {
      left: -reach,
      right: reach,
      top: reach,
      bottom: -reach,
      near: 0.1,
      far: 30,
    });
    light.shadow.camera.updateProjectionMatrix();
    scene.add(board);
  };

  let segments: {
    mesh: Mesh;
    start: Vector3;
    direction: Vector3;
    length: number;
  }[] = [];
  let totalLength = 0;
  let startTime = 0;
  let duration = 0;
  let turning: { mesh: Mesh; from: number; to: number }[] = [];
  let hit = false;
  let entering: { mesh: Mesh | Group; y: number; delay: number }[] = [];
  let enterStart = 0;
  let size: Size = { width: 0, height: 0 };
  const clearBeam = () => {
    loop?.geometry.dispose();
    loop = null;
    beam.clear();
    segments = [];
    totalLength = 0;
  };
  const drawBeam = (progress: number) => {
    let remaining = totalLength * progress;
    for (const segment of segments) {
      const length = Math.max(0, Math.min(segment.length, remaining));
      segment.mesh.visible = length > 0;
      segment.mesh.scale.set(0.035, length, 0.035);
      segment.mesh.position
        .copy(segment.start)
        .addScaledVector(segment.direction, length / 2);
      remaining -= segment.length;
    }
  };
  const settle = () => {
    for (const item of entering) item.mesh.position.y = item.y;
    entering = [];
    for (const item of turning) item.mesh.rotation.y = item.to;
    turning = [];
    duration = 0;
    drawBeam(1);
    target.material = hit ? materials.beam : materials.targetRing;
    if (loop) loop.visible = true;
    signMaterial.emissiveIntensity = 0;
  };
  const table: RicochetTable = {
    scene,
    camera,
    get level() {
      return level;
    },
    resize(width, height) {
      size = { width, height };
      frameTable(camera, level, size);
      const fits = tableFits(camera, level, size);
      if (!fits) settle();
      return fits;
    },
    setLevel(next, mirrorsNext, animate = false) {
      settle();
      level = next;
      hit = false;
      clearBeam();
      build();
      if (size.width) frameTable(camera, level, size);
      table.sync(mirrorsNext, null, false);
      if (animate) {
        enterStart = performance.now();
        entering = pieces.map((mesh, index) => ({
          mesh,
          y: mesh.position.y,
          delay: Math.min(index, 5) * 30,
        }));
        for (const item of entering) item.mesh.position.y += 0.2;
      }
    },
    sync(next, shot, animate) {
      settle();
      turning = [...mirrors].map(([key, mesh]) => ({
        mesh,
        from: mesh.rotation.y,
        to: next[key] === '/' ? Math.PI / 4 : -Math.PI / 4,
      }));
      clearBeam();
      if (shot) {
        const points = beamPoints(level, shot);
        for (let i = 1; i < points.length; i++) {
          const previous = points[i - 1],
            point = points[i];
          if (!previous || !point) continue;
          const start = cell(...previous),
            end = cell(...point);
          const direction = end.clone().sub(start).normalize();
          const length = start.distanceTo(end);
          const mesh = new Mesh(cylinder, materials.beam);
          mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
          beam.add(mesh);
          segments.push({ mesh, start, direction, length });
          totalLength += length;
        }
        duration = Math.min(600, points.length * 45);
        if (shot.outcome === 'loop' && shot.loopStart !== null) {
          const cycle = points
            .slice(shot.loopStart)
            .map(([x, y]) => cell(x, y, 0.8));
          loop = new Line(
            new BufferGeometry().setFromPoints(cycle),
            loopMaterial,
          );
          loop.computeLineDistances();
          loop.renderOrder = 1;
          loop.visible = false;
          beam.add(loop);
        }
      } else duration = 120;
      hit = shot?.outcome === 'hit';
      startTime = performance.now();
      if (animate) {
        drawBeam(0);
        if (hit) {
          signMaterial.emissive.setHex(0x245e58);
          signMaterial.emissiveIntensity = 0.4;
        }
      } else settle();
    },
    update(time) {
      for (const item of entering) {
        const progress = Math.min(
          1,
          Math.max(0, (time - enterStart - item.delay) / 180),
        );
        item.mesh.position.y = item.y + 0.2 * (1 - progress) ** 3;
      }
      if (time - enterStart >= 330) entering = [];
      if (!duration) return entering.length > 0;
      const elapsed = time - startTime;
      const turn = Math.min(1, elapsed / 120);
      for (const item of turning)
        item.mesh.rotation.y =
          item.from + (item.to - item.from) * (1 - (1 - turn) ** 3);
      drawBeam(Math.min(1, elapsed / duration));
      if (elapsed >= duration) settle();
      return duration > 0 || entering.length > 0;
    },
    settle,
    pickMirror(x, y) {
      if (!size.width) return null;
      const key = cellAt(camera, level, size, x, y);
      return key && mirrors.has(key) ? key : null;
    },
    mirrorRects: () => mirrorRects(camera, level, size),
    setColors(colors) {
      materials.cream.color.set(colors.surface);
      materials.teal.color.set(colors.beam);
      materials.dark.color.set(colors.wall);
      materials.apricot.color.set(colors.target);
      materials.mirror.color.set(colors.mirror);
      materials.beam.color.set(colors.beam);
      materials.beam.emissive.set(colors.beam);
      materials.sourceMark.color.set(colors.sourceMark);
      materials.targetRing.color.set(colors.targetRing);
      loopMaterial.color.set(colors.surface);
      paintSign(colors.beam, colors.surface);
      texture.needsUpdate = true;
    },
    dispose() {
      settle();
      clearBeam();
      box.dispose();
      cylinder.dispose();
      ring.dispose();
      plane.dispose();
      Object.values(materials).forEach((material) => material.dispose());
      texture.dispose();
      shadowMaterial.dispose();
      signMaterial.dispose();
      loopMaterial.dispose();
      light.shadow.dispose();
      scene.clear();
    },
  };
  build();
  table.sync(mirrorsNow, null, false);
  return table;
}
