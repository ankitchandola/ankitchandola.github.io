import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Raycaster,
  RingGeometry,
  Scene,
  ShadowMaterial,
  Spherical,
  Vector2,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCity } from './city-model';
import type { CityDestinationId } from '../content/city';
import { createSceneHost, type SceneView } from './city-scenes/host';

export interface CityPose {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface CityLabel {
  id: CityDestinationId;
  x: number;
  y: number;
}

const destinationPoses: Record<
  CityDestinationId,
  { theta: number; phi: number; zoom: number }
> = {
  studio: { theta: 0.25, phi: 0.85, zoom: 1.55 },
  journey: { theta: 0.4, phi: 0.9, zoom: 1.35 },
  arcade: { theta: 0.55, phi: 0.7, zoom: 1.7 },
  contact: { theta: 0.1, phi: 0.7, zoom: 1.7 },
};

export function createCityView(
  canvas: HTMLCanvasElement,
  onZoom: (zoom: number) => void,
  onLabel: (label: CityLabel | null) => void,
) {
  const host = createSceneHost(canvas);
  if (!host) return null;
  const scene = new Scene();
  const city = createCity();
  scene.add(city.group);
  const camera = new OrthographicCamera(-8.7, 8.7, 7.25, -7.25, 0.1, 80);
  camera.position.set(12, 15, 17);
  camera.lookAt(0, 1, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI / 2.8;
  controls.minZoom = 1;
  controls.maxZoom = 2.2;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.7;
  controls.enabled = false;
  controls.update();
  canvas.style.touchAction = 'auto';
  scene.add(new HemisphereLight('#fffaf0', '#a6ad9c', 2.6));
  const sun = new DirectionalLight('#fff1dc', 2.6);
  sun.position.set(-7, 14, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -9,
    right: 9,
    top: 9,
    bottom: -9,
    near: 1,
    far: 40,
  });
  sun.shadow.radius = 5;
  sun.shadow.blurSamples = 8;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const fill = new DirectionalLight('#d2e5dd', 0.8);
  fill.position.set(8, 6, -5);
  scene.add(fill);
  const ground = new Mesh(
    new PlaneGeometry(25, 25),
    new ShadowMaterial({ opacity: 0.16 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.47;
  ground.receiveShadow = true;
  scene.add(ground);
  const footprintGeometry = new RingGeometry(1, 1.08, 4);
  footprintGeometry.rotateZ(Math.PI / 4);
  footprintGeometry.rotateX(-Math.PI / 2);
  const selection = new Mesh(
    footprintGeometry,
    new MeshBasicMaterial({ color: '#245e58' }),
  );
  const hover = new Mesh(
    footprintGeometry,
    new MeshBasicMaterial({ color: '#e6ad85' }),
  );
  selection.visible = hover.visible = false;
  scene.add(selection, hover);
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const hit = new Vector3();
  const projected = new Vector3();
  const size = new Vector3();
  const center = new Vector3();
  const cameraDirection = new Vector3();
  let selected: CityDestinationId | null = null;
  let hovered: CityDestinationId | null = null;
  const mark = (mesh: Mesh, id: CityDestinationId | null) => {
    const landmark = city.landmarks.find((place) => place.id === id);
    mesh.visible = expanded && Boolean(landmark);
    if (!landmark) return;
    landmark.bounds.getCenter(center);
    landmark.bounds.getSize(size);
    mesh.position.set(center.x, 0.19, center.z);
    mesh.scale.set(size.x / Math.SQRT2 + 0.12, 1, size.z / Math.SQRT2 + 0.12);
  };
  const updateLabel = () => {
    const landmark = city.landmarks.find(
      ({ id }) => id === (hovered ?? selected),
    );
    if (!expanded || !landmark) return onLabel(null);
    projected.copy(landmark.anchor).project(camera);
    const x = ((projected.x + 1) * canvas.clientWidth) / 2;
    const y = ((1 - projected.y) * canvas.clientHeight) / 2;
    if (
      projected.z < -1 ||
      projected.z > 1 ||
      x < 64 ||
      x > canvas.clientWidth - 64 ||
      y < 32 ||
      y > canvas.clientHeight - 12
    )
      return onLabel(null);
    // Orthographic rays are parallel, including rays used to test label occlusion.
    camera.getWorldDirection(cameraDirection);
    raycaster.ray.direction.copy(cameraDirection);
    raycaster.ray.origin
      .copy(landmark.anchor)
      .addScaledVector(cameraDirection, -80);
    for (const obstacle of city.occluders) {
      if (obstacle.id === landmark.id) continue;
      if (
        raycaster.ray.intersectBox(obstacle.bounds, hit) &&
        hit.distanceTo(raycaster.ray.origin) < 79.98
      )
        return onLabel(null);
    }
    onLabel({ id: landmark.id, x, y });
  };

  let expanded = false;
  type Pose = { target: Vector3; orbit: Spherical; zoom: number };
  let transition: { from: Pose; to: Pose; start: number } | null = null;
  const currentPose = (): Pose => ({
    target: controls.target.clone(),
    orbit: new Spherical().setFromVector3(
      camera.position.clone().sub(controls.target),
    ),
    zoom: camera.zoom,
  });
  const applyPose = (pose: Pose) => {
    controls.target.copy(pose.target);
    camera.position
      .copy(pose.target)
      .add(new Vector3().setFromSpherical(pose.orbit));
    camera.zoom = pose.zoom;
    camera.updateProjectionMatrix();
    controls.update();
    onZoom(camera.zoom);
  };
  const stopTransition = (finish = false) => {
    const pending = transition;
    transition = null;
    if (finish && pending) applyPose(pending.to);
  };
  const update = (time: number) => {
    if (transition) {
      const { from, to, start } = transition;
      const progress = Math.min(1, (time - start) / 400);
      const eased = 1 - Math.pow(1 - progress, 3);
      applyPose({
        target: from.target.clone().lerp(to.target, eased),
        orbit: new Spherical(
          from.orbit.radius + (to.orbit.radius - from.orbit.radius) * eased,
          from.orbit.phi + (to.orbit.phi - from.orbit.phi) * eased,
          from.orbit.theta + (to.orbit.theta - from.orbit.theta) * eased,
        ),
        zoom: from.zoom + (to.zoom - from.zoom) * eased,
      });
      if (progress === 1) transition = null;
    }
    return transition !== null;
  };
  const invalidate = () => {
    if (host.isActive(cityView)) host.invalidate();
  };
  const minHalfWidth = 8.7;
  const minHalfHeight = 6.3;
  const resize = (width = canvas.clientWidth, height = canvas.clientHeight) => {
    if (!width || !height) return;
    const halfWidth = expanded
      ? Math.max(minHalfWidth, (minHalfHeight * width) / height)
      : minHalfWidth;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = (halfWidth * height) / width;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const cityView: SceneView = {
    scene,
    camera,
    resize,
    update,
    settle: () => stopTransition(true),
    activate() {
      controls.enabled = expanded && host.available;
      canvas.style.touchAction = expanded ? 'none' : 'auto';
    },
    deactivate() {
      controls.enabled = false;
      onLabel(null);
    },
    afterRender: updateLabel,
    dispose: () => controls.dispose(),
  };
  host.activate(cityView);
  controls.addEventListener('change', () => {
    onZoom(camera.zoom);
    invalidate();
  });
  controls.addEventListener('start', () => stopTransition());
  const focus = (id: CityDestinationId | null, animate = false) => {
    stopTransition();
    selected = id;
    hovered = null;
    mark(selection, id);
    mark(hover, null);
    const landmark = city.landmarks.find((place) => place.id === id);
    const target = landmark
      ? landmark.bounds.getCenter(new Vector3())
      : new Vector3(0, 1, 0);
    const overview = new Spherical().setFromVector3(new Vector3(12, 14, 17));
    const preset = id ? destinationPoses[id] : null;
    const to: Pose = {
      target,
      orbit: preset
        ? new Spherical(overview.radius, preset.phi, preset.theta)
        : overview,
      zoom:
        preset?.zoom ??
        // Zooming in only once height limits the frame, so the city's width is never cropped.
        (expanded &&
        minHalfHeight * canvas.clientWidth > minHalfWidth * canvas.clientHeight
          ? 1.12
          : 1),
    };
    const from = currentPose();
    to.orbit.theta =
      from.orbit.theta +
      Math.atan2(
        Math.sin(to.orbit.theta - from.orbit.theta),
        Math.cos(to.orbit.theta - from.orbit.theta),
      );
    if (animate && expanded && host.available && !document.hidden)
      transition = { from, to, start: performance.now() };
    else applyPose(to);
    resize();
    invalidate();
  };
  return {
    capture(): CityPose {
      stopTransition();
      return {
        position: camera.position.toArray(),
        target: controls.target.toArray(),
        zoom: camera.zoom,
      };
    },
    restore(pose: CityPose) {
      stopTransition();
      selected = hovered = null;
      mark(selection, null);
      mark(hover, null);
      camera.position.fromArray(pose.position);
      controls.target.fromArray(pose.target);
      camera.zoom = pose.zoom;
      controls.update();
      host.activate(cityView);
      onZoom(camera.zoom);
    },
    showCity() {
      host.activate(cityView);
    },
    showScene(view: SceneView) {
      host.activate(view);
    },
    invalidate: host.invalidate,
    get zoomLevel() {
      return camera.zoom;
    },
    setExpanded(value: boolean) {
      expanded = value;
      host.activate(cityView);
      controls.enabled = expanded && host.available;
      canvas.style.touchAction = expanded ? 'none' : 'auto';
      focus(null);
      resize();
    },
    zoom(factor: number) {
      stopTransition();
      camera.zoom = Math.min(
        controls.maxZoom,
        Math.max(controls.minZoom, camera.zoom * factor),
      );
      camera.updateProjectionMatrix();
      onZoom(camera.zoom);
      invalidate();
    },
    rotate(theta: number, phi = 0) {
      stopTransition();
      const offset = new Vector3().subVectors(camera.position, controls.target);
      const spherical = new Spherical().setFromVector3(offset);
      spherical.theta += theta;
      spherical.phi = Math.min(
        controls.maxPolarAngle,
        Math.max(controls.minPolarAngle, spherical.phi + phi),
      );
      camera.position
        .copy(controls.target)
        .add(offset.setFromSpherical(spherical));
      controls.update();
      invalidate();
    },
    focus,
    preview(id: CityDestinationId | null) {
      if (!host.isActive(cityView) || hovered === id) return;
      hovered = id;
      mark(hover, id === selected ? null : id);
      invalidate();
    },
    pick(clientX: number, clientY: number) {
      if (!expanded || !host.available || !host.isActive(cityView)) return null;
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        (-(clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      let nearest = Infinity;
      let destination: CityDestinationId | null = null;
      for (const obstacle of city.occluders) {
        if (!raycaster.ray.intersectBox(obstacle.bounds, hit)) continue;
        const distance = hit.distanceTo(raycaster.ray.origin);
        if (distance < nearest) {
          nearest = distance;
          destination = obstacle.id ?? null;
        }
      }
      return destination;
    },
    settle() {
      host.settle();
    },
    reset: () => focus(null),
  };
}
