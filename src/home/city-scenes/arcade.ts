import { arcadeLevel, type ArcadeState } from './arcade-state';
import { createRicochetTable } from '../../play/three/table';
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
  const table = createRicochetTable(arcadeLevel, state.mirrors);
  let active = false;
  let fits = false;
  const view: ArcadeView = {
    scene: table.scene,
    camera: table.camera,
    dynamicShadows: true,
    resize(width, height) {
      fits = table.resize(width, height);
      onFit(fits);
    },
    shouldRender: () => fits,
    update: (time) => table.update(time),
    sync(next, animate) {
      table.sync(next.mirrors, next.shot, animate && active && fits);
      invalidate(true);
    },
    pickMirror(clientX, clientY) {
      if (!active || !fits) return null;
      const rect = canvas.getBoundingClientRect();
      return table.pickMirror(clientX - rect.left, clientY - rect.top);
    },
    settle: () => table.settle(),
    activate() {
      active = true;
    },
    deactivate() {
      active = false;
      table.settle();
    },
    dispose() {
      active = false;
      table.dispose();
    },
  };
  view.sync(state, false);
  return view;
}
