import {
  arcadeLevel,
  arcadeResult,
  initialArcadeState,
  updateArcade,
  type ArcadeAction,
  type ArcadeState,
} from './arcade-state';
import { beamPoints, place, toPath } from '../../play/board-path';
import '../../play/play.css';

export function createArcadeActivity(
  root: HTMLElement,
  changed: (state: ArcadeState, animate: boolean) => void,
  motionAllowed: () => boolean,
) {
  const flat = root.querySelector<HTMLElement>('#arcade-flat');
  const result = root.querySelector<HTMLElement>('#arcade-result');
  const svg = flat?.querySelector('svg');
  if (!flat || !result || !svg)
    throw new Error('Arcade activity markup is incomplete.');
  let state = initialArcadeState();
  const render = (animate = false) => {
    flat.dataset.instant = String(!animate || !motionAllowed());
    for (const [key, mirror] of Object.entries(state.mirrors)) {
      root
        .querySelectorAll<HTMLButtonElement>(
          `[data-board-mirror="${key}"], [data-arcade-mirror="${key}"]`,
        )
        .forEach((button) => {
          const [x, y] = key.split(',').map(Number);
          if (x === undefined || y === undefined)
            throw new Error('Invalid Arcade mirror key.');
          button.setAttribute(
            'aria-label',
            `${button.hasAttribute('data-arcade-mirror') ? 'Turn mirror' : 'Mirror'}, ${place(x, y)}, slanted ${mirror === '/' ? 'forward' : 'backward'}`,
          );
          if (button.hasAttribute('data-arcade-mirror'))
            button.textContent = 'Turn mirror';
        });
      svg
        .querySelector(`[data-mirror-key="${key}"] .rc-mirror`)
        ?.classList.toggle('is-back', mirror === '\\');
    }
    svg.querySelector('.rc-beam')?.remove();
    svg
      .querySelector('.rc-target')
      ?.classList.toggle('is-hit', state.shot?.outcome === 'hit');
    if (state.shot) {
      const points = beamPoints(arcadeLevel, state.shot);
      const beam = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      beam.setAttribute('class', 'rc-beam');
      beam.setAttribute('d', toPath(points));
      beam.setAttribute('pathLength', '1');
      beam.style.setProperty(
        '--draw',
        `${animate && motionAllowed() ? Math.min(600, points.length * 45) : 0}ms`,
      );
      svg.append(beam);
    }
    result.textContent = arcadeResult(state.shot);
    const reset = root.querySelector<HTMLButtonElement>(
      '[data-arcade-action="reset"]',
    );
    if (reset)
      reset.disabled =
        state.shot === null &&
        Object.entries(arcadeLevel.mirrors).every(
          ([key, value]) => state.mirrors[key] === value,
        );
  };
  const act = (action: ArcadeAction, animate: boolean) => {
    state = updateArcade(state, action);
    render(animate);
    changed(state, animate && motionAllowed());
  };
  root
    .querySelectorAll<HTMLButtonElement>(
      '[data-board-mirror], [data-arcade-mirror]',
    )
    .forEach((button) => {
      button.addEventListener('click', (event) => {
        const key = button.dataset.boardMirror ?? button.dataset.arcadeMirror;
        if (!key || !(key in state.mirrors))
          throw new Error('Unknown Arcade mirror.');
        act({ type: 'rotate', key }, event.detail > 0);
      });
    });
  root
    .querySelectorAll<HTMLButtonElement>(
      '[data-board-fire], [data-arcade-action]',
    )
    .forEach((button) => {
      button.addEventListener('click', (event) => {
        const type = button.hasAttribute('data-board-fire')
          ? 'fire'
          : button.dataset.arcadeAction;
        if (type !== 'fire' && type !== 'reset')
          throw new Error('Unknown Arcade action.');
        act({ type }, event.detail > 0);
      });
    });
  render();
  return {
    get state() {
      return state;
    },
    rotate(key: string) {
      act({ type: 'rotate', key }, true);
    },
    reset() {
      act({ type: 'reset' }, false);
    },
    presentation(visible: boolean, useFlat: boolean) {
      const focused =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const key = focused?.dataset.boardMirror ?? focused?.dataset.arcadeMirror;
      const previouslyFocused = flat.contains(focused);
      flat.hidden = !visible || !useFlat;
      root
        .querySelectorAll<HTMLButtonElement>('[data-arcade-mirror]')
        .forEach((button) => {
          button.hidden = visible && useFlat;
        });
      if (visible && key)
        root
          .querySelector<HTMLButtonElement>(
            `[${useFlat ? 'data-board-mirror' : 'data-arcade-mirror'}="${key}"]`,
          )
          ?.focus({ preventScroll: true });
      else if (visible && previouslyFocused && flat.hidden)
        root
          .querySelector<HTMLButtonElement>('[data-arcade-action="fire"]')
          ?.focus({ preventScroll: true });
    },
  };
}
