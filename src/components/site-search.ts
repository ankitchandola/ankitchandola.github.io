export function mountSiteSearch(element: Element) {
  if (!(element instanceof HTMLDetailsElement)) return;
  const input = element.querySelector('input');
  const field = element.querySelector<HTMLElement>('.search-field');
  const status = element.querySelector('.search-status');
  const empty = element.querySelector<HTMLElement>('.search-empty');
  if (!input || !field || !status || !empty) return;
  const rows = [...element.querySelectorAll<HTMLElement>('[data-search-text]')];
  field.hidden = false;
  const filter = () => {
    const terms = input.value
      .toLocaleLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    let count = 0;
    for (const row of rows) {
      row.hidden = !terms.every((term) =>
        row.dataset.searchText?.toLocaleLowerCase().includes(term),
      );
      if (!row.hidden) count++;
    }
    status.textContent = `${count} ${count === 1 ? 'project' : 'projects'}${terms.length ? ' found' : ' to explore'}`;
    empty.hidden = count > 0;
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
    if (event.key === 'Escape' && element.open) {
      event.stopPropagation();
      element.open = false;
      element.querySelector('summary')?.focus();
    }
  };
  const focusout = (event: FocusEvent) => {
    if (
      event.relatedTarget instanceof Node &&
      !element.contains(event.relatedTarget)
    )
      element.open = false;
  };
  input.addEventListener('input', filter);
  element.addEventListener('toggle', toggle);
  element.addEventListener('keydown', keydown);
  element.addEventListener('focusout', focusout);
  document.addEventListener('pointerdown', outside);
  return () => {
    input.removeEventListener('input', filter);
    element.removeEventListener('toggle', toggle);
    element.removeEventListener('keydown', keydown);
    element.removeEventListener('focusout', focusout);
    document.removeEventListener('pointerdown', outside);
  };
}
