import { createCityView, type CityInsets, type CityPose } from './city-preview';
import { mountCityArcade } from './CityArcade';
import { cityArcade } from './city-arcade';
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
  const header = document.querySelector<HTMLElement>('.city-dialog-header');
  const footer = document.querySelector<HTMLElement>('.city-dialog-footer');
  const handle =
    document.querySelector<HTMLButtonElement>('#city-sheet-handle');
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
    !back ||
    !header ||
    !footer ||
    !handle
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
  const pointers = new Map<number, { x: number; y: number }>();
  let gesturing = false;
  let tapped: CityDestinationId | null = null;
  const arcadeStage = dialog.querySelector<HTMLElement>('#arcade-stage');
  const arcadeRoot = dialog.querySelector<HTMLElement>('#city-arcade-root');
  const fullGame = dialog.querySelector<HTMLElement>('#arcade-full');
  if (!arcadeStage || !arcadeRoot || !fullGame)
    throw new Error('Arcade scene markup is incomplete.');
  mountCityArcade(arcadeRoot);
  const setPhase = (next: 'closed' | 'overview' | 'active') => {
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
  // Bars spanning most of the width cover the top or bottom of the canvas; a tall, narrow panel
  // covers one side. Anything smaller floats over empty scenery and is ignored.
  const measure = (): CityInsets => {
    const box = dialog.getBoundingClientRect();
    const insets = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const element of [header, footer, panelContainer]) {
      if (!element.getClientRects().length) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width >= box.width / 2) {
        if (rect.top + rect.height / 2 < box.top + box.height / 2)
          insets.top = Math.max(insets.top, rect.bottom - box.top);
        else insets.bottom = Math.max(insets.bottom, box.bottom - rect.top);
      } else if (rect.height >= box.height / 2) {
        if (rect.left + rect.width / 2 > box.left + box.width / 2)
          insets.right = Math.max(insets.right, box.right - rect.left);
        else insets.left = Math.max(insets.left, rect.right - box.left);
      }
    }
    const headerRect = header.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    dialog.style.setProperty(
      '--city-top',
      `${Math.round(headerRect.bottom - box.top)}px`,
    );
    dialog.style.setProperty(
      '--city-bottom',
      `${Math.round(box.bottom - footerRect.top)}px`,
    );
    return {
      top: Math.round(insets.top),
      right: Math.round(insets.right),
      bottom: Math.round(insets.bottom),
      left: Math.round(insets.left),
    };
  };
  const reframe = () => {
    if (dialog.open) view?.setInsets(measure());
  };
  const layout = new ResizeObserver(reframe);
  for (const element of [dialog, header, footer, panelContainer])
    layout.observe(element);
  const setSheet = (expanded: boolean) => {
    if (expanded) dialog.dataset.sheet = 'expanded';
    else delete dialog.dataset.sheet;
    handle.setAttribute('aria-expanded', String(expanded));
    handle.setAttribute(
      'aria-label',
      expanded ? 'Collapse panel' : 'Expand panel',
    );
  };
  let sheetDrag: {
    pointer: number;
    startY: number;
    startHeight: number;
    moved: boolean;
  } | null = null;
  let suppressHandleClick = false;
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    sheetDrag = {
      pointer: event.pointerId,
      startY: event.clientY,
      startHeight: panelContainer.getBoundingClientRect().height,
      moved: false,
    };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', (event) => {
    if (!sheetDrag || event.pointerId !== sheetDrag.pointer) return;
    const delta = sheetDrag.startY - event.clientY;
    if (!sheetDrag.moved && Math.abs(delta) <= 6) return;
    sheetDrag.moved = true;
    dialog.dataset.sheetDragging = '';
    const top = header.getBoundingClientRect().bottom;
    const height = Math.min(
      dialog.clientHeight - top,
      Math.max(160, sheetDrag.startHeight + delta),
    );
    dialog.style.setProperty('--sheet-drag', `${height}px`);
  });
  const endSheetDrag = (event: PointerEvent) => {
    if (!sheetDrag || event.pointerId !== sheetDrag.pointer) return;
    if (sheetDrag.moved) {
      const height = panelContainer.getBoundingClientRect().height;
      const half = dialog.clientHeight * 0.55;
      const full = dialog.clientHeight - header.getBoundingClientRect().bottom;
      setSheet(height > (half + full) / 2);
      suppressHandleClick = true;
    }
    dialog.style.removeProperty('--sheet-drag');
    delete dialog.dataset.sheetDragging;
    sheetDrag = null;
  };
  handle.addEventListener('pointerup', endSheetDrag);
  handle.addEventListener('pointercancel', endSheetDrag);
  handle.addEventListener('click', () => {
    if (suppressHandleClick) {
      suppressHandleClick = false;
      return;
    }
    setSheet(dialog.dataset.sheet !== 'expanded');
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
    tapped = null;
    if (id && selected === null && returnPose === null)
      returnPose = view?.capture() ?? null;
    selected = id;
    const arcadeActive = id === 'arcade' && dialog.open;
    view?.setPaused(arcadeActive);
    cityArcade.setActive(arcadeActive);
    arcadeStage.hidden = id !== 'arcade';
    canvas.setAttribute('aria-hidden', String(id === 'arcade'));
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
    if (id === null) setSheet(false);
    if (dialog.open) view?.setInsets(measure(), true);
    if (id === 'arcade') {
      setPhase('active');
    } else if (id === null && returnPose) {
      view?.restore(returnPose);
      returnPose = null;
    } else view?.focus(id, animate && motionAllowed());
    if (id !== 'arcade') {
      setPhase(id ? 'active' : 'overview');
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
    updateAvailability();
  });
  canvas.addEventListener('city-available', () => {
    available = true;
    if (selected !== 'arcade') view?.focus(selected);
    updateAvailability();
  });
  updateAvailability();
  const used = () => {
    if (available && dialog.open) hint.style.visibility = 'hidden';
  };
  const finishClose = () => {
    if (!dialog.open || closing) return;
    closing = true;
    cityArcade.close();
    view?.setPaused(false);
    entrance?.cancel();
    view?.settle();
    dialog.close();
  };
  const requestClose = (animate: boolean) => {
    if (closing) return;
    cityArcade.setActive(false);
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
    cityArcade.open();
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
    cityArcade.close();
    entrance?.cancel();
    exit?.cancel();
    showDestination(null);
    setPhase('closed');
    previewDestination(null);
    pointers.clear();
    tapped = null;
    canvas.style.cursor = '';
    preview.append(canvas);
    canvas.removeAttribute('role');
    canvas.removeAttribute('aria-label');
    canvas.removeAttribute('aria-describedby');
    canvas.removeAttribute('aria-hidden');
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
      if (
        !dialog.open ||
        !available ||
        selected === 'arcade' ||
        event.button !== 0
      )
        return;
      tapped = null;
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
      if (selected === 'arcade') return;
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
    tapped = view?.pick(event.clientX, event.clientY) ?? null;
  });
  canvas.addEventListener('click', () => {
    // Touch compatibility mouse events focus the canvas after pointerup.
    if (tapped && dialog.open) showDestination(tapped, true, true);
    tapped = null;
  });
  canvas.addEventListener('pointercancel', (event) => {
    pointers.delete(event.pointerId);
    gesturing = true;
    tapped = null;
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
