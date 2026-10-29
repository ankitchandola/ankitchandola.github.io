import {
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { arcadeLevel, type ArcadeState } from './arcade-state';
import { beamPoints } from '../../play/board-path';
import type { SceneView } from './host';

export interface ArcadeView extends SceneView {
  sync(state: ArcadeState, animate: boolean): void;
  pickMirror(clientX: number, clientY: number): string | null;
}

export function createArcadeScene(
  canvas: HTMLCanvasElement,
  state: ArcadeState,
  invalidate: (shadows?: boolean) => void,
  onFit: (fits: boolean) => void,
): ArcadeView {
  const scene = new Scene();
  const camera = new OrthographicCamera(-5, 5, 4, -4, 0.1, 60);
  camera.position.set(3.2, 10, 7);
  camera.lookAt(0, 0.5, 0);
  const light = new DirectionalLight(0xfff5e5, 3.5);
  light.position.set(-4, 10, 6);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, {
    left: -7,
    right: 7,
    top: 7,
    bottom: -7,
    near: 0.1,
    far: 30,
  });
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
  };
  const box = new RoundedBoxGeometry(1, 1, 1, 2, 0.07);
  const cylinder = new CylinderGeometry(1, 1, 1, 24);
  const ring = new TorusGeometry(0.34, 0.06, 8, 32);
  const plane = new PlaneGeometry(1, 1);
  const block = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material = materials.cream,
  ) => {
    const mesh = new Mesh(box, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const shadowMaterial = new ShadowMaterial({ opacity: 0.18 });
  const ground = new Mesh(plane, shadowMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(10, 9, 1);
  ground.position.y = -0.6;
  ground.receiveShadow = true;
  scene.add(ground);
  block(7.3, 0.45, 6.4, 0, 0.25, 0, materials.teal);
  block(6.4, 0.12, 5.4, 0, 0.54, 0);
  for (const x of [-2.8, 2.8])
    for (const z of [-2.3, 2.3])
      block(0.5, 0.75, 0.5, x, -0.15, z, materials.dark);
  const position = (x: number, y: number, height = 0.76) =>
    new Vector3(x - arcadeLevel.w / 2, height, y - arcadeLevel.h / 2);
  for (const [y, row] of arcadeLevel.rows.entries())
    for (const [x, cell] of [...row].entries()) {
      const p = position(x + 0.5, y + 0.5);
      if (cell === '#') block(0.88, 0.24, 0.88, p.x, 0.72, p.z, materials.dark);
    }
  const mirrors = new Map<string, Mesh>();
  for (const key of Object.keys(state.mirrors)) {
    const [x, y] = key.split(',').map(Number);
    if (x === undefined || y === undefined)
      throw new Error('Invalid Arcade mirror.');
    const p = position(x + 0.5, y + 0.5);
    const base = new Mesh(cylinder, materials.apricot);
    base.scale.set(0.42, 0.08, 0.42);
    base.position.copy(p).setY(0.66);
    scene.add(base);
    mirrors.set(key, block(0.82, 0.22, 0.12, p.x, p.y, p.z, materials.mirror));
  }
  const target = new Mesh(ring, materials.teal);
  target.rotation.x = -Math.PI / 2;
  target.position.copy(
    position(arcadeLevel.target.x + 0.5, arcadeLevel.target.y + 0.5, 0.65),
  );
  scene.add(target);
  const source = new Mesh(cylinder, materials.teal);
  source.scale.set(0.3, 0.08, 0.3);
  source.position.copy(
    position(arcadeLevel.source.x + 0.5, arcadeLevel.source.y + 0.5, 0.65),
  );
  scene.add(source);
  // This introductory lesson points right; the shared model remains the authority for the beam.
  const arrow = block(
    0.25,
    0.06,
    0.07,
    source.position.x,
    0.72,
    source.position.z,
    materials.cream,
  );
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    const head = block(
      0.13,
      0.06,
      0.05,
      arrow.position.x + 0.08,
      0.72,
      arrow.position.z + Math.sign(angle) * 0.04,
      materials.cream,
    );
    head.rotation.y = angle;
  }
  for (const x of [-3.2, 3.2])
    block(0.12, 1.3, 0.12, x, 1.15, -2.9, materials.teal);
  block(6.6, 0.68, 0.18, 0, 1.8, -2.9, materials.teal);
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 128;
  const context = signCanvas.getContext('2d');
  if (!context) throw new Error('Arcade sign canvas is unavailable.');
  context.fillStyle = '#245e58';
  context.fillRect(0, 0, 1024, 128);
  context.fillStyle = '#f5eedb';
  context.font = '700 74px Label, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('RICOCHET', 512, 69);
  const texture = new CanvasTexture(signCanvas);
  texture.colorSpace = SRGBColorSpace;
  const signMaterial = new MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
  });
  const sign = new Mesh(plane, signMaterial);
  sign.scale.set(5.1, 0.63, 1);
  sign.position.set(0, 1.8, -2.79);
  scene.add(sign);
  const beam = new Group();
  scene.add(beam);
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
  let active = false;
  let fits = false;
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
    for (const item of turning) item.mesh.rotation.y = item.to;
    turning = [];
    duration = 0;
    drawBeam(1);
    target.material = hit ? materials.apricot : materials.teal;
    signMaterial.emissiveIntensity = 0;
  };
  const view: ArcadeView = {
    scene,
    camera,
    dynamicShadows: true,
    resize(width, height) {
      const aspect = width / height;
      const half = Math.max(4.1, 5.2 / aspect);
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const a = position(3, 1).project(camera);
      const b = position(4, 1).project(camera);
      const c = position(3, 2).project(camera);
      const u = new Vector2(
        ((b.x - a.x) * width) / 2,
        ((b.y - a.y) * height) / 2,
      );
      const v = new Vector2(
        ((c.x - a.x) * width) / 2,
        ((c.y - a.y) * height) / 2,
      );
      const shortestAltitude =
        Math.abs(u.cross(v)) / Math.max(u.length(), v.length());
      fits = shortestAltitude >= 44 && height >= 260;
      if (!fits) settle();
      onFit(fits);
    },
    shouldRender() {
      return fits;
    },
    update(time) {
      if (!duration) return false;
      const elapsed = time - startTime;
      const turn = Math.min(1, elapsed / 120);
      for (const item of turning)
        item.mesh.rotation.y =
          item.from + (item.to - item.from) * (1 - (1 - turn) ** 3);
      drawBeam(Math.min(1, elapsed / duration));
      if (elapsed >= duration) settle();
      return duration > 0;
    },
    sync(next, animate) {
      settle();
      turning = [...mirrors].map(([key, mesh]) => ({
        mesh,
        from: mesh.rotation.y,
        to: next.mirrors[key] === '/' ? Math.PI / 4 : -Math.PI / 4,
      }));
      beam.clear();
      segments = [];
      totalLength = 0;
      if (next.shot) {
        const points = beamPoints(arcadeLevel, next.shot);
        for (let i = 1; i < points.length; i++) {
          const previous = points[i - 1],
            point = points[i];
          if (!previous || !point) continue;
          const start = position(...previous),
            end = position(...point);
          const direction = end.clone().sub(start).normalize();
          const length = start.distanceTo(end);
          const mesh = new Mesh(cylinder, materials.beam);
          mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
          beam.add(mesh);
          segments.push({ mesh, start, direction, length });
          totalLength += length;
        }
        duration = Math.min(600, points.length * 45);
      } else duration = 120;
      hit = next.shot?.outcome === 'hit';
      startTime = performance.now();
      if (animate && active && fits) {
        drawBeam(0);
        if (hit) {
          signMaterial.emissive.setHex(0x245e58);
          signMaterial.emissiveIntensity = 0.4;
        }
      } else settle();
      invalidate(true);
    },
    pickMirror(clientX, clientY) {
      if (!active || !fits) return null;
      const rect = canvas.getBoundingClientRect();
      const ray = new Raycaster();
      ray.setFromCamera(
        new Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((clientY - rect.top) / rect.height) * 2,
        ),
        camera,
      );
      const p = ray.ray.intersectPlane(
        new Plane(new Vector3(0, 1, 0), -0.76),
        new Vector3(),
      );
      if (!p) return null;
      const key = `${Math.floor(p.x + arcadeLevel.w / 2)},${Math.floor(p.z + arcadeLevel.h / 2)}`;
      return mirrors.has(key) ? key : null;
    },
    settle,
    activate() {
      active = true;
    },
    deactivate() {
      active = false;
      settle();
    },
    dispose() {
      active = false;
      settle();
      box.dispose();
      cylinder.dispose();
      ring.dispose();
      plane.dispose();
      Object.values(materials).forEach((material) => material.dispose());
      texture.dispose();
      shadowMaterial.dispose();
      signMaterial.dispose();
      light.shadow.dispose();
      scene.clear();
    },
  };
  view.sync(state, false);
  return view;
}
