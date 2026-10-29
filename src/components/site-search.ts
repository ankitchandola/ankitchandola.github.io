export function mountSiteSearch(element: Element) {
  if (!(element instanceof HTMLDetailsElement)) return;
  const input = element.querySelector('input');
  const field = element.querySelector<HTMLElement>('.search-field');
  const status = element.querySelector('.search-status');
  const empty = element.querySelector<HTMLElement>('.search-empty');
  if (!input || !field || !status || !empty) return;
  const rows = [
    ...element.querySelectorAll<HTMLElement>(
      '.search-results:not(.search-sections) [data-search-text]',
    ),
  ];
  const sectionRows = [
    ...element.querySelectorAll<HTMLElement>(
      '.search-sections [data-search-text]',
    ),
  ];
  const group = element.querySelector<HTMLElement>('.search-group');
  const hint = element.querySelector<HTMLElement>('.search-hint');
  const close = element.querySelector<HTMLButtonElement>('.search-close');
  field.hidden = false;
  if (hint) hint.hidden = false;
  if (close) close.hidden = false;
  const dismiss = () => {
    element.open = false;
    element.querySelector('summary')?.focus();
  };
  const matches = (row: HTMLElement, terms: string[]) =>
    terms.every((term) =>
      row.dataset.searchText?.toLocaleLowerCase().includes(term),
    );
  const filter = () => {
    const terms = input.value
      .toLocaleLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    let count = 0;
    for (const row of rows) {
      row.hidden = !matches(row, terms);
      if (!row.hidden) count++;
    }
    let sectionCount = 0;
    for (const row of sectionRows) {
      row.hidden = !matches(row, terms);
      if (!row.hidden) sectionCount++;
    }
    if (group) group.hidden = sectionCount === 0;
    status.textContent = `${count} ${count === 1 ? 'project' : 'projects'}${terms.length ? ' found' : ' to explore'}`;
    empty.hidden = count + sectionCount > 0;
  };
  const toggle = () => {
    if (element.open) {
      filter();
      input.focus();
    }
  };
  const outside = (event: PointerEvent) => {
    if (event.target instanceof Node && !element.contains(event.target))
      element.open = false;
  };
  const keydown = (event: KeyboardEvent) => {
    if (
      element.open &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      const links = [
        ...element.querySelectorAll<HTMLElement>(
          '.search-results li:not([hidden]) a',
        ),
      ];
      if (!links.length) return;
      event.preventDefault();
      const current = links.indexOf(document.activeElement as HTMLElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next =
        current === -1
          ? step === 1
            ? 0
            : links.length - 1
          : (current + step + links.length) % links.length;
      links[next]?.focus();
      return;
    }
    if (event.key === 'Escape' && element.open) {
      event.stopPropagation();
      dismiss();
    }
  };
  const focusout = (event: FocusEvent) => {
    if (
      event.relatedTarget instanceof Node &&
      !element.contains(event.relatedTarget)
    )
      element.open = false;
  };
  // Both the desktop and phone headers mount a search; only the rendered one answers the shortcut.
  const shortcut = (event: KeyboardEvent) => {
    if (
      event.key.toLowerCase() !== 'k' ||
      !(event.metaKey || event.ctrlKey) ||
      !element.getClientRects().length
    )
      return;
    event.preventDefault();
    if (element.open) input.focus();
    else element.open = true;
  };
  input.addEventListener('input', filter);
  close?.addEventListener('click', dismiss);
  document.addEventListener('keydown', shortcut);
  element.addEventListener('toggle', toggle);
  element.addEventListener('keydown', keydown);
  element.addEventListener('focusout', focusout);
  document.addEventListener('pointerdown', outside);
  return () => {
    input.removeEventListener('input', filter);
    close?.removeEventListener('click', dismiss);
    element.removeEventListener('toggle', toggle);
    element.removeEventListener('keydown', keydown);
    element.removeEventListener('focusout', focusout);
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener('keydown', shortcut);
  };
}
