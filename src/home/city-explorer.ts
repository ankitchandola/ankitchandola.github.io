import { createCityView, type CityPose } from './city-preview';
import { createArcadeActivity } from './city-scenes/arcade-activity';
import type { ArcadeView } from './city-scenes/arcade';
import {
  cityDestinations,
  isCityDestination,
  type CityDestinationId,
} from '../content/city';

export function mountCityExplorer(canvas: HTMLCanvasElement) {
  const preview = canvas.parentElement;
  const open = document.querySelector<HTMLButtonElement>('#city-open');
  const dialog = document.querySelector<HTMLDialogElement>('#city-dialog');
  const close = document.querySelector<HTMLButtonElement>('#city-close');
  const stage = document.querySelector<HTMLElement>('#city-dialog-stage');
  const hint = document.querySelector<HTMLElement>('#city-hint');
  const status = document.querySelector<HTMLElement>('#city-status');
  const zoomLabel = document.querySelector<HTMLElement>('#city-zoom');
  const label = document.querySelector<HTMLElement>('#city-label');
  const panelContainer = document.querySelector<HTMLElement>('#city-panels');
  const back = document.querySelector<HTMLButtonElement>('#city-back');
  if (
    !preview ||
    !open ||
    !dialog ||
    !close ||
    !stage ||
    !hint ||
    !status ||
    !zoomLabel ||
    !label ||
    !panelContainer ||
    !back
  )
    throw new Error('City explorer markup is incomplete.');
  const actions =
    dialog.querySelectorAll<HTMLButtonElement>('[data-city-action]');
  const destinations = dialog.querySelectorAll<HTMLButtonElement>(
    '[data-city-destination]',
  );
  const panels = dialog.querySelectorAll<HTMLElement>('[data-city-panel]');
  let selected: CityDestinationId | null = null;
  let returnPose: CityPose | null = null;
  let sectionLink: string | null = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () =>
    !reduced.matches && !document.body.classList.contains('motion-paused');
  let available = true,
    closing = false,
    scrollY = 0,
    previousTop = '';
  let entrance: Animation | undefined;
  let exit: Animation | undefined;
  let sceneTransition: Animation | undefined;
  let generation = 0;
  let arcadeScene: ArcadeView | null = null;
  let phase: 'closed' | 'overview' | 'loading' | 'active' | 'error' = 'closed';
  let useFlat = true;
  const pointers = new Map<number, { x: number; y: number }>();
  let gesturing = false;
  let tapped: CityDestinationId | null = null;
  let tappedMirror: string | null = null;
  const loading = dialog.querySelector<HTMLElement>('#arcade-loading');
  const retry = dialog.querySelector<HTMLButtonElement>('#arcade-retry');
  const fade = dialog.querySelector<HTMLElement>('#city-fade');
  const fullGame = dialog.querySelector<HTMLElement>('#arcade-full');
  if (!loading || !retry || !fade || !fullGame)
    throw new Error('Arcade scene markup is incomplete.');
  const setPhase = (next: typeof phase) => {
    phase = next;
    dialog.dataset.phase = next;
  };
  const updateZoom = (zoom: number) => {
    zoomLabel.textContent = Math.round(zoom * 100) + '%';
    actions.forEach((button) => {
      button.disabled =
        selected === 'arcade' ||
        (!available && button.dataset.cityAction !== 'reset') ||
        (button.dataset.cityAction === 'in' && zoom >= 2.2 - 0.001) ||
        (button.dataset.cityAction === 'out' && zoom <= 1.001);
    });
  };
  const view = createCityView(canvas, updateZoom, (position) => {
    label.hidden = !position;
    if (!position) return;
    label.textContent =
      cityDestinations.find(({ id }) => id === position.id)?.name ?? '';
    label.style.left = `${position.x}px`;
    label.style.top = `${position.y}px`;
  });
  available = view !== null;
  const activity = createArcadeActivity(
    dialog,
    (state, animate) => arcadeScene?.sync(state, animate),
    motionAllowed,
  );
  const presentation = () => {
    const visible = selected === 'arcade' && phase !== 'loading';
    dialog.dataset.presentation = useFlat ? 'flat' : '3d';
    activity.presentation(visible, useFlat);
    canvas.tabIndex =
      available && dialog.open && selected !== 'arcade' ? 0 : -1;
    canvas.setAttribute(
      'aria-label',
      selected === 'arcade'
        ? 'Ricochet puzzle table. Use the mirror and Fire controls below.'
        : 'Interactive 3D neighbourhood',
    );
    canvas.setAttribute(
      'aria-describedby',
      selected === 'arcade' ? 'arcade-result' : 'city-keyboard-help',
    );
  };
  const releaseScene = () => {
    sceneTransition?.cancel();
    if (arcadeScene) {
      view?.showCity();
      arcadeScene.dispose();
      arcadeScene = null;
    }
  };
  const loadArcade = async (animate: boolean) => {
    const request = ++generation;
    if (document.activeElement === retry)
      dialog
        .querySelector<HTMLElement>('#city-heading-arcade')
        ?.focus({ preventScroll: true });
    retry.hidden = true;
    loading.hidden = false;
    if (!available || !view) {
      setPhase('active');
      useFlat = true;
      loading.textContent = '3D unavailable. The same puzzle works here.';
      presentation();
      return;
    }
    setPhase('loading');
    loading.textContent = 'Opening the puzzle table…';
    presentation();
    try {
      const { createArcadeScene } = await import('./city-scenes/arcade');
      if (
        request !== generation ||
        !dialog.open ||
        selected !== 'arcade' ||
        !available
      )
        return;
      const room = createArcadeScene(
        canvas,
        activity.state,
        view.invalidate,
        (fits) => {
          useFlat = !fits;
          presentation();
        },
      );
      arcadeScene = room;
      setPhase('active');
      loading.hidden = true;
      view.showScene(room);
      if (animate && motionAllowed() && !useFlat) {
        sceneTransition = fade.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 180,
          easing: 'ease-out',
        });
      }
      presentation();
    } catch (error) {
      if (request !== generation || !dialog.open || selected !== 'arcade')
        return;
      releaseScene();
      console.warn(
        'Arcade 3D scene unavailable. Keeping the playable flat board.',
        error,
      );
      setPhase('error');
      useFlat = true;
      loading.textContent =
        'The 3D table could not open. You can still play below, or retry.';
      retry.hidden = false;
      presentation();
    }
  };
  retry.addEventListener('click', () => {
    void loadArcade(false);
  });
  const showDestination = (
    id: CityDestinationId | null,
    animate = false,
    focusHeading = false,
  ) => {
    for (const pointer of pointers.keys())
      if (canvas.hasPointerCapture(pointer))
        canvas.releasePointerCapture(pointer);
    pointers.clear();
    tapped = tappedMirror = null;
    ++generation;
    releaseScene();
    if (id && selected === null && returnPose === null)
      returnPose = view?.capture() ?? null;
    selected = id;
    fullGame.hidden = id !== 'arcade';
    dialog.dataset.destination = id ?? 'overview';
    panelContainer.hidden = id === null;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.cityPanel !== id;
      if (!panel.hidden) panel.scrollTop = 0;
    });
    destinations.forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.cityDestination === id),
      ),
    );
    if (id === 'arcade') {
      void loadArcade(animate);
    } else if (id === null && returnPose) {
      view?.restore(returnPose);
      returnPose = null;
    } else view?.focus(id, animate && motionAllowed());
    if (id !== 'arcade') {
      setPhase(id ? 'active' : 'overview');
      presentation();
    }
    updateAvailability();
    const name = cityDestinations.find((place) => place.id === id)?.name;
    status.textContent = name ? `${name} selected.` : 'City overview.';
    if (focusHeading && id)
      dialog
        .querySelector<HTMLElement>(`#city-heading-${id}`)
        ?.focus({ preventScroll: true });
  };
  const previewDestination = (id: CityDestinationId | null) => {
    view?.preview(id);
    destinations.forEach((button) => {
      button.toggleAttribute(
        'data-preview',
        button.dataset.cityDestination === id,
      );
    });
  };
  destinations.forEach((button) => {
    const id = button.dataset.cityDestination;
    if (!isCityDestination(id)) throw new Error('Unknown city destination.');
    button.addEventListener('click', (event) => {
      previewDestination(null);
      showDestination(id, event.detail > 0, true);
    });
    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') previewDestination(id);
    });
    button.addEventListener('pointerleave', () => {
      if (document.activeElement !== button) previewDestination(null);
    });
    button.addEventListener('focus', () => previewDestination(id));
    button.addEventListener('blur', () => previewDestination(null));
  });
  back.addEventListener('click', (event) => {
    const previous = selected;
    showDestination(null, event.detail > 0);
    if (previous)
      dialog
        .querySelector<HTMLButtonElement>(`#city-destination-${previous}`)
        ?.focus({ preventScroll: true });
  });
  const updateAvailability = () => {
    actions.forEach((button) => {
      button.disabled =
        selected === 'arcade' ||
        (!available && button.dataset.cityAction !== 'reset');
    });
    zoomLabel.hidden = !available;
    hint.textContent = available
      ? 'Drag to rotate. Pinch or scroll to zoom.'
      : '3D unavailable. Choose a destination to keep exploring.';
    hint.style.visibility = 'visible';
    status.textContent = available
      ? ''
      : '3D unavailable. Destinations and links remain available.';
    canvas.tabIndex =
      available && dialog.open && selected !== 'arcade' ? 0 : -1;
    if (available && view) updateZoom(view.zoomLevel);
    if (!available && dialog.open && document.activeElement === canvas)
      close.focus({ preventScroll: true });
  };
  canvas.addEventListener('city-unavailable', () => {
    available = false;
    ++generation;
    releaseScene();
    if (selected === 'arcade') void loadArcade(false);
    updateAvailability();
  });
  canvas.addEventListener('city-available', () => {
    available = true;
    if (selected === 'arcade') void loadArcade(false);
    else view?.focus(selected);
    updateAvailability();
  });
  updateAvailability();
  const used = () => {
    if (available && dialog.open) hint.style.visibility = 'hidden';
  };
  const finishClose = () => {
    if (!dialog.open || closing) return;
    closing = true;
    entrance?.cancel();
    view?.settle();
    dialog.close();
  };
  const requestClose = (animate: boolean) => {
    if (closing) return;
    ++generation;
    sceneTransition?.cancel();
    view?.settle();
    if (exit?.playState === 'running') {
      if (!animate) {
        exit.cancel();
        finishClose();
      }
      return;
    }
    if (!animate || !motionAllowed()) {
      finishClose();
      return;
    }
    entrance?.cancel();
    exit = dialog.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.97)' },
      ],
      { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
    exit.onfinish = finishClose;
  };
  open.hidden = false;
  open.addEventListener('click', (event) => {
    if (dialog.open) return;
    scrollY = window.scrollY;
    previousTop = document.body.style.top;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('city-is-open');
    dialog.showModal();
    stage.append(canvas);
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Interactive 3D neighbourhood');
    canvas.setAttribute('aria-describedby', 'city-keyboard-help');
    updateAvailability();
    view?.setExpanded(true);
    showDestination(null);
    close.focus({ preventScroll: true });
    if (event.detail > 0 && motionAllowed())
      entrance = dialog.animate(
        [
          { opacity: 0, transform: 'scale(0.97)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
  });
  close.addEventListener('click', (event) => requestClose(event.detail > 0));
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    requestClose(false);
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    if (
      !event.shiftKey &&
      selected === 'arcade' &&
      useFlat &&
      phase !== 'loading' &&
      document.activeElement?.id === 'city-heading-arcade'
    ) {
      event.preventDefault();
      stage
        .querySelector<HTMLButtonElement>('[data-board-fire]')
        ?.focus({ preventScroll: true });
      return;
    }
    const targets = [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], canvas[tabindex="0"]',
      ),
    ].filter((element) => element.getClientRects().length > 0);
    const first = targets[0];
    const last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  dialog.addEventListener('close', () => {
    entrance?.cancel();
    exit?.cancel();
    showDestination(null);
    setPhase('closed');
    activity.reset();
    previewDestination(null);
    pointers.clear();
    tapped = null;
    tappedMirror = null;
    canvas.style.cursor = '';
    preview.append(canvas);
    canvas.removeAttribute('role');
    canvas.removeAttribute('aria-label');
    canvas.removeAttribute('aria-describedby');
    canvas.removeAttribute('tabindex');
    view?.setExpanded(false);
    document.body.classList.remove('city-is-open');
    document.body.style.top = previousTop;
    if (sectionLink) {
      const heading = document.querySelector<HTMLElement>(`${sectionLink} h2`);
      if (!heading)
        throw new Error(`City destination heading not found: ${sectionLink}`);
      history.pushState(null, '', sectionLink);
      heading.setAttribute('tabindex', '-1');
      heading.scrollIntoView({ behavior: 'instant', block: 'start' });
      heading.focus({ preventScroll: true });
      heading.addEventListener(
        'blur',
        () => heading.removeAttribute('tabindex'),
        { once: true },
      );
      sectionLink = null;
    } else {
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      open.focus({ preventScroll: true });
    }
    closing = false;
  });
  let backdropStart = false;
  dialog.addEventListener('pointerdown', (event) => {
    const rect = dialog.getBoundingClientRect();
    backdropStart =
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom);
  });
  dialog.addEventListener('click', (event) => {
    if (backdropStart && event.target === dialog) requestClose(true);
    backdropStart = false;
  });
  dialog
    .querySelectorAll<HTMLAnchorElement>('a[data-city-section]')
    .forEach((link) => {
      link.addEventListener('click', (event) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        sectionLink = link.hash;
        requestClose(false);
      });
    });
  const act = (action: string | undefined) => {
    if (selected === 'arcade') return;
    if (action === 'reset') {
      showDestination(null);
      view?.reset();
      previewDestination(null);
      status.textContent = 'City view reset.';
      return;
    }
    if (!available || !view) return;
    used();
    switch (action) {
      case 'in':
        view.zoom(1.2);
        break;
      case 'out':
        view.zoom(1 / 1.2);
        break;
      case 'left':
        view.rotate(-Math.PI / 12);
        break;
      case 'right':
        view.rotate(Math.PI / 12);
        break;
      case 'up':
        view.rotate(0, -Math.PI / 24);
        break;
      case 'down':
        view.rotate(0, Math.PI / 24);
        break;
      case undefined:
      default:
        console.warn('Unknown city view action:', action);
    }
  };
  actions.forEach((button) =>
    button.addEventListener('click', () => act(button.dataset.cityAction)),
  );
  canvas.addEventListener('keydown', (event) => {
    if (
      !dialog.open ||
      !available ||
      selected === 'arcade' ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const keys: Record<string, string> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      '+': 'in',
      '=': 'in',
      '-': 'out',
      Home: 'reset',
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      act(action);
    }
  });
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (!dialog.open || !available || event.button !== 0) return;
      tapped = null;
      tappedMirror = null;
      if (!pointers.size) gesturing = false;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size > 1) gesturing = true;
      previewDestination(null);
    },
    true,
  );
  canvas.addEventListener('pointermove', (event) => {
    const start = pointers.get(event.pointerId);
    if (start) {
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) {
        gesturing = true;
        used();
      }
      return;
    }
    if (event.pointerType === 'mouse' && dialog.open && available) {
      if (selected === 'arcade') {
        canvas.style.cursor = arcadeScene?.pickMirror(
          event.clientX,
          event.clientY,
        )
          ? 'pointer'
          : '';
        return;
      }
      const id = view?.pick(event.clientX, event.clientY) ?? null;
      previewDestination(id);
      canvas.style.cursor = id ? 'pointer' : '';
    }
  });
  canvas.addEventListener('pointerup', (event) => {
    const start = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (!start || gesturing || pointers.size || !dialog.open) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6)
      return;
    if (selected === 'arcade')
      tappedMirror =
        arcadeScene?.pickMirror(event.clientX, event.clientY) ?? null;
    else tapped = view?.pick(event.clientX, event.clientY) ?? null;
  });
  canvas.addEventListener('click', () => {
    // Touch compatibility mouse events focus the canvas after pointerup.
    if (tapped && dialog.open) showDestination(tapped, true, true);
    if (tappedMirror && dialog.open && selected === 'arcade')
      activity.rotate(tappedMirror);
    tapped = null;
    tappedMirror = null;
  });
  canvas.addEventListener('pointercancel', (event) => {
    pointers.delete(event.pointerId);
    gesturing = true;
    tapped = null;
    tappedMirror = null;
  });
  canvas.addEventListener('pointerleave', () => {
    previewDestination(null);
    canvas.style.cursor = '';
  });
  canvas.addEventListener('wheel', used, { passive: true });
  const settleMotion = () => {
    if (motionAllowed()) return;
    view?.settle();
    entrance?.cancel();
    sceneTransition?.cancel();
    if (exit?.playState === 'running') {
      exit.cancel();
      finishClose();
    }
  };
  reduced.addEventListener('change', settleMotion);
  new MutationObserver(settleMotion).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });
}
