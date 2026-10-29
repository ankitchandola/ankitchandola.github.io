import { ACESFilmicToneMapping, VSMShadowMap, WebGLRenderer } from 'three';
import type { Camera, Scene } from 'three';

export interface SceneView {
  scene: Scene;
  camera: Camera;
  dynamicShadows?: boolean;
  resize(width: number, height: number): void;
  update(time: number): boolean;
  settle(): void;
  activate(): void;
  deactivate(): void;
  afterRender?(): void;
  shouldRender?(): boolean;
  dispose(): void;
}

export function createSceneHost(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) {
    console.warn(
      '3D city unavailable: WebGL2 is not supported. Using accessible artwork and activities.',
    );
    return null;
  }
  const renderer = new WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;
  let active: SceneView | null = null;
  let visible = false;
  let lost = false;
  let frame = 0;
  let width = 0;
  let height = 0;
  const draw = (time: number) => {
    frame = 0;
    if (!active || !visible || lost || document.hidden) return;
    if (active.shouldRender && !active.shouldRender()) return;
    const moving = active.update(time);
    if (active.dynamicShadows) renderer.shadowMap.needsUpdate = true;
    renderer.render(active.scene, active.camera);
    canvas.dataset.ready = 'true';
    active.afterRender?.();
    if (moving) invalidate();
  };
  const invalidate = (shadows = false) => {
    if (shadows) renderer.shadowMap.needsUpdate = true;
    if (!frame && active && visible && !lost && !document.hidden)
      frame = requestAnimationFrame(draw);
  };
  const resize = () => {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h) return;
    if (w !== width || h !== height) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
    }
    active?.resize(w, h);
    invalidate();
  };
  const stop = () => {
    active?.settle();
    cancelAnimationFrame(frame);
    frame = 0;
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (!visible) stop();
    else invalidate(true);
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else invalidate(true);
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    stop();
    active?.deactivate();
    delete canvas.dataset.ready;
    canvas.dispatchEvent(new Event('city-unavailable'));
    console.warn(
      '3D city context lost. Accessible activities remain available.',
    );
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    active?.activate();
    invalidate(true);
    canvas.dispatchEvent(new Event('city-available'));
  });
  return {
    get available() {
      return !lost;
    },
    isActive(view: SceneView) {
      return active === view;
    },
    activate(view: SceneView) {
      if (active !== view) {
        stop();
        active?.deactivate();
        active = view;
      }
      if (!lost) active.activate();
      resize();
      invalidate(true);
    },
    invalidate,
    resize,
    settle() {
      active?.settle();
      invalidate(true);
    },
  };
}
