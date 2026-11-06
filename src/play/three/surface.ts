import { ACESFilmicToneMapping, VSMShadowMap, WebGLRenderer } from 'three';
import type { Level, Mirrors, Shot } from '../model.ts';
import { cellRect, type CellRect } from './projection.ts';
import { createRicochetTable, type TableColors } from './table.ts';

export interface TableLayout {
  fits: boolean;
  mirrors: Map<string, CellRect>;
  source: CellRect;
}

export interface TableSurface {
  /** Sizes the canvas and returns where its mirrors and source sit, in canvas CSS pixels. */
  resize(width: number, height: number): TableLayout;
  setLevel(
    level: Level,
    mirrors: Mirrors,
    shot: Shot | null,
    animate: boolean,
  ): TableLayout;
  sync(mirrors: Mirrors, shot: Shot | null, animate: boolean): void;
  settle(): void;
  setActive(active: boolean): void;
  highlight(key: string | null): void;
  pickMirror(x: number, y: number): string | null;
  dispose(): void;
}

/** Returns null when WebGL2 is unavailable, so callers keep the flat board. */
export function createTableSurface(
  canvas: HTMLCanvasElement,
  level: Level,
  mirrors: Mirrors,
  onLost: () => void,
): TableSurface | null {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) return null;
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
  const table = createRicochetTable(level, mirrors);
  const applyColors = () => {
    const style = getComputedStyle(canvas);
    const colors: TableColors = {
      surface: style.getPropertyValue('--rc-surface').trim(),
      grid: style.getPropertyValue('--rc-table-grid').trim(),
      wall: style.getPropertyValue('--rc-table-wall').trim(),
      mirror: style.getPropertyValue('--rc-mirror').trim(),
      beam: style.getPropertyValue('--rc-beam').trim(),
      sourceMark: style.getPropertyValue('--rc-source-mark').trim(),
      target: style.getPropertyValue('--rc-target').trim(),
      targetRing: style.getPropertyValue('--rc-target-ring').trim(),
    };
    table.setColors(colors);
  };
  applyColors();
  let size = { width: 0, height: 0 };
  let fits = false;
  let active = false;
  let lost = false;
  let frame = 0;
  const draw = (time: number) => {
    frame = 0;
    if (!active || !fits || lost || document.hidden) return;
    const moving = table.update(time);
    renderer.render(table.scene, table.camera);
    canvas.dataset.ready = 'true';
    if (moving) invalidate();
  };
  const invalidate = () => {
    if (!frame && active && fits && !lost && !document.hidden)
      frame = requestAnimationFrame(draw);
  };
  const theme = new MutationObserver(() => {
    applyColors();
    invalidate();
  });
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  const stop = () => {
    table.settle();
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const layout = (): TableLayout => ({
    fits,
    mirrors: table.mirrorRects(),
    source: cellRect(
      table.camera,
      table.level,
      size,
      table.level.source.x,
      table.level.source.y,
    ),
  });
  const visibility = () => {
    if (document.hidden) stop();
    else invalidate();
  };
  document.addEventListener('visibilitychange', visibility);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionChanged = () => {
    if (reduced.matches || document.body.classList.contains('motion-paused')) {
      stop();
      invalidate();
    }
  };
  reduced.addEventListener('change', motionChanged);
  const motion = new MutationObserver(motionChanged);
  motion.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stop();
    delete canvas.dataset.ready;
    onLost();
  };
  canvas.addEventListener('webglcontextlost', contextLost);

  return {
    resize(width, height) {
      if (width !== size.width || height !== size.height) {
        size = { width, height };
        renderer.setSize(width, height, false);
      }
      fits = table.resize(width, height);
      invalidate();
      return layout();
    },
    setLevel(next, nextMirrors, shot, animate) {
      table.setLevel(next, nextMirrors, animate && active && fits);
      if (shot) table.sync(nextMirrors, shot, false);
      if (size.width) fits = table.resize(size.width, size.height);
      invalidate();
      return layout();
    },
    sync(next, shot, animate) {
      table.sync(next, shot, animate && active && fits);
      invalidate();
    },
    settle() {
      table.settle();
      invalidate();
    },
    setActive(next) {
      active = next;
      if (active) invalidate();
      else stop();
    },
    highlight(key) {
      table.highlight(key);
      invalidate();
    },
    pickMirror: (x, y) => table.pickMirror(x, y),
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', motionChanged);
      motion.disconnect();
      theme.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost);
      table.dispose();
      renderer.dispose();
      if (!lost) renderer.forceContextLoss();
    },
  };
}
